import { HelloRequest, HelloReply, GreeterService, grpc } from 'neo4j-common';

const sayHello = (
  call: grpc.ServerUnaryCall<HelloRequest, HelloReply>,
  callback: grpc.sendUnaryData<HelloReply>,
): void => {
  const reply = new HelloReply();
  reply.setMessage(`11Hello ${call.request.getName1()}`);
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
