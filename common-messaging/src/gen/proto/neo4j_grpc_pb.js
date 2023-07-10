// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var proto_neo4j_pb = require('../proto/neo4j_pb.js');

function serialize_neo4j_CheckUserFiltersRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.CheckUserFiltersRequest)) {
    throw new Error('Expected argument of type neo4j.CheckUserFiltersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CheckUserFiltersRequest(buffer_arg) {
  return proto_neo4j_pb.CheckUserFiltersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CheckUserFiltersResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.CheckUserFiltersResponse)) {
    throw new Error('Expected argument of type neo4j.CheckUserFiltersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CheckUserFiltersResponse(buffer_arg) {
  return proto_neo4j_pb.CheckUserFiltersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateFeedbackRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.CreateFeedbackRequest)) {
    throw new Error('Expected argument of type neo4j.CreateFeedbackRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateFeedbackRequest(buffer_arg) {
  return proto_neo4j_pb.CreateFeedbackRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateMatchRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.CreateMatchRequest)) {
    throw new Error('Expected argument of type neo4j.CreateMatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateMatchRequest(buffer_arg) {
  return proto_neo4j_pb.CreateMatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateMatchResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.CreateMatchResponse)) {
    throw new Error('Expected argument of type neo4j.CreateMatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateMatchResponse(buffer_arg) {
  return proto_neo4j_pb.CreateMatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateUserRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type neo4j.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateUserRequest(buffer_arg) {
  return proto_neo4j_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_CreateUserResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type neo4j.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_CreateUserResponse(buffer_arg) {
  return proto_neo4j_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_EndCallRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.EndCallRequest)) {
    throw new Error('Expected argument of type neo4j.EndCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_EndCallRequest(buffer_arg) {
  return proto_neo4j_pb.EndCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetRelationshipScoresRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.GetRelationshipScoresRequest)) {
    throw new Error('Expected argument of type neo4j.GetRelationshipScoresRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetRelationshipScoresRequest(buffer_arg) {
  return proto_neo4j_pb.GetRelationshipScoresRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetRelationshipScoresResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.GetRelationshipScoresResponse)) {
    throw new Error('Expected argument of type neo4j.GetRelationshipScoresResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetRelationshipScoresResponse(buffer_arg) {
  return proto_neo4j_pb.GetRelationshipScoresResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.GetUserPerferencesRequest)) {
    throw new Error('Expected argument of type neo4j.GetUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetUserPerferencesRequest(buffer_arg) {
  return proto_neo4j_pb.GetUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_GetUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.GetUserPerferencesResponse)) {
    throw new Error('Expected argument of type neo4j.GetUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_GetUserPerferencesResponse(buffer_arg) {
  return proto_neo4j_pb.GetUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_MatchHistoryRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.MatchHistoryRequest)) {
    throw new Error('Expected argument of type neo4j.MatchHistoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_MatchHistoryRequest(buffer_arg) {
  return proto_neo4j_pb.MatchHistoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_MatchHistoryResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.MatchHistoryResponse)) {
    throw new Error('Expected argument of type neo4j.MatchHistoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_MatchHistoryResponse(buffer_arg) {
  return proto_neo4j_pb.MatchHistoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_PutUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.PutUserPerferencesRequest)) {
    throw new Error('Expected argument of type neo4j.PutUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_PutUserPerferencesRequest(buffer_arg) {
  return proto_neo4j_pb.PutUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_PutUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.PutUserPerferencesResponse)) {
    throw new Error('Expected argument of type neo4j.PutUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_PutUserPerferencesResponse(buffer_arg) {
  return proto_neo4j_pb.PutUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_StandardResponse(arg) {
  if (!(arg instanceof proto_neo4j_pb.StandardResponse)) {
    throw new Error('Expected argument of type neo4j.StandardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_StandardResponse(buffer_arg) {
  return proto_neo4j_pb.StandardResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_neo4j_UpdatePerferencesRequest(arg) {
  if (!(arg instanceof proto_neo4j_pb.UpdatePerferencesRequest)) {
    throw new Error('Expected argument of type neo4j.UpdatePerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_neo4j_UpdatePerferencesRequest(buffer_arg) {
  return proto_neo4j_pb.UpdatePerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The greeting service definition.
var Neo4jService = exports.Neo4jService = {
  // Sends a greeting
createUser: {
    path: '/neo4j.Neo4j/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.CreateUserRequest,
    responseType: proto_neo4j_pb.CreateUserResponse,
    requestSerialize: serialize_neo4j_CreateUserRequest,
    requestDeserialize: deserialize_neo4j_CreateUserRequest,
    responseSerialize: serialize_neo4j_CreateUserResponse,
    responseDeserialize: deserialize_neo4j_CreateUserResponse,
  },
  createMatch: {
    path: '/neo4j.Neo4j/CreateMatch',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.CreateMatchRequest,
    responseType: proto_neo4j_pb.CreateMatchResponse,
    requestSerialize: serialize_neo4j_CreateMatchRequest,
    requestDeserialize: deserialize_neo4j_CreateMatchRequest,
    responseSerialize: serialize_neo4j_CreateMatchResponse,
    responseDeserialize: deserialize_neo4j_CreateMatchResponse,
  },
  endCall: {
    path: '/neo4j.Neo4j/EndCall',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.EndCallRequest,
    responseType: proto_neo4j_pb.StandardResponse,
    requestSerialize: serialize_neo4j_EndCallRequest,
    requestDeserialize: deserialize_neo4j_EndCallRequest,
    responseSerialize: serialize_neo4j_StandardResponse,
    responseDeserialize: deserialize_neo4j_StandardResponse,
  },
  createFeedback: {
    path: '/neo4j.Neo4j/CreateFeedback',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.CreateFeedbackRequest,
    responseType: proto_neo4j_pb.StandardResponse,
    requestSerialize: serialize_neo4j_CreateFeedbackRequest,
    requestDeserialize: deserialize_neo4j_CreateFeedbackRequest,
    responseSerialize: serialize_neo4j_StandardResponse,
    responseDeserialize: deserialize_neo4j_StandardResponse,
  },
  getRelationshipScores: {
    path: '/neo4j.Neo4j/GetRelationshipScores',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.GetRelationshipScoresRequest,
    responseType: proto_neo4j_pb.GetRelationshipScoresResponse,
    requestSerialize: serialize_neo4j_GetRelationshipScoresRequest,
    requestDeserialize: deserialize_neo4j_GetRelationshipScoresRequest,
    responseSerialize: serialize_neo4j_GetRelationshipScoresResponse,
    responseDeserialize: deserialize_neo4j_GetRelationshipScoresResponse,
  },
  checkUserFilters: {
    path: '/neo4j.Neo4j/CheckUserFilters',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.CheckUserFiltersRequest,
    responseType: proto_neo4j_pb.CheckUserFiltersResponse,
    requestSerialize: serialize_neo4j_CheckUserFiltersRequest,
    requestDeserialize: deserialize_neo4j_CheckUserFiltersRequest,
    responseSerialize: serialize_neo4j_CheckUserFiltersResponse,
    responseDeserialize: deserialize_neo4j_CheckUserFiltersResponse,
  },
  updatePerferences: {
    path: '/neo4j.Neo4j/UpdatePerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.UpdatePerferencesRequest,
    responseType: proto_neo4j_pb.StandardResponse,
    requestSerialize: serialize_neo4j_UpdatePerferencesRequest,
    requestDeserialize: deserialize_neo4j_UpdatePerferencesRequest,
    responseSerialize: serialize_neo4j_StandardResponse,
    responseDeserialize: deserialize_neo4j_StandardResponse,
  },
  getUserPerferences: {
    path: '/neo4j.Neo4j/GetUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.GetUserPerferencesRequest,
    responseType: proto_neo4j_pb.GetUserPerferencesResponse,
    requestSerialize: serialize_neo4j_GetUserPerferencesRequest,
    requestDeserialize: deserialize_neo4j_GetUserPerferencesRequest,
    responseSerialize: serialize_neo4j_GetUserPerferencesResponse,
    responseDeserialize: deserialize_neo4j_GetUserPerferencesResponse,
  },
  putUserPerferences: {
    path: '/neo4j.Neo4j/PutUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.PutUserPerferencesRequest,
    responseType: proto_neo4j_pb.PutUserPerferencesResponse,
    requestSerialize: serialize_neo4j_PutUserPerferencesRequest,
    requestDeserialize: deserialize_neo4j_PutUserPerferencesRequest,
    responseSerialize: serialize_neo4j_PutUserPerferencesResponse,
    responseDeserialize: deserialize_neo4j_PutUserPerferencesResponse,
  },
  getMatchHistory: {
    path: '/neo4j.Neo4j/GetMatchHistory',
    requestStream: false,
    responseStream: false,
    requestType: proto_neo4j_pb.MatchHistoryRequest,
    responseType: proto_neo4j_pb.MatchHistoryResponse,
    requestSerialize: serialize_neo4j_MatchHistoryRequest,
    requestDeserialize: deserialize_neo4j_MatchHistoryRequest,
    responseSerialize: serialize_neo4j_MatchHistoryResponse,
    responseDeserialize: deserialize_neo4j_MatchHistoryResponse,
  },
};

exports.Neo4jClient = grpc.makeGenericClientConstructor(Neo4jService);
