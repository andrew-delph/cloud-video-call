import * as grpcLocal from '@grpc/grpc-js';
import { Neo4jClient as LocalNeo4jClient } from './gen/proto/neo4j_grpc_pb';

export * from './gen/proto/neo4j_grpc_pb';
export * from './gen/proto/neo4j_pb';
export * from './gen/proto/rabbitmq_pb';
export * from './variables';

export * from './utils';

export * as message_helper from './message_helper';

export * as grpc from '@grpc/grpc-js';

export const createNeo4jClient = (
  address: string = process.env.NEO4J_GRPC_SERVER_HOST ||
    `neo4j-grpc-server.default.svc.cluster.local:80`,
  credentials: grpcLocal.ChannelCredentials = grpcLocal.credentials.createInsecure(),
  options?: Partial<grpcLocal.ClientOptions> | undefined,
) => {
  const client = new LocalNeo4jClient(address, credentials, options);
  return client;
};
