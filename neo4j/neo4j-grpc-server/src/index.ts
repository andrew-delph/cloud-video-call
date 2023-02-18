import {
  CreateMatchRequest,
  CreateMatchResponse,
  CreateUserRequest,
  CreateUserResponse,
  grpc,
  Neo4jService,
  UpdateMatchRequest,
  UpdateMatchResponse,
} from 'neo4j-grpc-common';

import { v4 as uuid } from 'uuid';

import * as neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

const verifyIndexes = () => {
  const start_time = performance.now();

  console.log(
    `verifyIndexes duration: \t ${(performance.now() - start_time) / 1000}s`,
  );
};

const createUser = async (
  call: grpc.ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
  callback: grpc.sendUnaryData<CreateUserResponse>,
): Promise<void> => {
  const socketId = call.request.getUserId();
  const reply = new CreateUserResponse();

  const start_time = performance.now();

  const session = driver.session();
  await session.run(
    `
      CREATE (:Person {socketid: $socketid});
      `,
    {
      socketid: socketId,
    },
  );
  await session.close();

  console.log(
    `createUser duration: \t ${(performance.now() - start_time) / 1000}s`,
  );

  callback(null, reply);
};

const createMatch = async (
  call: grpc.ServerUnaryCall<CreateMatchRequest, CreateMatchResponse>,
  callback: grpc.sendUnaryData<CreateMatchResponse>,
): Promise<void> => {
  const socket1 = call.request.getUserId1();
  const socket2 = call.request.getUserId2();
  const reply = new CreateMatchResponse();
  reply.setMessage(`Created match succesfully for: ${socket1} ${socket2}`);

  const start_time = performance.now();

  const session = driver.session();
  await session.run(
    `MATCH (a:Person), (b:Person) WHERE a.socketid = $socket1 AND b.socketid = $socket2 MERGE (a)-[:MATCHED]->(b) MERGE (b)-[:MATCHED]->(a)`,
    {
      socket1: socket1,
      socket2: socket2,
    },
  );
  await session.close();

  console.log(
    `createMatch duration: \t ${(performance.now() - start_time) / 1000}s`,
  );

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

var server = new grpc.Server();
server.addService(Neo4jService, { createUser, createMatch, updateMatch });
const addr = `0.0.0.0:${process.env.PORT || 8080}`;
server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`starting on: ${addr}`);
  server.start();
});

const errorTypes = [`unhandledRejection`, `uncaughtException`];
const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

errorTypes.forEach((type) => {
  process.on(type, async () => {
    try {
      console.log(`errorTypes: ${type}`);
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    try {
      console.log(`signalTraps ${type}`);
    } finally {
      process.kill(process.pid, type);
    }
  });
});
