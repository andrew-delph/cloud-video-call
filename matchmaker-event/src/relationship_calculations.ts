import {
  RetryError,
  realtionshipScoreCacheEx,
  mainRedisClient,
  dataServiceClient,
  stripUserId,
  createFilterSet,
} from './matchmaker-event';
import { FilteredUserType, RelationshipScoreWrapper } from './types';
import * as common from 'common';
import {
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
  Score,
  makeGrpcRequest,
} from 'common-messaging';

const logger = common.getLogger();

const getUserScoreZsetCacheKey = (userId: string) => {
  return `scorezset-${userId}`;
};

export function getRealtionshipScoreCacheKey(
  userId1: string,
  userId2: string,
): string {
  if (userId1 > userId2) return getRealtionshipScoreCacheKey(userId2, userId1);
  return `relationship-score-${userId1}-${userId2}`;
}

export async function calcScoreZset(userId: string) {
  const activeUsers = await common.getRecentlyActiveUsers(mainRedisClient, 1);
  const filterSet = await createFilterSet(userId, activeUsers);

  const activeRelationshipScores = await getRelationshipScores(
    userId,
    filterSet,
  );

  for (let relationshipScore of activeRelationshipScores) {
    const otherId = relationshipScore[0];
    const scoreObj = relationshipScore[1];
    if (scoreObj.score <= -1) continue; // threshhold scores were way to low

    await addZsetScore(userId, otherId, scoreObj.score);
  }
}

export async function addZsetScore(
  userId: string,
  otherId: string,
  score: number,
) {
  try {
    await mainRedisClient.zadd(
      getUserScoreZsetCacheKey(userId),
      score + 0.0,
      otherId,
    );
    await expireScoreZset(userId, 60 * 5);
  } catch (e) {
    logger.error(`addZsetScore: score=${score} ${e}`);
  }
}

export async function calcScoreThreshold(
  userId: string,
  percentile: number,
): Promise<number> {
  const zsetScoreTotal = await mainRedisClient.zcard(
    getUserScoreZsetCacheKey(userId),
  );

  const index = Math.floor(percentile * (zsetScoreTotal - 1));

  const zrange = await mainRedisClient.zrange(
    getUserScoreZsetCacheKey(userId),
    index,
    index,
    `WITHSCORES`,
  );

  // zrange=${JSON.stringify(
  //   zrange,
  // )}

  logger.debug(
    `userId=${stripUserId(
      userId,
    )} zsetScoreTotal=${zsetScoreTotal} index=${index} score=${parseFloat(
      zrange[zrange.length - 1],
    )}`,
  );

  return parseFloat(zrange[zrange.length - 1]);
}

export async function expireScoreZset(userId: string, seconds: number) {
  await mainRedisClient.expire(getUserScoreZsetCacheKey(userId), seconds);
}

export async function deleteScoreZset(userId: string) {
  await mainRedisClient.del(getUserScoreZsetCacheKey(userId));
}

export async function getRelationshipScores(
  userId: string,
  filteredSet: Set<FilteredUserType>,
) {
  const filterList = Array.from(filteredSet);
  const relationshipScoresMap = new Map<string, RelationshipScoreWrapper>();

  // get values that are in cache
  // pop from the readySet if in cache

  for (const filter of filterList) {
    const relationshipScoreParsed: any = JSON.parse(
      (await mainRedisClient.get(
        getRealtionshipScoreCacheKey(userId, filter.otherId),
      )) || `null`,
    );
    if (relationshipScoreParsed == null) continue;
    const relationshipScore = new RelationshipScoreWrapper(
      relationshipScoreParsed,
    );
    relationshipScore.latest_match = filter.latest_match;
    relationshipScoresMap.set(filter.otherId, relationshipScore);
  }

  logger.debug(`relationship scores in cache: ${relationshipScoresMap.size}`);

  const filtersToRequest = filterList.filter(
    (filter) => !relationshipScoresMap.has(filter.otherId),
  );
  if (filtersToRequest.length == 0)
    return Array.from(relationshipScoresMap.entries());

  // get relationship scores from neo4j
  const getRelationshipScoresRequest = new GetRelationshipScoresRequest();
  getRelationshipScoresRequest.setUserId(userId);
  getRelationshipScoresRequest.setOtherUsersList(
    filtersToRequest.map((filter) => filter.otherId),
  );
  const getRelationshipScoresResponse = await makeGrpcRequest<
    GetRelationshipScoresRequest,
    GetRelationshipScoresResponse
  >(
    dataServiceClient,
    dataServiceClient.getRelationshipScores,
    getRelationshipScoresRequest,
  ).catch((e) => {
    logger.error(`getRelationshipScores`, e);
    throw new RetryError(e);
  });

  const getRelationshipScoresMap =
    getRelationshipScoresResponse.getRelationshipScoresMap();

  // write them to the cache
  // store them in map

  let countScores = 0;

  for (const filter of filtersToRequest) {
    const relationshipScore = getRelationshipScoresMap.get(filter.otherId);
    if (!relationshipScore) {
      logger.warn(`!relationshipScore ${relationshipScore}`);
      continue;
    }

    const prob = relationshipScore.getProb();
    const score = relationshipScore.getScore();
    const nscore = relationshipScore.getNscore();
    const otherId = filter.otherId;
    const latest_match = filter.latest_match;

    if (score >= 0) countScores = countScores + 1;

    const score_obj: RelationshipScoreWrapper = new RelationshipScoreWrapper({
      prob,
      score,
      otherId,
      latest_match,
      nscore,
    });

    await mainRedisClient.set(
      getRealtionshipScoreCacheKey(userId, otherId),
      JSON.stringify(score_obj),
      `EX`,
      realtionshipScoreCacheEx,
    );

    await addZsetScore(userId, otherId, score_obj.score);

    relationshipScoresMap.set(otherId, score_obj);
  }

  const testSet = new Set(filtersToRequest.map((filter) => filter.otherId));

  for (let entry of getRelationshipScoresMap.getEntryList()) {
    const otherId = entry[0];

    if (!testSet.has(otherId)) {
      logger.error(
        `RETURNED VALUE NOT REQUESTED. ${otherId} ???${relationshipScoresMap.has(
          otherId,
        )}`,
      );
    }
  }

  logger.debug(
    `relationship responed ${getRelationshipScoresMap.getLength()} of ${
      filtersToRequest.length
    } countScores ${countScores}`,
  );

  return Array.from(relationshipScoresMap.entries());
}
