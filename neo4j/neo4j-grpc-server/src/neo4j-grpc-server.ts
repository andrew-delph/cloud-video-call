import {
  CreateMatchRequest,
  CreateMatchResponse,
  CreateUserRequest,
  CreateUserResponse,
  GetRelationshipScoresRequest,
  GetRelationshipScoresResponse,
  grpc,
  Neo4jService,
  UpdateMatchRequest,
  UpdateMatchResponse,
  HealthService,
  CheckUserFiltersResponse,
  CheckUserFiltersRequest,
  GetUserPerferencesRequest,
  GetUserPerferencesResponse,
  PutUserPerferencesResponse,
  PutUserPerferencesRequest,
  CreateFeedbackRequest,
  StandardResponse,
} from 'neo4j-grpc-common';

import haversine from 'haversine-distance';
import * as neo4j from 'neo4j-driver';
import * as common from 'common';
import { v4 } from 'uuid';
import {
  UserPreferences,
  readUserPreferences,
  writeUserPreferencesDatabase,
} from './UserPreferences';

var server = new grpc.Server();

common.listenGlobalExceptions(async () => {
  await server.tryShutdown(() => {
    logger.info(`try shutdown completed`);
  });
});

type Client = ReturnType<typeof common.createRedisClient>;
export const redisClient: Client = common.createRedisClient();

const serverID = v4();

const logger = common.getLogger();

export const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

const durationWarn = 2;

const verifyIndexes = async () => {
  const start_time = performance.now();

  const session = driver.session();
  await session.run(
    `CREATE INDEX  Person_userId IF NOT EXISTS  FOR (n:Person) ON (n.userId);`,
  );

  await session.run(
    `CREATE INDEX  SIMILAR_TO_jobId IF NOT EXISTS  FOR ()-[r:SIMILAR_TO]-() ON (r.jobId);`,
  );

  await session.close();
  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`verifyIndexes duration: \t ${duration}s`);
  } else {
    logger.debug(`verifyIndexes duration: \t ${duration}s`);
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
  let priority;
  try {
    priority = result.records[0].get(`priority`);
  } catch (e) {
    priority = 0;
  }

  reply.setPriority(`${priority}`);

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createUser duration: \t ${duration}s`);
  } else {
    logger.debug(
      `createUser duration: \t ${duration}s hostname: ${process.env.HOSTNAME}`,
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
    CREATE (a)-[r1:MATCHED]->(b) CREATE (b)-[r2:MATCHED]->(a)
    RETURN id(r1), id(r2)
    `,
    {
      userId1: userId1,
      userId2: userId2,
    },
  );
  await session.close();

  if (matchResult.records.length == 0) {
    logger.error(`match doesnt exist?`);
  }

  try {
    const r1_id = matchResult.records[0].get(`id(r1)`);
    const r2_id = matchResult.records[0].get(`id(r2)`);
    reply.setRelationshipId1(`${r1_id}`);
    reply.setRelationshipId2(`${r2_id}`);
  } catch (e: any) {
    logger.error(`stupid get error: ${e}`);
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createMatch duration: \t ${duration}s`);
  } else {
    logger.debug(`createMatch duration: \t ${duration}s`);
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

const getRelationshipScores = async (
  call: grpc.ServerUnaryCall<
    GetRelationshipScoresRequest,
    GetRelationshipScoresResponse
  >,
  callback: grpc.sendUnaryData<GetRelationshipScoresResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const userId = call.request.getUserId();
  const otherUsers = call.request.getOtherUsersList();
  const reply = new GetRelationshipScoresResponse();

  const session = driver.session();
  const result = await session.run(
    `
        MATCH (a)-[rel:SIMILAR_TO]->(b) 
        WHERE a.userId = $target
        AND b.userId IN $otherUsers
        RETURN a.userId as targetId, b.userId as otherId, rel.similarity as score
        ORDER BY rel.score DESCENDING
      `,
    { target: userId, otherUsers },
  );
  await session.close();

  logger.debug(
    `found SIMILAR_TO relationships is ${result.records.length} requested: ${otherUsers.length}`,
  );

  for (const record of result.records) {
    reply
      .getRelationshipScoresMap()
      .set(record.get(`otherId`), record.get(`score`));
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScores duration: \t ${duration}s`);
  } else {
    logger.debug(`getRelationshipScores duration: \t ${duration}s`);
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
    logger.debug(`! userId || !feedbackId`);
    return callback({
      code: 2,
      message: `! userId || !feedbackId`,
    });
  }

  const start_time = performance.now();

  let session = driver.session();
  const feedback_rel = await session.run(
    `
      MATCH (n1:Person {userId: $userId})-[r:MATCHED]->(n2:Person)
      WHERE id(r) = $feedbackId
      CREATE (n1)-[f:FEEDBACK {score: $score}]->(n2) return f
    `,
    { score, userId, feedbackId },
  );

  await session.close();

  if (feedback_rel.records.length != 1) {
    logger.debug(
      `Failed to create feedback. returned rows: ${feedback_rel.records.length} `,
    );
    return callback({
      code: 2,
      message: `Feedback not created.`,
    });
  }

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`createFeedback duration: \t ${duration}s`);
  } else {
    logger.debug(`createFeedback duration: \t ${duration}s`);
  }

  callback(null, reply);
};

const getRelationshipScoresLinkPrediction = async (
  call: grpc.ServerUnaryCall<
    GetRelationshipScoresRequest,
    GetRelationshipScoresResponse
  >,
  callback: grpc.sendUnaryData<GetRelationshipScoresResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const userId = call.request.getUserId();
  const otherUsers = call.request.getOtherUsersList();
  const reply = new GetRelationshipScoresResponse();

  const session = driver.session();

  for (const otherUser of otherUsers) {
    const result = await session.run(
      `
      MATCH (p1:Person {userId: $target})
      MATCH (p2:Person {userId: $otherUser})
      RETURN gds.alpha.linkprediction.commonNeighbors(p1, p2) AS score
        `,
      { target: userId, otherUser },
    );

    reply
      .getRelationshipScoresMap()
      .set(otherUser, result.records[0].get(`score`));

    logger.debug(
      `score: ${result.records[0].get(
        `score`,
      )} target: ${userId} otherUser: ${otherUser}`,
    );
  }

  await session.close();

  // for (const record of result.records) {
  //   reply
  //     .getRelationshipScoresMap()
  //     .set(record.get(`otherId`), record.get(`score`));
  // }

  const duration = (performance.now() - start_time) / 1000;

  logger.info(
    `getRelationshipScoresLinkPrediction duration: \t ${duration}s otherUsers.length: ${otherUsers.length}`,
  );

  if (duration > durationWarn) {
    logger.warn(
      `getRelationshipScoresLinkPrediction duration: \t ${duration}s`,
    );
  } else {
    logger.debug(
      `getRelationshipScoresLinkPrediction duration: \t ${duration}s`,
    );
  }

  callback(null, reply);
};

const getRelationshipScoresCommunity = async (
  call: grpc.ServerUnaryCall<
    GetRelationshipScoresRequest,
    GetRelationshipScoresResponse
  >,
  callback: grpc.sendUnaryData<GetRelationshipScoresResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const userId = call.request.getUserId();
  const otherUsers = call.request.getOtherUsersList();
  const reply = new GetRelationshipScoresResponse();

  const session = driver.session();

  for (const otherUser of otherUsers) {
    const result = await session.run(
      `
      MATCH (p1:Person {userId: $target})
      MATCH (p2:Person {userId: $otherUser})
      RETURN p1.community , p2.community
        `,
      { target: userId, otherUser },
    );

    try {
      const c1 = result.records[0].get(`p1.community`);
      const c2 = result.records[0].get(`p2.community`);

      logger.info(`c1 ${c1} c2 ${c2} ... ${c1 == c2 ? 1 : 0}`);

      reply.getRelationshipScoresMap().set(otherUser, c1 == c2 ? 1 : 0);
    } catch (e) {
      logger.warn(`fetching comminity error: ${e}`);
    }
  }

  await session.close();

  const duration = (performance.now() - start_time) / 1000;

  logger.info(
    `getRelationshipScoresCommunity duration: \t ${duration}s otherUsers.length: ${otherUsers.length}`,
  );

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScoresCommunity duration: \t ${duration}s`);
  } else {
    logger.debug(`getRelationshipScoresCommunity duration: \t ${duration}s`);
  }

  callback(null, reply);
};

const checkUserFilters = async (
  call: grpc.ServerUnaryCall<CheckUserFiltersRequest, CheckUserFiltersResponse>,
  callback: grpc.sendUnaryData<CheckUserFiltersResponse>,
): Promise<void> => {
  // TODO try and cache the result
  const start_time = performance.now();

  const userId1 = call.request.getUserId1();
  const userId2 = call.request.getUserId2();
  const reply = new CheckUserFiltersResponse();

  const session = driver.session();

  const user1Data = await readUserPreferences(userId1);
  const user2Data = await readUserPreferences(userId2);

  await session.close();

  const filterConstants = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    let inner_valid = true;
    Object.entries(userDataA.f_constant).forEach((entry) => {
      const key = entry[0].toString();
      const value = entry[1] != null ? entry[1].toString() : null;
      if (key == `type` || value == null) return;
      if (userDataB.a_constant[key] != value) {
        inner_valid = false;
      }
    });
    return inner_valid;
  };

  let valid = true;

  valid = valid && filterConstants(user1Data, user2Data);
  valid = valid && filterConstants(user2Data, user1Data);

  const filterDistance = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    const aDistance = userDataA.f_custom.distance;
    const aLong = userDataA.a_custom.long;
    const aLat = userDataA.a_custom.lat;

    const bLong = userDataB.a_custom.long;
    const bLat = userDataB.a_custom.lat;

    if (aDistance && aLong && aLat) {
      if (!bLong || !bLat) return false;
      const aCord = { lat: aLat, lng: aLong };
      const bCord = { lat: bLat, lng: bLong };
      const dist = haversine(aCord, bCord);

      if (dist > aDistance) return false;
    }
    return true;
  };

  valid = valid && filterDistance(user1Data, user2Data);
  valid = valid && filterDistance(user2Data, user1Data);

  reply.setPassed(valid);

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`checkUserFilters duration: \t ${duration}s`);
  } else {
    logger.debug(`checkUserFilters duration: \t ${duration}s`);
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
  } catch (e) {
    reply.setMessage(String(e));
  }

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`getUserPerferences duration: \t ${duration}s`);
  } else {
    logger.debug(`getUserPerferences duration: \t ${duration}s`);
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
    // TODO return error
    reply.setMessage(String(e));
    callback(null, reply);
    return;
  }

  await writeUserPreferencesDatabase(userId, {
    a_constant,
    f_constant,
    a_custom,
    f_custom,
  });

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`putUserPerferences duration: \t ${duration}s`);
  } else {
    logger.debug(`putUserPerferences duration: \t ${duration}s`);
  }

  callback(null, reply);
};

server.addService(Neo4jService, {
  createUser,
  createMatch,
  updateMatch,
  getRelationshipScores: getRelationshipScores,
  checkUserFilters,
  getUserPerferences,
  putUserPerferences,
  createFeedback,
});

server.addService(HealthService, {
  Check: (_call: any, callback: any) => callback(null, { status: `SERVING` }),
});

const addr = `0.0.0.0:${process.env.PORT || 80}`;

server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), async () => {
  await verifyIndexes();
  logger.info(`starting on: ${addr}`);
  server.start();
});
