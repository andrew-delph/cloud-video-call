import {
  Neo4jClient,
  grpc,
  CreateUserRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
} from 'neo4j-grpc-common';

const addr = process.env.NEO4J_GRPC_SERVER_HOST || `neo4j-grpc-server:8080`;

const neo4jRpcClient = new Neo4jClient(addr, grpc.credentials.createInsecure());

const createUserRequest = new CreateUserRequest();
createUserRequest.setUserId(`world`);
neo4jRpcClient.createUser(createUserRequest, (error, response) => {
  if (!error) {
    console.info(`createUser:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});

const createMatchRequest = new CreateMatchRequest();

neo4jRpcClient.createMatch(createMatchRequest, (error, response) => {
  if (!error) {
    console.info(`createMatch:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});

const updateMatchRequest = new UpdateMatchRequest();

neo4jRpcClient.updateMatch(updateMatchRequest, (error, response) => {
  if (!error) {
    console.info(`updateMatch:`, response.getMessage());
  } else {
    console.error(`Error:`, error.message);
  }
});
