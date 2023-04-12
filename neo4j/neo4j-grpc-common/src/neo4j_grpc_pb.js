// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var neo4j_pb = require('./neo4j_pb.js');

function serialize_neo4j_CheckUserFiltersRequest(arg) {
  if (!(arg instanceof neo4j_pb.CheckUserFiltersRequest)) {
    throw new Error('Expected argument of type neo4j.CheckUserFiltersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CheckUserFiltersRequest(buffer_arg) {
  return neo4j_pb.CheckUserFiltersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CheckUserFiltersResponse(arg) {
  if (!(arg instanceof neo4j_pb.CheckUserFiltersResponse)) {
    throw new Error('Expected argument of type neo4j.CheckUserFiltersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CheckUserFiltersResponse(buffer_arg) {
  return neo4j_pb.CheckUserFiltersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateMatchRequest(arg) {
  if (!(arg instanceof neo4j_pb.CreateMatchRequest)) {
    throw new Error('Expected argument of type neo4j.CreateMatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateMatchRequest(buffer_arg) {
  return neo4j_pb.CreateMatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateMatchResponse(arg) {
  if (!(arg instanceof neo4j_pb.CreateMatchResponse)) {
    throw new Error('Expected argument of type neo4j.CreateMatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateMatchResponse(buffer_arg) {
  return neo4j_pb.CreateMatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateUserRequest(arg) {
  if (!(arg instanceof neo4j_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type neo4j.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateUserRequest(buffer_arg) {
  return neo4j_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateUserResponse(arg) {
  if (!(arg instanceof neo4j_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type neo4j.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateUserResponse(buffer_arg) {
  return neo4j_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetRelationshipScoresRequest(arg) {
  if (!(arg instanceof neo4j_pb.GetRelationshipScoresRequest)) {
    throw new Error('Expected argument of type neo4j.GetRelationshipScoresRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetRelationshipScoresRequest(buffer_arg) {
  return neo4j_pb.GetRelationshipScoresRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetRelationshipScoresResponse(arg) {
  if (!(arg instanceof neo4j_pb.GetRelationshipScoresResponse)) {
    throw new Error('Expected argument of type neo4j.GetRelationshipScoresResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetRelationshipScoresResponse(buffer_arg) {
  return neo4j_pb.GetRelationshipScoresResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_StandardResponse(arg) {
  if (!(arg instanceof neo4j_pb.StandardResponse)) {
    throw new Error('Expected argument of type neo4j.StandardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_StandardResponse(buffer_arg) {
  return neo4j_pb.StandardResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_UpdateMatchRequest(arg) {
  if (!(arg instanceof neo4j_pb.UpdateMatchRequest)) {
    throw new Error('Expected argument of type neo4j.UpdateMatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_UpdateMatchRequest(buffer_arg) {
  return neo4j_pb.UpdateMatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_UpdateMatchResponse(arg) {
  if (!(arg instanceof neo4j_pb.UpdateMatchResponse)) {
    throw new Error('Expected argument of type neo4j.UpdateMatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_UpdateMatchResponse(buffer_arg) {
  return neo4j_pb.UpdateMatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_UpdatePerferencesRequest(arg) {
  if (!(arg instanceof neo4j_pb.UpdatePerferencesRequest)) {
    throw new Error('Expected argument of type neo4j.UpdatePerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_UpdatePerferencesRequest(buffer_arg) {
  return neo4j_pb.UpdatePerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The greeting service definition.
var Neo4jService = exports.Neo4jService = {
  // Sends a greeting
createUser: {
    path: '/neo4j.Neo4j/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.CreateUserRequest,
    responseType: neo4j_pb.CreateUserResponse,
    requestSerialize: serialize_neo4j_CreateUserRequest,
    requestDeserialize: deserialize_neo4j_CreateUserRequest,
    responseSerialize: serialize_neo4j_CreateUserResponse,
    responseDeserialize: deserialize_neo4j_CreateUserResponse,
  },
  createMatch: {
    path: '/neo4j.Neo4j/CreateMatch',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.CreateMatchRequest,
    responseType: neo4j_pb.CreateMatchResponse,
    requestSerialize: serialize_neo4j_CreateMatchRequest,
    requestDeserialize: deserialize_neo4j_CreateMatchRequest,
    responseSerialize: serialize_neo4j_CreateMatchResponse,
    responseDeserialize: deserialize_neo4j_CreateMatchResponse,
  },
  updateMatch: {
    path: '/neo4j.Neo4j/UpdateMatch',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.UpdateMatchRequest,
    responseType: neo4j_pb.UpdateMatchResponse,
    requestSerialize: serialize_neo4j_UpdateMatchRequest,
    requestDeserialize: deserialize_neo4j_UpdateMatchRequest,
    responseSerialize: serialize_neo4j_UpdateMatchResponse,
    responseDeserialize: deserialize_neo4j_UpdateMatchResponse,
  },
  getRelationshipScores: {
    path: '/neo4j.Neo4j/GetRelationshipScores',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.GetRelationshipScoresRequest,
    responseType: neo4j_pb.GetRelationshipScoresResponse,
    requestSerialize: serialize_neo4j_GetRelationshipScoresRequest,
    requestDeserialize: deserialize_neo4j_GetRelationshipScoresRequest,
    responseSerialize: serialize_neo4j_GetRelationshipScoresResponse,
    responseDeserialize: deserialize_neo4j_GetRelationshipScoresResponse,
  },
  checkUserFilters: {
    path: '/neo4j.Neo4j/CheckUserFilters',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.CheckUserFiltersRequest,
    responseType: neo4j_pb.CheckUserFiltersResponse,
    requestSerialize: serialize_neo4j_CheckUserFiltersRequest,
    requestDeserialize: deserialize_neo4j_CheckUserFiltersRequest,
    responseSerialize: serialize_neo4j_CheckUserFiltersResponse,
    responseDeserialize: deserialize_neo4j_CheckUserFiltersResponse,
  },
  updatePerferences: {
    path: '/neo4j.Neo4j/UpdatePerferences',
    requestStream: false,
    responseStream: false,
    requestType: neo4j_pb.UpdatePerferencesRequest,
    responseType: neo4j_pb.StandardResponse,
    requestSerialize: serialize_neo4j_UpdatePerferencesRequest,
    requestDeserialize: deserialize_neo4j_UpdatePerferencesRequest,
    responseSerialize: serialize_neo4j_StandardResponse,
    responseDeserialize: deserialize_neo4j_StandardResponse,
  },
};

exports.Neo4jClient = grpc.makeGenericClientConstructor(Neo4jService);
