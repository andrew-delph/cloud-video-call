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
  GetUserAttributesFiltersResponse,
  GetUserAttributesFiltersRequest,
} from 'neo4j-grpc-common';

import * as neo4j from 'neo4j-driver';
import * as common from 'react-video-call-common';
import { v4 } from 'uuid';

var server = new grpc.Server();

common.listenGlobalExceptions(async () => {
  await server.tryShutdown(() => {
    logger.info(`try shutdown completed`);
  });
});

const serverID = v4();

const logger = common.getLogger();

const driver = neo4j.driver(
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
    `getRelationshipScores duration: \t ${duration}s otherUsers.length: ${otherUsers.length}`,
  );

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScores duration: \t ${duration}s`);
  } else {
    logger.debug(`getRelationshipScores duration: \t ${duration}s`);
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
    `getRelationshipScores duration: \t ${duration}s otherUsers.length: ${otherUsers.length}`,
  );

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScores duration: \t ${duration}s`);
  } else {
    logger.debug(`getRelationshipScores duration: \t ${duration}s`);
  }

  callback(null, reply);
};

const getUserAttributesFilters = async (
  call: grpc.ServerUnaryCall<
    GetUserAttributesFiltersRequest,
    GetUserAttributesFiltersResponse
  >,
  callback: grpc.sendUnaryData<GetUserAttributesFiltersResponse>,
): Promise<void> => {
  const start_time = performance.now();

  const userId = call.request.getUserId();
  const reply = new GetUserAttributesFiltersResponse();

  const session = driver.session();

  const resultAttributes = await session.run(
    `
    MATCH (p1:Person {userId: $userId})-[r1:USER_DEFINED_ATTRIBUTES]->(a:MetaData)
    RETURN a
      `,
    { userId },
  );

  const attributesResult = resultAttributes.records[0].get(`a`);

  if (attributesResult) {
    Object.entries(attributesResult.properties).forEach((entry) => {
      const key = entry[0].toString();
      const value = entry[1] != null ? entry[1].toString() : null;
      if (key == `type` || value == null) return;

      reply.getUserStaticAttributesMap().set(key, value);
    });
  }

  const resultFilters = await session.run(
    `
    MATCH (p1:Person {userId: $userId})-[r2:USER_FILTERS]->(f:MetaData)
    RETURN f
      `,
    { userId },
  );
  const filtersResult = resultFilters.records[0].get(`f`);

  if (filtersResult) {
    Object.entries(filtersResult.properties).forEach((entry) => {
      const key = entry[0].toString();
      const value = entry[1] != null ? entry[1].toString() : null;
      if (key == `type` || value == null) return;

      reply.getUserStaticFiltersMap().set(key, value);
    });
  }

  await session.close();

  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`getUserAttributesFilters duration: \t ${duration}s`);
  } else {
    logger.debug(`getUserAttributesFilters duration: \t ${duration}s`);
  }

  callback(null, reply);
};

server.addService(Neo4jService, {
  createUser,
  createMatch,
  updateMatch,
  getRelationshipScores: getRelationshipScores,
  getUserAttributesFilters,
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
