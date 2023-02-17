import * as grpc from 'grpc';
import {
  Greeter,
  HelloRequest,
  HelloResponse,
} from '../proto-gen/proto/greeter';

function sayHello(
  call: grpc.ServerUnaryCall<HelloRequest>,
  callback: grpc.sendUnaryData<HelloResponse>,
) {
  const name = call.;
  const message = `Hello, ${name}!`;
  const response = new HelloResponse.();
  response.setMessage(message);
  callback(null, response);
}

const server = new grpc.Server();
server.addService(Greeter, { sayHello });
server.bind(`0.0.0.0:50051`, grpc.ServerCredentials.createInsecure());
console.log(`Server running at http://0.0.0.0:50051`);
server.start();
