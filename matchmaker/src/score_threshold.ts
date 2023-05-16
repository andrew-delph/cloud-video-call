import * as common from 'common';
import {
  getRelationshipScores,
  mainRedisClient,
  stripUserId,
} from './matchmaker';

const logger = common.getLogger();

const getUserScoreZsetCacheKey = (userId: string) => {
  return `scorezset-${userId}`;
};

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
