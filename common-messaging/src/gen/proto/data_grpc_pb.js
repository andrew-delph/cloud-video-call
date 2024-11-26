// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var proto_data_pb = require('../proto/data_pb.js');

function serialize_video_call_CheckUserFiltersRequest(arg) {
  if (!(arg instanceof proto_data_pb.CheckUserFiltersRequest)) {
    throw new Error('Expected argument of type video_call.CheckUserFiltersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CheckUserFiltersRequest(buffer_arg) {
  return proto_data_pb.CheckUserFiltersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CheckUserFiltersResponse(arg) {
  if (!(arg instanceof proto_data_pb.CheckUserFiltersResponse)) {
    throw new Error('Expected argument of type video_call.CheckUserFiltersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CheckUserFiltersResponse(buffer_arg) {
  return proto_data_pb.CheckUserFiltersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CreateFeedbackRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateFeedbackRequest)) {
    throw new Error('Expected argument of type video_call.CreateFeedbackRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CreateFeedbackRequest(buffer_arg) {
  return proto_data_pb.CreateFeedbackRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CreateMatchRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateMatchRequest)) {
    throw new Error('Expected argument of type video_call.CreateMatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CreateMatchRequest(buffer_arg) {
  return proto_data_pb.CreateMatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CreateMatchResponse(arg) {
  if (!(arg instanceof proto_data_pb.CreateMatchResponse)) {
    throw new Error('Expected argument of type video_call.CreateMatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CreateMatchResponse(buffer_arg) {
  return proto_data_pb.CreateMatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CreateUserRequest(arg) {
  if (!(arg instanceof proto_data_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type video_call.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CreateUserRequest(buffer_arg) {
  return proto_data_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_CreateUserResponse(arg) {
  if (!(arg instanceof proto_data_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type video_call.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_CreateUserResponse(buffer_arg) {
  return proto_data_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_EndCallRequest(arg) {
  if (!(arg instanceof proto_data_pb.EndCallRequest)) {
    throw new Error('Expected argument of type video_call.EndCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_EndCallRequest(buffer_arg) {
  return proto_data_pb.EndCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_GetRelationshipScoresRequest(arg) {
  if (!(arg instanceof proto_data_pb.GetRelationshipScoresRequest)) {
    throw new Error('Expected argument of type video_call.GetRelationshipScoresRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_GetRelationshipScoresRequest(buffer_arg) {
  return proto_data_pb.GetRelationshipScoresRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_GetRelationshipScoresResponse(arg) {
  if (!(arg instanceof proto_data_pb.GetRelationshipScoresResponse)) {
    throw new Error('Expected argument of type video_call.GetRelationshipScoresResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_GetRelationshipScoresResponse(buffer_arg) {
  return proto_data_pb.GetRelationshipScoresResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_GetUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.GetUserPerferencesRequest)) {
    throw new Error('Expected argument of type video_call.GetUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_GetUserPerferencesRequest(buffer_arg) {
  return proto_data_pb.GetUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_GetUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_data_pb.GetUserPerferencesResponse)) {
    throw new Error('Expected argument of type video_call.GetUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_GetUserPerferencesResponse(buffer_arg) {
  return proto_data_pb.GetUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_InsertUserVectorsRequest(arg) {
  if (!(arg instanceof proto_data_pb.InsertUserVectorsRequest)) {
    throw new Error('Expected argument of type video_call.InsertUserVectorsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_InsertUserVectorsRequest(buffer_arg) {
  return proto_data_pb.InsertUserVectorsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_Match(arg) {
  if (!(arg instanceof proto_data_pb.Match)) {
    throw new Error('Expected argument of type video_call.Match');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_Match(buffer_arg) {
  return proto_data_pb.Match.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_MatchHistoryRequest(arg) {
  if (!(arg instanceof proto_data_pb.MatchHistoryRequest)) {
    throw new Error('Expected argument of type video_call.MatchHistoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_MatchHistoryRequest(buffer_arg) {
  return proto_data_pb.MatchHistoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_MatchHistoryResponse(arg) {
  if (!(arg instanceof proto_data_pb.MatchHistoryResponse)) {
    throw new Error('Expected argument of type video_call.MatchHistoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_MatchHistoryResponse(buffer_arg) {
  return proto_data_pb.MatchHistoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_PutUserPerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.PutUserPerferencesRequest)) {
    throw new Error('Expected argument of type video_call.PutUserPerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_PutUserPerferencesRequest(buffer_arg) {
  return proto_data_pb.PutUserPerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_PutUserPerferencesResponse(arg) {
  if (!(arg instanceof proto_data_pb.PutUserPerferencesResponse)) {
    throw new Error('Expected argument of type video_call.PutUserPerferencesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_PutUserPerferencesResponse(buffer_arg) {
  return proto_data_pb.PutUserPerferencesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_StandardResponse(arg) {
  if (!(arg instanceof proto_data_pb.StandardResponse)) {
    throw new Error('Expected argument of type video_call.StandardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_StandardResponse(buffer_arg) {
  return proto_data_pb.StandardResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_video_call_UpdatePerferencesRequest(arg) {
  if (!(arg instanceof proto_data_pb.UpdatePerferencesRequest)) {
    throw new Error('Expected argument of type video_call.UpdatePerferencesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_video_call_UpdatePerferencesRequest(buffer_arg) {
  return proto_data_pb.UpdatePerferencesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The greeting service definition.
var DataServiceService = exports.DataServiceService = {
  // Sends a greeting
createUser: {
    path: '/video_call.DataService/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateUserRequest,
    responseType: proto_data_pb.CreateUserResponse,
    requestSerialize: serialize_video_call_CreateUserRequest,
    requestDeserialize: deserialize_video_call_CreateUserRequest,
    responseSerialize: serialize_video_call_CreateUserResponse,
    responseDeserialize: deserialize_video_call_CreateUserResponse,
  },
  createMatch: {
    path: '/video_call.DataService/CreateMatch',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateMatchRequest,
    responseType: proto_data_pb.CreateMatchResponse,
    requestSerialize: serialize_video_call_CreateMatchRequest,
    requestDeserialize: deserialize_video_call_CreateMatchRequest,
    responseSerialize: serialize_video_call_CreateMatchResponse,
    responseDeserialize: deserialize_video_call_CreateMatchResponse,
  },
  endCall: {
    path: '/video_call.DataService/EndCall',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.EndCallRequest,
    responseType: proto_data_pb.StandardResponse,
    requestSerialize: serialize_video_call_EndCallRequest,
    requestDeserialize: deserialize_video_call_EndCallRequest,
    responseSerialize: serialize_video_call_StandardResponse,
    responseDeserialize: deserialize_video_call_StandardResponse,
  },
  createFeedback: {
    path: '/video_call.DataService/CreateFeedback',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CreateFeedbackRequest,
    responseType: proto_data_pb.Match,
    requestSerialize: serialize_video_call_CreateFeedbackRequest,
    requestDeserialize: deserialize_video_call_CreateFeedbackRequest,
    responseSerialize: serialize_video_call_Match,
    responseDeserialize: deserialize_video_call_Match,
  },
  getRelationshipScores: {
    path: '/video_call.DataService/GetRelationshipScores',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.GetRelationshipScoresRequest,
    responseType: proto_data_pb.GetRelationshipScoresResponse,
    requestSerialize: serialize_video_call_GetRelationshipScoresRequest,
    requestDeserialize: deserialize_video_call_GetRelationshipScoresRequest,
    responseSerialize: serialize_video_call_GetRelationshipScoresResponse,
    responseDeserialize: deserialize_video_call_GetRelationshipScoresResponse,
  },
  checkUserFilters: {
    path: '/video_call.DataService/CheckUserFilters',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.CheckUserFiltersRequest,
    responseType: proto_data_pb.CheckUserFiltersResponse,
    requestSerialize: serialize_video_call_CheckUserFiltersRequest,
    requestDeserialize: deserialize_video_call_CheckUserFiltersRequest,
    responseSerialize: serialize_video_call_CheckUserFiltersResponse,
    responseDeserialize: deserialize_video_call_CheckUserFiltersResponse,
  },
  updatePerferences: {
    path: '/video_call.DataService/UpdatePerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.UpdatePerferencesRequest,
    responseType: proto_data_pb.StandardResponse,
    requestSerialize: serialize_video_call_UpdatePerferencesRequest,
    requestDeserialize: deserialize_video_call_UpdatePerferencesRequest,
    responseSerialize: serialize_video_call_StandardResponse,
    responseDeserialize: deserialize_video_call_StandardResponse,
  },
  getUserPerferences: {
    path: '/video_call.DataService/GetUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.GetUserPerferencesRequest,
    responseType: proto_data_pb.GetUserPerferencesResponse,
    requestSerialize: serialize_video_call_GetUserPerferencesRequest,
    requestDeserialize: deserialize_video_call_GetUserPerferencesRequest,
    responseSerialize: serialize_video_call_GetUserPerferencesResponse,
    responseDeserialize: deserialize_video_call_GetUserPerferencesResponse,
  },
  putUserPerferences: {
    path: '/video_call.DataService/PutUserPerferences',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.PutUserPerferencesRequest,
    responseType: proto_data_pb.PutUserPerferencesResponse,
    requestSerialize: serialize_video_call_PutUserPerferencesRequest,
    requestDeserialize: deserialize_video_call_PutUserPerferencesRequest,
    responseSerialize: serialize_video_call_PutUserPerferencesResponse,
    responseDeserialize: deserialize_video_call_PutUserPerferencesResponse,
  },
  getMatchHistory: {
    path: '/video_call.DataService/GetMatchHistory',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.MatchHistoryRequest,
    responseType: proto_data_pb.MatchHistoryResponse,
    requestSerialize: serialize_video_call_MatchHistoryRequest,
    requestDeserialize: deserialize_video_call_MatchHistoryRequest,
    responseSerialize: serialize_video_call_MatchHistoryResponse,
    responseDeserialize: deserialize_video_call_MatchHistoryResponse,
  },
  insertUserVectors: {
    path: '/video_call.DataService/InsertUserVectors',
    requestStream: false,
    responseStream: false,
    requestType: proto_data_pb.InsertUserVectorsRequest,
    responseType: proto_data_pb.StandardResponse,
    requestSerialize: serialize_video_call_InsertUserVectorsRequest,
    requestDeserialize: deserialize_video_call_InsertUserVectorsRequest,
    responseSerialize: serialize_video_call_StandardResponse,
    responseDeserialize: deserialize_video_call_StandardResponse,
  },
};

exports.DataServiceClient = grpc.makeGenericClientConstructor(DataServiceService);
