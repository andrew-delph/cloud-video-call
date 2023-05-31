import {
  RetryError,
  realtionshipScoreCacheEx,
  mainRedisClient,
  neo4jRpcClient,
  stripUserId,
  createFilterSet,
} from './matchmaker';
import { FilteredUserType, RelationshipScoreType } from './types';
import * as common from 'common';
import {
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
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

    await mainRedisClient.zadd(
      getUserScoreZsetCacheKey(userId),
      scoreObj.score,
      otherId,
    );
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

  logger.debug(
    `userId=${stripUserId(
      userId,
    )} zsetScoreTotal=${zsetScoreTotal} index=${index} zrange=${JSON.stringify(
      zrange,
    )} score=${parseFloat(zrange[zrange.length - 1])}`,
  );

  return parseFloat(zrange[zrange.length - 1]);
}

export async function expireScoreZset(userId: string, seconds: number) {
  await mainRedisClient.expire(getUserScoreZsetCacheKey(userId), seconds);
}

export async function getRelationshipScores(
  userId: string,
  filteredSet: Set<FilteredUserType>,
) {
  const filterList = Array.from(filteredSet);
  const relationshipScoresMap = new Map<string, RelationshipScoreType>();

  // get values that are in cache
  // pop from the readySet if in cache

  for (const filter of filterList) {
    const relationshipScore: RelationshipScoreType = JSON.parse(
      (await mainRedisClient.get(
        getRealtionshipScoreCacheKey(userId, filter.otherId),
      )) || `null`,
    );
    if (relationshipScore == null) continue;
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

  const getRelationshipScoresResponse =
    await new Promise<GetRelationshipScoresResponse>(
      async (resolve, reject) => {
        try {
          await neo4jRpcClient.getRelationshipScores(
            getRelationshipScoresRequest,
            (error: any, response: GetRelationshipScoresResponse) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            },
          );
        } catch (e) {
          reject(e);
        }
      },
    ).catch((e) => {
      logger.error(`getRelationshipScores`, e);
      throw new RetryError(e);
    });

  const getRelationshipScoresMap =
    getRelationshipScoresResponse.getRelationshipScoresMap();

  logger.debug(
    `relationship scores requested:${
      filtersToRequest.length
    } responded: ${getRelationshipScoresMap.getLength()}`,
  );

  // write them to the cache
  // store them in map

  for (const filter of filtersToRequest) {
    const relationshipScore = getRelationshipScoresMap.get(filter.otherId);
    if (!relationshipScore) continue;

    const prob = relationshipScore.getProb();
    const score = relationshipScore.getScore();
    const otherId = filter.otherId;
    const latest_match = filter.latest_match;
    const score_obj: RelationshipScoreType = {
      prob,
      score,
      otherId,
      latest_match,
    };

    await mainRedisClient.set(
      getRealtionshipScoreCacheKey(userId, otherId),
      JSON.stringify(score_obj),
      `EX`,
      realtionshipScoreCacheEx,
    );

    relationshipScoresMap.set(otherId, score_obj);
  }

  return Array.from(relationshipScoresMap.entries());
}
