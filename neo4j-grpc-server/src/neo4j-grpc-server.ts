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
} from 'common-messaging';
import * as neo4j from 'neo4j-driver';
import * as common from 'common';
import { v4 } from 'uuid';
import {
  UserPreferences,
  compareUserFilters,
  readUserPreferences,
  writeUserPreferencesDatabase,
} from './UserPreferences';
import { cosineSimilarity } from './utils';

common.listenGlobalExceptions(async () => {
  await server.tryShutdown(() => {
    logger.info(`try shutdown completed`);
  });
});

export const userPreferencesCacheEx = 60 * 60 * 2;
export const compareUserFiltersCacheEx = 60 * 60 * 2;

var server = new grpc.Server();

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
    logger.error(`matchResult.records.length != 1`);
    callback(
      {
        code: grpc.status.UNKNOWN,
        details: `matchResult.records.length != 1`,
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

  if (reply.getRelationshipScoresMap().getLength() == 0) {
    logger.debug(
      `scores's read from redis: ${reply
        .getRelationshipScoresMap()
        .getLength()} of ${otherUsers.length}`,
    );
  } else {
    logger.info(
      `scores's read from redis: ${reply
        .getRelationshipScoresMap()
        .getLength()} of ${otherUsers.length}`,
    );
  }

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
      n2.userId as otherId
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
    const prob = record.get(`prob`);
    const otherId = record.get(`otherId`);
    const index = length - i;
    if (i == 0) {
      logger.debug(
        `prob:${prob} length:${length} index:${index}  userId:${userId}  otherId:${otherId}  otherUsers:${otherUsers}`,
      );
    }

    const score =
      reply.getRelationshipScoresMap().get(otherId) ?? defaultScore();

    score.setProb(prob);

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
      CREATE (n1)-[f:FEEDBACK {createDate: datetime(), score: $score, feedbackId: $feedbackId, other: r.other}]->(n2) 
      return f
    `,
    { score, userId, feedbackId },
  );

  if (feedback_rel.records.length != 1) {
    logger.error(
      `Failed to create feedback. returned rows: ${feedback_rel.records.length} `,
    );
    return callback({
      code: grpc.status.UNKNOWN,
      message: `Feedback not created.`,
    });
  }

  // create friend
  let friend_rel: any = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $feedbackId}]->(n1:Person)
      WHERE f1.score > 0 AND f2.score > 0
      MERGE (n1)-[r1:FRIENDS]-(n2)
      MERGE (n2)-[r2:FRIENDS]-(n1)
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, feedbackId },
  );

  let negative_rel: any = await session.run(
    `
      MATCH (n1:Person)-[f1:FEEDBACK{feedbackId: $feedbackId}]->(n2:Person)
      MATCH (n2:Person)-[f2:FEEDBACK{other: $feedbackId}]->(n1:Person)
      WHERE f1.score <= 0 OR f2.score <= 0 
      MERGE (n1)-[r1:NEGATIVE]-(n2)
      MERGE (n2)-[r2:NEGATIVE]-(n1)
      return r1,r2, n1.userId, n2.userId
    `,
    { userId, feedbackId },
  );

  logger.debug(
    `Created FRIENDS:${friend_rel.records.length} NEGATIVE:${negative_rel.records.length} with score: ${score}`,
  );

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
  for (let filter of call.request.getFiltersList()) {
    const results = await session.run(
      `
      MATCH (n:Person{userId: $userId1})-[r:MATCHED]-(m:Person{userId: $userId2})
      RETURN n,m,r
      `,
      { userId1: filter.getUserId1(), userId2: filter.getUserId2() },
    );

    const matched = results.records.length > 0;

    filter.setPassed(
      (await compareUserFilters(filter.getUserId1(), filter.getUserId2())) &&
        !matched,
    );
  }
  await session.close();

  const reply = new CheckUserFiltersResponse();

  reply.setFiltersList(call.request.getFiltersList());

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
    reply.setPriority(user1Data.priority || 0);
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
  const reply = new MatchHistoryResponse();

  const result: any = await session.run(
    `
    MATCH (n1:Person)-[r1:MATCHED]->(n2:Person)
    OPTIONAL MATCH (n1:Person)-[r2:FEEDBACK{feedbackId:id(r1)}]->(n2:Person)
    OPTIONAL MATCH (n2:Person)-[r3:FEEDBACK{feedbackId:r1.other}]->(n1:Person)
    return n1.userId, n2.userId, r1.createDate, r2.score, r3.score
    ORDER by r1.createDate DESC
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
  logger.info(`starting on: ${addr}`);
  server.start();
});
