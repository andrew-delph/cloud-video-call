import { DataServiceClient as LocalDataServiceClient } from './gen/proto/data_grpc_pb';
import * as grpcLocal from '@grpc/grpc-js';

export * from './gen/proto/data_grpc_pb';
export * from './gen/proto/data_pb';
export * from './gen/proto/rabbitmq_pb';
export * from './variables';

export * from './utils';

export * as message_helper from './message_helper';

export * as grpc from '@grpc/grpc-js';

export const createLocalDataServiceClient = (
  address: string = process.env.NEO4J_GRPC_SERVER_HOST ||
    `data-service.default.svc.cluster.local:80`,
  credentials: grpcLocal.ChannelCredentials = grpcLocal.credentials.createInsecure(),
  options?: Partial<grpcLocal.ClientOptions> | undefined,
) => {
  const client = new LocalDataServiceClient(address, credentials, options);
  return client;
};
