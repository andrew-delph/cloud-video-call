import {
  Neo4jClient,
  grpc,
  CreateUserRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
} from 'neo4j-grpc-common';

const addr = process.env.NEO4J_GRPC_SERVER_HOST || `neo4j-grpc-server:8080`;

const client = new Neo4jClient(addr, grpc.credentials.createInsecure());

const createUserRequest = new CreateUserRequest();
createUserRequest.setUserId(`world`);
client.createUser(createUserRequest, (error, response) => {
  if (!error) {
    console.info(`createUser:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});

const createMatchRequest = new CreateMatchRequest();

client.createMatch(createMatchRequest, (error, response) => {
  if (!error) {
    console.info(`createMatch:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});

const updateMatchRequest = new UpdateMatchRequest();

client.updateMatch(updateMatchRequest, (error, response) => {
  if (!error) {
    console.info(`updateMatch:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});
