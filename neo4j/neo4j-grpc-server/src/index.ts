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
} from 'neo4j-grpc-common';

import * as neo4j from 'neo4j-driver';
import * as common from 'react-video-call-common';
import { v4 } from 'uuid';

common.listenGlobalExceptions();

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
  await session.run(
    `
      Merge (:Person {userId: $userId});
      `,
    {
      userId: userId,
    },
  );
  await session.close();

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

  const start_time = performance.now();

  const session = driver.session();
  await session.run(
    `MATCH (a:Person), (b:Person) WHERE a.userId = $userId1 AND b.userId = $userId2 MERGE (a)-[:MATCHED]->(b) MERGE (b)-[:MATCHED]->(a)`,
    {
      userId1: userId1,
      userId2: userId2,
    },
  );
  await session.close();

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
  const userId = call.request.getUserId();
  const otherUsers = call.request.getOtherUsersList();
  const reply = new GetRelationshipScoresResponse();

  for (const otherUser of otherUsers) {
    reply.getRelationshipScoresMap().set(otherUser, Math.random() * 10);
  }

  const start_time = performance.now();

  // const session = driver.session();
  // await session.run(
  //   `MATCH (a:Person), (b:Person) WHERE a.userId = $userId1 AND b.userId = $userId2 MERGE (a)-[:MATCHED]->(b) MERGE (b)-[:MATCHED]->(a)`,
  //   {
  //     userId1: userId1,
  //     userId2: userId2,
  //   },
  // );
  // await session.close();

  const duration = (performance.now() - start_time) / 1000;

  if (duration > durationWarn) {
    logger.warn(`getRelationshipScores duration: \t ${duration}s`);
  } else {
    logger.debug(`getRelationshipScores duration: \t ${duration}s`);
  }

  callback(null, reply);
};

var server = new grpc.Server();
server.addService(Neo4jService, {
  createUser,
  createMatch,
  updateMatch,
  getRelationshipScores,
});
const addr = `0.0.0.0:${process.env.PORT || 8080}`;
server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), async () => {
  await verifyIndexes();
  logger.info(`starting on: ${addr}`);
  server.start();
});
