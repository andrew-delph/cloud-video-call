import * as common from 'common';
import {
  RetryError,
  realtionshipScoreCacheEx,
  mainRedisClient,
  neo4jRpcClient,
  stripUserId,
} from './matchmaker';
import {
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
} from 'common-messaging';
import { RelationshipScoreType } from 'common';

const logger = common.getLogger();

const getUserScoreZsetCacheKey = (userId: string) => {
  return `scorezset-${userId}`;
};

export function getRelationshipFilterCacheKey(
  userId1: string,
  userId2: string,
): string {
  if (userId1 > userId2) return getRelationshipFilterCacheKey(userId2, userId1);
  return `relationship-filter-${userId1}-${userId2}`;
}

export function getRealtionshipScoreCacheKey(
  userId1: string,
  userId2: string,
): string {
  if (userId1 > userId2) return getRealtionshipScoreCacheKey(userId2, userId1);
  return `relationship-score-${userId1}-${userId2}`;
}

export async function calcScoreZset(userId: string) {
  const activeUsers = await common.getRecentlyActiveUsers(mainRedisClient, 1);
  activeUsers.delete(userId);

  const activeRelationshipScores = await getRelationshipScores(
    userId,
    new Set(activeUsers),
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
  requestSet: Set<string>,
) {
  const relationshipScoresMap = new Map<string, RelationshipScoreType>();

  // get values that are in cache
  // pop from the readySet if in cache

  for (const otherId of requestSet.values()) {
    const relationshipScore: RelationshipScoreType = JSON.parse(
      (await mainRedisClient.get(
        getRealtionshipScoreCacheKey(userId, otherId),
      )) || `null`,
    );

    if (relationshipScore == null) continue;
    requestSet.delete(otherId);
    relationshipScoresMap.set(otherId, relationshipScore);
  }

  logger.debug(`relationship scores in cache: ${relationshipScoresMap.size}`);

  if (requestSet.size == 0) return Array.from(relationshipScoresMap.entries());

  // get relationship scores from neo4j
  const getRelationshipScoresRequest = new GetRelationshipScoresRequest();
  getRelationshipScoresRequest.setUserId(userId);
  getRelationshipScoresRequest.setOtherUsersList(Array.from(requestSet));

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
      requestSet.size
    } responded: ${getRelationshipScoresMap.getLength()}`,
  );

  // write them to the cache
  // store them in map
  for (const scoreEntry of getRelationshipScoresMap.entries()) {
    const scoreId = scoreEntry[0];
    const score = scoreEntry[1];
    const prob = score.getProb();
    const scoreVal = score.getScore();

    const score_obj = { prob, score: scoreVal };

    await mainRedisClient.set(
      getRealtionshipScoreCacheKey(userId, scoreId),
      JSON.stringify(score_obj),
      `EX`,
      realtionshipScoreCacheEx,
    );

    relationshipScoresMap.set(scoreId, score_obj);
  }

  return Array.from(relationshipScoresMap.entries());
}
