import { HelloRequest, GreeterClient, grpc } from 'neo4j-common';

const client = new GreeterClient(
  `localhost:8080`,
  grpc.credentials.createInsecure(),
);

const request = new HelloRequest();
request.setName1(`world`);

client.sayHello(request, (error, response) => {
  if (!error) {
    console.info(`Greeting:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});
