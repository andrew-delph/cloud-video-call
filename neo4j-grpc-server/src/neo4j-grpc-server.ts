import {
  UserPreferences,
  compareUserFilters,
  readUserPreferences,
  writeUserPreferencesDatabase,
} from './UserPreferences';
import { user_created } from './metrics';
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
  Neo4jService,
  UpdateMatchRequest,
  UpdateMatchResponse,
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
} from 'common-messaging';
import { sendUserNotification } from 'common-messaging/src/message_helper';
import { initializeApp, getApp } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import * as neo4j from 'neo4j-driver';
import { v4 } from 'uuid';

common.listenGlobalExceptions(async () => {
  await promClient.stop();
  await server.forceShutdown();
});

let rabbitConnection: Connection;
let rabbitChannel: Channel;

const promClient = new common.PromClient(`neo4j-grpc-server`);

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

const verifyIndexes = async () => {
  const start_time = performance.now();

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
    `CREATE INDEX FEEDBACK_feedbackId IF NOT EXISTS FOR ()-[r:FEEDBACK]-() ON (r.feedbackId)`,
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
    reply.setRelationshipId1(`${r1_id}`);
    reply.setRelationshipId2(`${r2_id}`);
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

const updateMatch = (
  call: grpc.ServerUnaryCall<UpdateMatchRequest, UpdateMatchResponse>,
  callback: grpc.sendUnaryData<UpdateMatchResponse>,
): void => {
  // call.request.getUserId();
  const reply = new UpdateMatchResponse();
  reply.setMessage(`Updated match succesfully`);
  callback(null, reply);
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

  // check for relationships on redis

  const userEmbddings = await common.getRedisUserEmbeddings(
    redisClient,
    userId,
  );

  if (userEmbddings != null) {
    for (let otherId of otherUsers) {
      const otherEmbddings = await common.getRedisUserEmbeddings(
        redisClient,
        otherId,
      );

      if (otherEmbddings != null) {
        const score = defaultScore();
        const redisScore = cosineSimilarity(userEmbddings, otherEmbddings);

        logger.debug(
          `cosineSimilarity score is ${redisScore} for ${userId} and ${otherId}`,
        );

        score.setScore(redisScore);
        reply.getRelationshipScoresMap().set(otherId, score);
      }
    }
  }

  logger.debug(
    `scores's read from redis: ${reply
      .getRelationshipScoresMap()
      .getLength()} of ${otherUsers.length}`,
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
  call: grpc.ServerUnaryCall<CreateFeedbackRequest, StandardResponse>,
  callback: grpc.sendUnaryData<StandardResponse>,
): Promise<void> => {
  const userId = call.request.getUserId();
  const feedbackId = call.request.getFeedbackId();
  const score = call.request.getScore();
  const reply = new StandardResponse();

  if (!userId || !feedbackId) {
    logger.error(`! userId || !feedbackId`);
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `! userId || !feedbackId`,
    });
  }

  const start_time = performance.now();

  let session = driver.session();
  const feedback_rel = await session.run(
    `
      MATCH (n1:Person {userId: $userId})-[r:MATCHED]->(n2:Person)
      WHERE id(r) = $feedbackId
      MERGE (n1)-[f:FEEDBACK {feedbackId: $feedbackId, other: r.other}]->(n2)
      SET f.score = $score, f.createDate = datetime()
      return f , n2.userId as otherUser
    `,
    { score, userId, feedbackId },
  );

  if (feedback_rel.records.length != 1) {
    logger.error(
      `Failed to create feedback for ${feedbackId}. length: ${feedback_rel.records.length} `,
    );
    logger.error(
      `${feedbackId} feedback_rel=${JSON.stringify(feedback_rel.records)} `,
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
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
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
    { userId, feedbackId },
  );

  // unfriend
  let unblock_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $feedbackId}]->(n1:Person)
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
    { userId, feedbackId },
  );

  // create friend
  let friend_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $feedbackId}]->(n1:Person)
      WHERE f1.score > 0 AND f2.score > 0
      OPTIONAL MATCH (n1)-[r3:NEGATIVE]-(n2)
      OPTIONAL MATCH (n2)-[r4:NEGATIVE]-(n1)
      MERGE (n1)-[r1:FRIENDS]-(n2)
      MERGE (n2)-[r2:FRIENDS]-(n1)
      DELETE r3
      DELETE r4
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, feedbackId },
  );

  let negative_rel: neo4j.QueryResult = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
      WHERE f1.score < 0
      OPTIONAL MATCH (n1)-[r3:FRIENDS]-(n2)
      OPTIONAL MATCH (n2)-[r4:FRIENDS]-(n1)
      MERGE (n1)-[r1:NEGATIVE]-(n2)
      MERGE (n2)-[r2:NEGATIVE]-(n1)
      DELETE r3
      DELETE r4
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, feedbackId },
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
      sendUserNotification(
        rabbitChannel,
        otherUser,
        `Friend Request Accepted`,
        `${otherUser} has accepted your friend request`,
      );
    } else {
      sendUserNotification(
        rabbitChannel,
        otherUser,
        `Friend Request Recieved`,
        `You recieved a friend request from ${otherUser}`,
      );
    }

    logger.debug(
      `friends_created: ${friends_created} .... ${friend_rel.records.length}`,
    );
  }

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
  const page = common.tryParseInt(call.request.getPage(), 0);
  const limit = common.tryParseInt(call.request.getLimit(), 5);

  const skip = page * limit;

  const reply = new MatchHistoryResponse();

  const result: any = await session.run(
    `
    MATCH (n1:Person{userId: $userId})-[r1:MATCHED]->(n2:Person)
    OPTIONAL MATCH (n1:Person)-[r2:FEEDBACK{feedbackId:id(r1)}]->(n2:Person)
    OPTIONAL MATCH (n2:Person)-[r3:FEEDBACK{feedbackId:r1.other}]->(n1:Person)
    return n1.userId, n2.userId, r1.createDate, r2.score, r3.score,
    EXISTS((n1)-[:FRIENDS]-(n2)) AS friends,
    EXISTS((n1)-[:NEGATIVE]-(n2)) AS negative,
    id(r1) as feedbackId
    ORDER by r1.createDate DESC
    SKIP ${skip}
    LIMIT ${limit}
    `,
    { userId },
  );

  await session.close();

  for (const record of result.records) {
    const match = new Match();
    match.setUserId1(userId);
    match.setUserId2(record.get(`n2.userId`));
    match.setCreateTime(`${record.get(`r1.createDate`)}`);
    match.setUserId1Score(record.get(`r2.score`));
    match.setUserId2Score(record.get(`r3.score`));
    match.setFriends(record.get(`friends`));
    match.setNegative(record.get(`negative`));
    match.setFeedbackId(record.get(`feedbackId`));
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

server.addService(Neo4jService, {
  createUser,
  createMatch,
  updateMatch,
  getRelationshipScores,
  checkUserFilters,
  getUserPerferences,
  putUserPerferences,
  createFeedback,
  getMatchHistory,
});

const addr = `0.0.0.0:${process.env.PORT || 80}`;

server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), async () => {
  await verifyIndexes();

  [rabbitConnection, rabbitChannel] = await common.createRabbitMQClient();

  logger.info(`starting on: ${addr}`);
  server.start();
});
