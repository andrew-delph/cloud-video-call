import * as grpcLocal from '@grpc/grpc-js';
import { Neo4jClient as LocalNeo4jClient } from '../proto_gen/neo4j_grpc_pb';
export * from '../proto_gen/neo4j_grpc_pb';
export * from '../proto_gen/neo4j_pb';

export * as grpc from '@grpc/grpc-js';

export const createNeo4jClient = (
  address: string,
  credentials: grpcLocal.ChannelCredentials = grpcLocal.credentials.createInsecure(),
  options?: Partial<grpcLocal.ClientOptions> | undefined,
) => {
  const client = new LocalNeo4jClient(address, credentials, options);
  return client;
};
