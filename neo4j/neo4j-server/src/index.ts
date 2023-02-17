console.log(`hi`);

import * as grpc from '@grpc/grpc-js';

import { HelloRequest, HelloReply } from '../my_generated_code/helloworld_pb';
import { GreeterService } from '../my_generated_code/helloworld_grpc_pb';

const sayHello = (
  call: grpc.ServerUnaryCall<HelloRequest, HelloReply>,
  callback: grpc.sendUnaryData<HelloReply>,
): void => {
  const reply = new HelloReply();
  reply.setMessage(`11Hello ${call.request.getName()}`);
  callback(null, reply);
};

var server = new grpc.Server();
server.addService(GreeterService, { sayHello });

server.bindAsync(
  `0.0.0.0:50051`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`starting...`);
    server.start();
  },
);
