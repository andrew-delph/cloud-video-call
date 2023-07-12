import {
  UserPreferences,
  compareUserFilters,
  readUserPreferences,
  writeUserPreferencesDatabase,
} from './UserPreferences';
import { user_created } from './metrics';
import * as milvus from './milvus';
import { cosineSimilarity } from './utils';
import { connect, Channel, ConsumeMessage, Connection } from 'amqplib';
import * as common from 'common';
import {
  CreateMatchRequest,
  CreateMatchResponse,
  CreateUserRequest,
  CreateUserResponse,
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
  DataServiceService,
  CheckUserFiltersResponse,
  CheckUserFiltersRequest,
  GetUserPerferencesRequest,
  GetUserPerferencesResponse,
  PutUserPerferencesResponse,
  PutUserPerferencesRequest,
  CreateFeedbackRequest,
  StandardResponse,
  Score,
  MatchHistoryResponse,
  MatchHistoryRequest,
  Match,
  grpc,
  FilterObject,
  EndCallRequest,
  InsertUserVectorsRequest,
} from 'common-messaging';
import {
  sendChatEventMessage,
  sendUserNotification,
} from 'common-messaging/src/message_helper';
import { initializeApp, getApp } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import * as neo4j from 'neo4j-driver';
import { v4 } from 'uuid';
import { collection_name } from './milvus';

common.listenGlobalExceptions(async () => {
  await promClient.stop();
  await server.forceShutdown();
});

let rabbitConnection: Connection;
let rabbitChannel: Channel;

const promClient = new common.PromClient(`data-service`);

promClient.startPush();

export const userPreferencesCacheEx = 60 * 60 * 2;
export const compareUserFiltersCacheEx = 10;

var server = new grpc.Server();

// const firebaseApp = initializeApp();

// const firebaseAuth = new Auth();

type Client = ReturnType<typeof common.createRedisClient>;
export const redisClient: Client = common.createRedisClient();

const serverID = v4();

const logger = common.getLogger();

export const driver = neo4j.driver(
  `bolt://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
  { disableLosslessIntegers: true },
);

const durationWarn = 2;

const initDataService = async () => {
  const start_time = performance.now();

  await milvus.initCollection();

  const session = driver.session();
  await session.run(
    `CREATE CONSTRAINT Person_userId IF NOT EXISTS FOR (p:Person) REQUIRE (p.userId) IS UNIQUE;`,
  );

  await session.run(
    `CREATE INDEX SIMILAR_TO_jobId IF NOT EXISTS  FOR ()-[r:SIMILAR_TO]-() ON (r.jobId);`,
  );

  await session.run(
    `CREATE INDEX PREDICTION_probability IF NOT EXISTS  FOR ()-[r:PREDICTION]-() ON (r.probability);`,
  );

  await session.run(
    `CREATE INDEX SIMILAR_probability IF NOT EXISTS  FOR ()-[r:SIMILAR]-() ON (r.score);`,
  );

  await session.run(
    `CREATE INDEX DISTANCE_probability IF NOT EXISTS  FOR ()-[r:DISTANCE]-() ON (r.distance);`,
  );

  await session.run(
    `CREATE INDEX MATCHED_createDate IF NOT EXISTS FOR ()-[r:MATCHED]-() ON (r.createDate)`,
  );

  await session.run(
    `CREATE INDEX FEEDBACK_createDate IF NOT EXISTS FOR ()-[r:FEEDBACK]-() ON (r.createDate)`,
  );

  await session.run(
    `CREATE INDEX FEEDBACK_feedbackId IF NOT EXISTS FOR ()-[r:FEEDBACK]-() ON (r.matchId)`,
  );

  await session.close();
  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`verifyIndexes duration:  ${duration}s`);
  } else {
    logger.debug(`verifyIndexes duration:  ${duration}s`);
  }
};

const createUser = async (
  call: grpc.ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
  callback: grpc.sendUnaryData<CreateUserResponse>,
): Promise<void> => {
  const userId = call.request.getUserId();
  const reply = new CreateUserResponse();

  const start_time = performance.now();

  const session = driver.session();
  const result = await session.run(
    `
      Merge (n:Person {userId: $userId}) return n.priority as priority;
      `,
    {
      userId: userId,
    },
  );
  await session.close();

  if (result.summary.counters.updates().nodesCreated > 0) {
    if (!common.isTestUser(userId)) {
      logger.info(`Created real user`);
    } else {
      logger.debug(`Created test user`);
    }
    user_created.inc({ test_user: `${common.isTestUser(userId)}` });
  }

  if (result.records.length != 1) {
    logger.error(`createUser result.records.length != 1`);
    callback(
      {
        code: grpc.status.UNKNOWN,
        details: `Failed to create/fetch user`,
        metadata: new grpc.Metadata(),
      },
      null,
    );
    return;
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createUser duration:  ${duration}s`);
  } else {
    logger.debug(
      `createUser duration:  ${duration}s hostname: ${process.env.HOSTNAME}`,
    );
  }

  callback(null, reply);
};

const createMatch = async (
  call: grpc.ServerUnaryCall<CreateMatchRequest, CreateMatchResponse>,
  callback: grpc.sendUnaryData<CreateMatchResponse>,
): Promise<void> => {
  const userId1 = call.request.getUserId1();
  const userId2 = call.request.getUserId2();
  const reply = new CreateMatchResponse();
  reply.setMessage(`Created match succesfully for: ${userId1} ${userId2}`);
  reply.setUserId1(userId1);
  reply.setUserId2(userId2);

  const start_time = performance.now();

  const session = driver.session();
  const matchResult = await session.run(
    `MATCH (a:Person), (b:Person) 
    WHERE a.userId = $userId1 AND b.userId = $userId2 
    CREATE (a)-[r1:MATCHED{createDate: datetime()}]->(b)
    CREATE (b)-[r2:MATCHED{createDate: datetime()}]->(a)
    set r1.other = id(r2)
    set r2.other = id(r1)
    RETURN id(r1), id(r2)
    `,
    {
      userId1: userId1,
      userId2: userId2,
    },
  );
  await session.close();

  if (matchResult.records.length != 1) {
    logger.error(
      `matchResult.records.length != 1 ${matchResult.records.length}`,
    );
    callback(
      {
        code: grpc.status.UNKNOWN,
        details: `matchResult.records.length != 1 ${matchResult.records.length}`,
        metadata: new grpc.Metadata(),
      },
      null,
    );
    return;
  }

  try {
    const r1_id = matchResult.records[0].get(`id(r1)`);
    const r2_id = matchResult.records[0].get(`id(r2)`);
    reply.setMatchId1(r1_id);
    reply.setMatchId2(r2_id);
  } catch (e: any) {
    logger.error(`stupid get error: ${e}`);
    callback(
      {
        code: grpc.status.UNKNOWN,
        details: `stupid get error: ${e}`,
        metadata: new grpc.Metadata(),
      },
      null,
    );
    return;
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createMatch duration:  ${duration}s`);
  } else {
    logger.debug(`createMatch duration:  ${duration}s`);
  }

  callback(null, reply);
};

const endCall = async (
  call: grpc.ServerUnaryCall<EndCallRequest, StandardResponse>,
  callback: grpc.sendUnaryData<StandardResponse>,
): Promise<void> => {
  const matchId = call.request.getMatchId();
  let session = driver.session();
  const max = 10;
  for (let i = 0; i <= max; i++) {
    try {
      const results = await session.run(
        `
            MATCH (n1:Person)-[r1:MATCHED]->(n2:Person),(n2:Person)-[r2:MATCHED]->(n1:Person)
            WHERE id(r1) = $matchId AND id(r2) = r1.other
            SET r1.endDate = COALESCE(r1.endDate, datetime()), 
            r2.endDate = COALESCE(r2.endDate, datetime())
            return r1,r2
          `,
        { matchId },
      );
      if (results.records.length != 1) {
        logger.error(`endCall length: ${results.records.length}`);
        return callback({
          code: grpc.status.NOT_FOUND,
          message: `results.records.length = ${results.records.length}`,
        });
      }
      break;
    } catch (err) {
      if (i == max) {
        logger.error(`Max backoff for endDate update reached.`, err);
        return callback({
          code: grpc.status.NOT_FOUND,
          message: `Max backoff for endDate update reached.`,
        });
      }
      const sleep = i * 1000;
      logger.warn(
        `Failed to update endDate for Match. Sleeping ${sleep}ms`,
        err,
      );
      await common.delay(sleep);
    }
  }
  await session.close();
  callback(null, new StandardResponse());
};

function defaultScore() {
  const score = new Score();
  score.setProb(-1);
  score.setScore(-1);
  score.setNscore(0);
  return score;
}

const getRelationshipScores = async (
  call: grpc.ServerUnaryCall<
    GetRelationshipScoresRequest,
    GetRelationshipScoresResponse
  >,
  callback: grpc.sendUnaryData<GetRelationshipScoresResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const userId = call.request.getUserId();
  let otherUsers = call.request.getOtherUsersList();
  const reply = new GetRelationshipScoresResponse();

  const userVectors = await milvus.retrieveVector(collection_name, userId);

  if (userVectors != null && userVectors.data.length > 0) {
    const lastUserVector: number[] =
      userVectors.data[userVectors.data.length - 1].vector;

    const searchResults = await milvus.queryVector(
      collection_name,
      lastUserVector,
      userId,
      otherUsers,
    );

    for (let result of searchResults.results) {
      const otherId = result.name;

      if (reply.getRelationshipScoresMap().has(otherId)) continue;
      const scoreMessage = defaultScore();

      const scoreVal = result.score;

      logger.debug(
        `queryVector: [${userId}, ${otherId}, ${scoreVal}, ${typeof scoreVal}]`,
      );

      scoreMessage.setScore(scoreVal);
      reply.getRelationshipScoresMap().set(otherId, scoreMessage);
    }
  }

  logger.debug(
    `scores's from mulvis: ${reply.getRelationshipScoresMap().getLength()} of ${
      otherUsers.length
    }`,
  );

  const session = driver.session();
  const result = await session.run(
    `UNWIND $otherUsers AS otherId
      MATCH (n1:Person{userId: $target})
      MATCH (n2:Person{userId: otherId})
      OPTIONAL MATCH (n1)-[prel:PREDICTION]->(n2)
      WITH n1, n2, prel
      return
      EXISTS((n1)-[:FRIENDS]->(n2)) as friends, 
      coalesce(prel.probability, -1) as prob, 
      round(n2.priority,3) as p2,
      n1.userId as targetId,
      n2.userId as otherId,
      gds.alpha.linkprediction.adamicAdar(n1, n2, {relationshipQuery: 'NEGATIVE'}) as nscore
      ORDER BY prob DESC, p2 DESC
      `,
    { target: userId, otherUsers: otherUsers },
  );

  await session.close();

  logger.debug(
    `getRelationshipScores length:${result.records.length} requested: ${otherUsers.length}`,
  );

  const length = result.records.length;
  for (const [i, record] of result.records.entries()) {
    const otherId = record.get(`otherId`);
    const prob = record.get(`prob`);
    const nscore = record.get(`nscore`);
    const index = length - i;
    if (i == 0) {
      logger.debug(
        `prob:${prob} nscore:${nscore} length:${length} index:${index}  userId:${userId}  otherId:${otherId}  otherUsers:${otherUsers}`,
      );
    }

    const score =
      reply.getRelationshipScoresMap().get(otherId) ?? defaultScore();

    score.setProb(prob);
    score.setNscore(nscore);

    reply.getRelationshipScoresMap().set(otherId, score);
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScores duration:  ${duration}s`);
  } else {
    logger.debug(`getRelationshipScores duration:  ${duration}s`);
  }

  callback(null, reply);
};

const createFeedback = async (
  call: grpc.ServerUnaryCall<CreateFeedbackRequest, Match>,
  callback: grpc.sendUnaryData<Match>,
): Promise<void> => {
  const userId = call.request.getUserId();
  const matchId = call.request.getMatchId();
  const score = call.request.getScore();
  const reply = new Match();

  if (!userId || !matchId) {
    logger.error(`!userId ${userId} || !matchId ${matchId}`);
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `!userId ${userId} || !matchId ${matchId}`,
    });
  }

  const start_time = performance.now();

  let session = driver.session();
  const feedback_rel = await session.run(
    `
      MATCH (n1:Person {userId: $userId})-[r:MATCHED]->(n2:Person)
      WHERE id(r) = $matchId
      MERGE (n1)-[f:FEEDBACK {matchId: $matchId, other: r.other}]->(n2)
      SET f.score = $score, f.createDate = datetime()
      return f , n2.userId as otherUser
    `,
    { score, userId, matchId },
  );

  if (feedback_rel.records.length != 1) {
    logger.error(
      `Failed to create feedback for ${matchId}. length: ${feedback_rel.records.length} `,
    );
    logger.error(
      `${matchId} feedback_rel=${JSON.stringify(feedback_rel.records)} `,
    );
    return callback({
      code: grpc.status.UNKNOWN,
      message: `Feedback not created.`,
    });
  }

  const otherUser = feedback_rel.records[0].get(`otherUser`);

  // unfriend
  let unfriend_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{matchId: $matchId}]->(n2:Person)
      WHERE f1.score = 0
      OPTIONAL MATCH (n1)-[r3:FRIENDS]-(n2)
      OPTIONAL MATCH (n2)-[r4:FRIENDS]-(n1)
      OPTIONAL MATCH (n1)-[r5:NEGATIVE]-(n2)
      OPTIONAL MATCH (n2)-[r6:NEGATIVE]-(n1)
      DELETE r3
      DELETE r4
      // DELETE r5
      // DELETE r6
      return n1.userId, n2.userId
    `,
    { userId, matchId },
  );

  // unfriend
  let unblock_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{matchId: $matchId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $matchId}]->(n1:Person)
      WHERE f1.score >= 0 AND f2.score >= 0
      OPTIONAL MATCH (n1)-[r3:FRIENDS]-(n2)
      OPTIONAL MATCH (n2)-[r4:FRIENDS]-(n1)
      OPTIONAL MATCH (n1)-[r5:NEGATIVE]-(n2)
      OPTIONAL MATCH (n2)-[r6:NEGATIVE]-(n1)
      // DELETE r3
      // DELETE r4
      DELETE r5
      DELETE r6
      return n1.userId, n2.userId
    `,
    { userId, matchId },
  );

  // create friend
  let friend_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{matchId: $matchId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $matchId}]->(n1:Person)
      WHERE f1.score > 0 AND f2.score > 0
      OPTIONAL MATCH (n1)-[r3:NEGATIVE]-(n2)
      OPTIONAL MATCH (n2)-[r4:NEGATIVE]-(n1)
      MERGE (n1)-[r1:FRIENDS]-(n2)
      MERGE (n2)-[r2:FRIENDS]-(n1)
      DELETE r3
      DELETE r4
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, matchId },
  );

  let negative_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{matchId: $matchId}]->(n2:Person)
      WHERE f1.score < 0
      OPTIONAL MATCH (n1)-[r3:FRIENDS]-(n2)
      OPTIONAL MATCH (n2)-[r4:FRIENDS]-(n1)
      MERGE (n1)-[r1:NEGATIVE]-(n2)
      MERGE (n2)-[r2:NEGATIVE]-(n1)
      DELETE r3
      DELETE r4
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, matchId },
  );

  logger.debug(
    `Created unfriend_rel:${JSON.stringify(
      unfriend_rel.summary.updateStatistics,
    )} unblock_rel:${JSON.stringify(
      unblock_rel.summary.updateStatistics,
    )} friend_rel:${JSON.stringify(
      friend_rel.summary.updateStatistics,
    )} negative_rel:${JSON.stringify(
      negative_rel.summary.updateStatistics,
    )} with score: ${score}`,
  );

  if (score > 0) {
    const friends_created =
      friend_rel.summary.updateStatistics.updates().relationshipsCreated;
    if (friends_created) {
      await Promise.all([
        sendUserNotification(
          rabbitChannel,
          otherUser,
          `Friend Request Accepted`,
          `${userId} has accepted your friend request`,
        ),
        sendUserNotification(
          rabbitChannel,
          userId,
          `Friend Request Accepted`,
          `${otherUser} has accepted your friend request`,
        ),
        sendChatEventMessage(
          rabbitChannel,
          userId,
          otherUser,
          `Friends make life a lot more fun.`,
          true,
        ),
      ]);
    } else {
      await sendUserNotification(
        rabbitChannel,
        otherUser,
        `Friend Request Recieved`,
        `You recieved a friend request from ${userId}`,
      );
    }

    logger.debug(
      `friends_created: ${friends_created} .... ${friend_rel.records.length}`,
    );
  }

  const result = await session.run(
    `
    MATCH (n1:Person{userId: $userId})-[r1:MATCHED]->(n2:Person)
    WHERE id(r1) = $matchId
    OPTIONAL MATCH (n1:Person)-[r2:FEEDBACK{matchId:id(r1)}]->(n2:Person)
    OPTIONAL MATCH (n2:Person)-[r3:FEEDBACK{matchId:r1.other}]->(n1:Person)
    return n1.userId, n2.userId, r1.createDate, r1.endDate, r2.score, r3.score,
    EXISTS((n1)-[:FRIENDS]-(n2)) AS friends,
    EXISTS((n1)-[:NEGATIVE]-(n2)) AS negative,
    id(r1) as matchId
    LIMIT 1
    `,
    { userId, matchId },
  );

  const record = result.records[0];
  reply.setUserId1(userId);
  reply.setUserId2(record.get(`n2.userId`));
  reply.setCreateTime(`${record.get(`r1.createDate`)}`);
  reply.setEndTime(`${record.get(`r1.endDate`)}`);
  reply.setUserId1Score(record.get(`r2.score`));
  reply.setUserId2Score(record.get(`r3.score`));
  reply.setFriends(record.get(`friends`));
  reply.setNegative(record.get(`negative`));
  reply.setMatchId(record.get(`matchId`));

  await session.close();

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createFeedback duration:  ${duration}s`);
  } else {
    logger.debug(`createFeedback duration:  ${duration}s`);
  }

  callback(null, reply);
};

const checkUserFilters = async (
  call: grpc.ServerUnaryCall<CheckUserFiltersRequest, CheckUserFiltersResponse>,
  callback: grpc.sendUnaryData<CheckUserFiltersResponse>,
): Promise<void> => {
  const start_time = performance.now();
  const session = driver.session();

  const reply = new CheckUserFiltersResponse();

  for (let requestFilter of call.request.getFiltersList()) {
    const responseFilter = new FilterObject();

    const passed = await compareUserFilters(
      requestFilter.getUserId1(),
      requestFilter.getUserId2(),
    );
    responseFilter.setPassed(passed);
    responseFilter.setUserId1(requestFilter.getUserId1());
    responseFilter.setUserId2(requestFilter.getUserId2());

    // if (!passed) continue;

    const results = await session.run(
      `
      MATCH (n:Person{userId: $userId1})-[r:MATCHED]-(m:Person{userId: $userId2})
      RETURN n.userId, m.userId, r.createDate, 
      exists((n)-[:FRIENDS]-(m)) AS friends,
      exists((n)-[:NEGATIVE]-(m)) AS negative
      ORDER by r.createDate DESC
      LIMIT 1
      `,
      {
        userId1: requestFilter.getUserId1(),
        userId2: requestFilter.getUserId2(),
      },
    );

    if (results.records.length > 0) {
      responseFilter.setLastMatchedTime(
        `${results.records[0].get(`r.createDate`)}`,
      );
      responseFilter.setFriends(results.records[0].get(`friends`));
      responseFilter.setNegative(results.records[0].get(`negative`));
    }
    reply.addFilters(responseFilter);
  }
  await session.close();

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`checkUserFilters duration:  ${duration}s`);
  } else {
    logger.debug(`checkUserFilters duration:  ${duration}s`);
  }

  callback(null, reply);
};

const getUserPerferences = async (
  call: grpc.ServerUnaryCall<
    GetUserPerferencesRequest,
    GetUserPerferencesResponse
  >,
  callback: grpc.sendUnaryData<GetUserPerferencesResponse>,
): Promise<void> => {
  const start_time = performance.now();
  const uid = call.request.getUserId();
  const reply = new GetUserPerferencesResponse();

  const user1Data = await readUserPreferences(uid);

  try {
    Object.entries(user1Data.a_constant || {}).forEach(([key, value]) => {
      reply.getAttributesConstantMap().set(String(key), String(value));
    });
    Object.entries(user1Data.a_custom || {}).forEach(([key, value]) => {
      reply.getAttributesCustomMap().set(String(key), String(value));
    });
    Object.entries(user1Data.f_constant || {}).forEach(([key, value]) => {
      reply.getFiltersConstantMap().set(String(key), String(value));
    });
    Object.entries(user1Data.f_custom || {}).forEach(([key, value]) => {
      reply.getFiltersCustomMap().set(String(key), String(value));
    });
    reply.setPriority(
      user1Data.priority ||
        (await common.getRedisUserPriority(redisClient, uid)) ||
        -1,
    );
  } catch (e) {
    logger.error(`getUserPerferences`, e);
    callback({ code: grpc.status.INTERNAL, message: String(e) }, null);
    return;
  }

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`getUserPerferences duration:  ${duration}s`);
  } else {
    logger.debug(`getUserPerferences duration:  ${duration}s`);
  }

  callback(null, reply);
};

const putUserPerferences = async (
  call: grpc.ServerUnaryCall<
    PutUserPerferencesRequest,
    PutUserPerferencesResponse
  >,
  callback: grpc.sendUnaryData<PutUserPerferencesResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const request = call.request;
  const userId = call.request.getUserId();
  const reply = new PutUserPerferencesResponse();

  const a_custom: { [key: string]: string } = {};
  const a_constant: { [key: string]: string } = {};
  const f_custom: { [key: string]: string } = {};
  const f_constant: { [key: string]: string } = {};

  try {
    request
      .getAttributesConstantMap()
      .getEntryList()
      .forEach(([key, value]: [string, string]) => {
        a_constant[key] = value;
      });
    request
      .getAttributesCustomMap()
      .getEntryList()
      .forEach(([key, value]: [string, string]) => {
        a_custom[key] = value;
      });
    request
      .getFiltersConstantMap()
      .getEntryList()
      .forEach(([key, value]: [string, string]) => {
        f_constant[key] = value;
      });
    request
      .getFiltersCustomMap()
      .getEntryList()
      .forEach(([key, value]: [string, string]) => {
        f_custom[key] = value;
      });
  } catch (e) {
    logger.error(`putUserPerferences`, e);
    callback({ message: String(e), code: grpc.status.INTERNAL }, null);
    return;
  }

  await writeUserPreferencesDatabase(userId, {
    a_constant,
    f_constant,
    a_custom,
    f_custom,
    priority: 0,
  })
    .then(() => {
      const duration = (performance.now() - start_time) / 1000;
      if (duration > durationWarn) {
        logger.warn(`putUserPerferences duration:  ${duration}s`);
      } else {
        logger.debug(`putUserPerferences duration:  ${duration}s`);
      }

      callback(null, reply);
    })
    .catch((e) => {
      logger.error(`putUserPerferences`, e);
      callback({ code: grpc.status.INTERNAL, message: String(e) }, null);
    });
};

const getMatchHistory = async (
  call: grpc.ServerUnaryCall<MatchHistoryRequest, MatchHistoryResponse>,
  callback: grpc.sendUnaryData<MatchHistoryResponse>,
): Promise<void> => {
  const start_time = performance.now();
  const session = driver.session();
  const userId = call.request.getUserId();
  const skip = common.tryParseInt(call.request.getSkip(), 0);
  const limit = common.tryParseInt(call.request.getLimit(), 5);

  const reply = new MatchHistoryResponse();

  const result: any = await session.run(
    `
    MATCH (n1:Person{userId: $userId})-[r1:MATCHED]->(n2:Person)
    OPTIONAL MATCH (n1:Person)-[r2:FEEDBACK{matchId:id(r1)}]->(n2:Person)
    OPTIONAL MATCH (n2:Person)-[r3:FEEDBACK{matchId:r1.other}]->(n1:Person)
    return n1.userId, n2.userId, r1.createDate, r1.endDate, r2.score, r3.score,
    EXISTS((n1)-[:FRIENDS]-(n2)) AS friends,
    EXISTS((n1)-[:NEGATIVE]-(n2)) AS negative,
    id(r1) as matchId
    ORDER by r1.createDate DESC
    SKIP ${skip}
    LIMIT ${limit}
    `,
    { userId },
  );

  const count_result: any = await session.run(
    `
    MATCH (n1:Person{userId: $userId})-[r1:MATCHED]->(n2:Person)
    return count(r1) as total
    `,
    { userId },
  );

  await session.close();
  const total = count_result.records[0].get(`total`);

  reply.setTotal(total);

  for (const record of result.records) {
    const match = new Match();
    match.setUserId1(userId);
    match.setUserId2(record.get(`n2.userId`));
    match.setCreateTime(`${record.get(`r1.createDate`)}`);
    match.setEndTime(`${record.get(`r1.endDate`)}`);
    match.setUserId1Score(record.get(`r2.score`));
    match.setUserId2Score(record.get(`r3.score`));
    match.setFriends(record.get(`friends`));
    match.setNegative(record.get(`negative`));
    match.setMatchId(record.get(`matchId`));
    reply.addMatchHistory(match);
  }

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`getUserPerferences duration:  ${duration}s`);
  } else {
    logger.debug(`getUserPerferences duration:  ${duration}s`);
  }

  callback(null, reply);
};

const insertUserVectors = async (
  call: grpc.ServerUnaryCall<InsertUserVectorsRequest, StandardResponse>,
  callback: grpc.sendUnaryData<StandardResponse>,
): Promise<void> => {
  const insertUserVectorsRequest = call.request;

  const userVectorList = insertUserVectorsRequest.getUserVectorsList();

  logger.debug(`insertUserVectors with ${userVectorList.length} vectors`);

  const fields_data: milvus.FieldData[] = [];

  for (const userVector of userVectorList) {
    const userId = userVector.getUserId();
    const vector = userVector.getVectorList();

    logger.debug(`insert userId ${userId} length ${vector.length}`);
    fields_data.push({ name: userId, vector });
  }

  await milvus
    .insertData(collection_name, fields_data)
    .then((result) => {
      const reply = new StandardResponse();

      callback(null, reply);
    })
    .catch((err) => {
      logger.error(
        `insertUserVectors ERROR. collection_name: ${collection_name} ${err}`,
      );
      callback({ code: grpc.status.INTERNAL, message: String(err) }, null);
    });
};

server.addService(DataServiceService, {
  createUser,
  createMatch,
  endCall,
  getRelationshipScores,
  checkUserFilters,
  getUserPerferences,
  putUserPerferences,
  createFeedback,
  getMatchHistory,
  insertUserVectors,
});

const addr = `0.0.0.0:${process.env.PORT || 80}`;

server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), async () => {
  await initDataService();

  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  logger.info(`starting on: ${addr}`);
  server.start();
});
