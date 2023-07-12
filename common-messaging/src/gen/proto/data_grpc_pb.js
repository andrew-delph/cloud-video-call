// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var proto_data_pb = require('../proto/data_pb.js');

function serialize_data_CheckUserFiltersRequest(arg) {
  if (!(arg instanceof proto_data_pb.CheckUserFiltersRequest)) {
    throw new Error('Expected argument of type data.CheckUserFiltersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CheckUserFiltersRequest(buffer_arg) {
  return proto_data_pb.CheckUserFiltersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CheckUserFiltersResponse(arg) {
  if (!(arg instanceof proto_data_pb.CheckUserFiltersResponse)) {
    throw new Error('Expected argument of type data.CheckUserFiltersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CheckUserFiltersResponse(buffer_arg) {
  return proto_data_pb.CheckUserFiltersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CreateFeedbackRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateFeedbackRequest)) {
    throw new Error('Expected argument of type data.CreateFeedbackRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CreateFeedbackRequest(buffer_arg) {
  return proto_data_pb.CreateFeedbackRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CreateMatchRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateMatchRequest)) {
    throw new Error('Expected argument of type data.CreateMatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CreateMatchRequest(buffer_arg) {
  return proto_data_pb.CreateMatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CreateMatchResponse(arg) {
  if (!(arg instanceof proto_data_pb.CreateMatchResponse)) {
    throw new Error('Expected argument of type data.CreateMatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CreateMatchResponse(buffer_arg) {
  return proto_data_pb.CreateMatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CreateUserRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type data.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CreateUserRequest(buffer_arg) {
  return proto_data_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_CreateUserResponse(arg) {
  if (!(arg instanceof proto_data_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type data.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_CreateUserResponse(buffer_arg) {
  return proto_data_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_EndCallRequest(arg) {
  if (!(arg instanceof proto_data_pb.EndCallRequest)) {
    throw new Error('Expected argument of type data.EndCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_EndCallRequest(buffer_arg) {
  return proto_data_pb.EndCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_GetRelationshipScoresRequest(arg) {
  if (!(arg instanceof proto_data_pb.GetRelationshipScoresRequest)) {
    throw new Error('Expected argument of type data.GetRelationshipScoresRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_GetRelationshipScoresRequest(buffer_arg) {
  return proto_data_pb.GetRelationshipScoresRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_GetRelationshipScoresResponse(arg) {
  if (!(arg instanceof proto_data_pb.GetRelationshipScoresResponse)) {
    throw new Error('Expected argument of type data.GetRelationshipScoresResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_GetRelationshipScoresResponse(buffer_arg) {
  return proto_data_pb.GetRelationshipScoresResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_GetUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.GetUserPerferencesRequest)) {
    throw new Error('Expected argument of type data.GetUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_GetUserPerferencesRequest(buffer_arg) {
  return proto_data_pb.GetUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_GetUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_data_pb.GetUserPerferencesResponse)) {
    throw new Error('Expected argument of type data.GetUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_GetUserPerferencesResponse(buffer_arg) {
  return proto_data_pb.GetUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_Match(arg) {
  if (!(arg instanceof proto_data_pb.Match)) {
    throw new Error('Expected argument of type data.Match');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_Match(buffer_arg) {
  return proto_data_pb.Match.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_MatchHistoryRequest(arg) {
  if (!(arg instanceof proto_data_pb.MatchHistoryRequest)) {
    throw new Error('Expected argument of type data.MatchHistoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_MatchHistoryRequest(buffer_arg) {
  return proto_data_pb.MatchHistoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_MatchHistoryResponse(arg) {
  if (!(arg instanceof proto_data_pb.MatchHistoryResponse)) {
    throw new Error('Expected argument of type data.MatchHistoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_MatchHistoryResponse(buffer_arg) {
  return proto_data_pb.MatchHistoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_PutUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.PutUserPerferencesRequest)) {
    throw new Error('Expected argument of type data.PutUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_PutUserPerferencesRequest(buffer_arg) {
  return proto_data_pb.PutUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_PutUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_data_pb.PutUserPerferencesResponse)) {
    throw new Error('Expected argument of type data.PutUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_PutUserPerferencesResponse(buffer_arg) {
  return proto_data_pb.PutUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_StandardResponse(arg) {
  if (!(arg instanceof proto_data_pb.StandardResponse)) {
    throw new Error('Expected argument of type data.StandardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_StandardResponse(buffer_arg) {
  return proto_data_pb.StandardResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_data_UpdatePerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.UpdatePerferencesRequest)) {
    throw new Error('Expected argument of type data.UpdatePerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_data_UpdatePerferencesRequest(buffer_arg) {
  return proto_data_pb.UpdatePerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The greeting service definition.
var DataServiceService = exports.DataServiceService = {
  // Sends a greeting
createUser: {
    path: '/data.DataService/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateUserRequest,
    responseType: proto_data_pb.CreateUserResponse,
    requestSerialize: serialize_data_CreateUserRequest,
    requestDeserialize: deserialize_data_CreateUserRequest,
    responseSerialize: serialize_data_CreateUserResponse,
    responseDeserialize: deserialize_data_CreateUserResponse,
  },
  createMatch: {
    path: '/data.DataService/CreateMatch',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateMatchRequest,
    responseType: proto_data_pb.CreateMatchResponse,
    requestSerialize: serialize_data_CreateMatchRequest,
    requestDeserialize: deserialize_data_CreateMatchRequest,
    responseSerialize: serialize_data_CreateMatchResponse,
    responseDeserialize: deserialize_data_CreateMatchResponse,
  },
  endCall: {
    path: '/data.DataService/EndCall',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.EndCallRequest,
    responseType: proto_data_pb.StandardResponse,
    requestSerialize: serialize_data_EndCallRequest,
    requestDeserialize: deserialize_data_EndCallRequest,
    responseSerialize: serialize_data_StandardResponse,
    responseDeserialize: deserialize_data_StandardResponse,
  },
  createFeedback: {
    path: '/data.DataService/CreateFeedback',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateFeedbackRequest,
    responseType: proto_data_pb.Match,
    requestSerialize: serialize_data_CreateFeedbackRequest,
    requestDeserialize: deserialize_data_CreateFeedbackRequest,
    responseSerialize: serialize_data_Match,
    responseDeserialize: deserialize_data_Match,
  },
  getRelationshipScores: {
    path: '/data.DataService/GetRelationshipScores',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.GetRelationshipScoresRequest,
    responseType: proto_data_pb.GetRelationshipScoresResponse,
    requestSerialize: serialize_data_GetRelationshipScoresRequest,
    requestDeserialize: deserialize_data_GetRelationshipScoresRequest,
    responseSerialize: serialize_data_GetRelationshipScoresResponse,
    responseDeserialize: deserialize_data_GetRelationshipScoresResponse,
  },
  checkUserFilters: {
    path: '/data.DataService/CheckUserFilters',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CheckUserFiltersRequest,
    responseType: proto_data_pb.CheckUserFiltersResponse,
    requestSerialize: serialize_data_CheckUserFiltersRequest,
    requestDeserialize: deserialize_data_CheckUserFiltersRequest,
    responseSerialize: serialize_data_CheckUserFiltersResponse,
    responseDeserialize: deserialize_data_CheckUserFiltersResponse,
  },
  updatePerferences: {
    path: '/data.DataService/UpdatePerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.UpdatePerferencesRequest,
    responseType: proto_data_pb.StandardResponse,
    requestSerialize: serialize_data_UpdatePerferencesRequest,
    requestDeserialize: deserialize_data_UpdatePerferencesRequest,
    responseSerialize: serialize_data_StandardResponse,
    responseDeserialize: deserialize_data_StandardResponse,
  },
  getUserPerferences: {
    path: '/data.DataService/GetUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.GetUserPerferencesRequest,
    responseType: proto_data_pb.GetUserPerferencesResponse,
    requestSerialize: serialize_data_GetUserPerferencesRequest,
    requestDeserialize: deserialize_data_GetUserPerferencesRequest,
    responseSerialize: serialize_data_GetUserPerferencesResponse,
    responseDeserialize: deserialize_data_GetUserPerferencesResponse,
  },
  putUserPerferences: {
    path: '/data.DataService/PutUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.PutUserPerferencesRequest,
    responseType: proto_data_pb.PutUserPerferencesResponse,
    requestSerialize: serialize_data_PutUserPerferencesRequest,
    requestDeserialize: deserialize_data_PutUserPerferencesRequest,
    responseSerialize: serialize_data_PutUserPerferencesResponse,
    responseDeserialize: deserialize_data_PutUserPerferencesResponse,
  },
  getMatchHistory: {
    path: '/data.DataService/GetMatchHistory',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.MatchHistoryRequest,
    responseType: proto_data_pb.MatchHistoryResponse,
    requestSerialize: serialize_data_MatchHistoryRequest,
    requestDeserialize: deserialize_data_MatchHistoryRequest,
    responseSerialize: serialize_data_MatchHistoryResponse,
    responseDeserialize: deserialize_data_MatchHistoryResponse,
  },
};

exports.DataServiceClient = grpc.makeGenericClientConstructor(DataServiceService);
