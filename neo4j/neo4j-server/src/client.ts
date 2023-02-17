import * as grpc from '@grpc/grpc-js';

import { HelloRequest, HelloReply } from '../my_generated_code/helloworld_pb';
import { GreeterClient } from '../my_generated_code/helloworld_grpc_pb';

const client = new GreeterClient(
  `localhost:50051`,
  grpc.credentials.createInsecure(),
);

const request = new HelloRequest();
request.setName(`world`);

client.sayHello(request, (error, response) => {
  if (!error) {
    console.info(`Greeting:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});
