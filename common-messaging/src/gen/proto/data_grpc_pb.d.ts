// package: data
// file: proto/data.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as proto_data_pb from "../proto/data_pb";

interface IDataServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createUser: IDataServiceService_ICreateUser;
    createMatch: IDataServiceService_ICreateMatch;
    endCall: IDataServiceService_IEndCall;
    createFeedback: IDataServiceService_ICreateFeedback;
    getRelationshipScores: IDataServiceService_IGetRelationshipScores;
    checkUserFilters: IDataServiceService_ICheckUserFilters;
    updatePerferences: IDataServiceService_IUpdatePerferences;
    getUserPerferences: IDataServiceService_IGetUserPerferences;
    putUserPerferences: IDataServiceService_IPutUserPerferences;
    getMatchHistory: IDataServiceService_IGetMatchHistory;
}

interface IDataServiceService_ICreateUser extends grpc.MethodDefinition<proto_data_pb.CreateUserRequest, proto_data_pb.CreateUserResponse> {
    path: "/data.DataService/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.CreateUserResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.CreateUserResponse>;
}
interface IDataServiceService_ICreateMatch extends grpc.MethodDefinition<proto_data_pb.CreateMatchRequest, proto_data_pb.CreateMatchResponse> {
    path: "/data.DataService/CreateMatch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.CreateMatchRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.CreateMatchRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.CreateMatchResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.CreateMatchResponse>;
}
interface IDataServiceService_IEndCall extends grpc.MethodDefinition<proto_data_pb.EndCallRequest, proto_data_pb.StandardResponse> {
    path: "/data.DataService/EndCall";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.EndCallRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.EndCallRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.StandardResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.StandardResponse>;
}
interface IDataServiceService_ICreateFeedback extends grpc.MethodDefinition<proto_data_pb.CreateFeedbackRequest, proto_data_pb.Match> {
    path: "/data.DataService/CreateFeedback";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.CreateFeedbackRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.CreateFeedbackRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.Match>;
    responseDeserialize: grpc.deserialize<proto_data_pb.Match>;
}
interface IDataServiceService_IGetRelationshipScores extends grpc.MethodDefinition<proto_data_pb.GetRelationshipScoresRequest, proto_data_pb.GetRelationshipScoresResponse> {
    path: "/data.DataService/GetRelationshipScores";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.GetRelationshipScoresRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.GetRelationshipScoresRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.GetRelationshipScoresResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.GetRelationshipScoresResponse>;
}
interface IDataServiceService_ICheckUserFilters extends grpc.MethodDefinition<proto_data_pb.CheckUserFiltersRequest, proto_data_pb.CheckUserFiltersResponse> {
    path: "/data.DataService/CheckUserFilters";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.CheckUserFiltersRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.CheckUserFiltersRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.CheckUserFiltersResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.CheckUserFiltersResponse>;
}
interface IDataServiceService_IUpdatePerferences extends grpc.MethodDefinition<proto_data_pb.UpdatePerferencesRequest, proto_data_pb.StandardResponse> {
    path: "/data.DataService/UpdatePerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.UpdatePerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.UpdatePerferencesRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.StandardResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.StandardResponse>;
}
interface IDataServiceService_IGetUserPerferences extends grpc.MethodDefinition<proto_data_pb.GetUserPerferencesRequest, proto_data_pb.GetUserPerferencesResponse> {
    path: "/data.DataService/GetUserPerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.GetUserPerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.GetUserPerferencesRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.GetUserPerferencesResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.GetUserPerferencesResponse>;
}
interface IDataServiceService_IPutUserPerferences extends grpc.MethodDefinition<proto_data_pb.PutUserPerferencesRequest, proto_data_pb.PutUserPerferencesResponse> {
    path: "/data.DataService/PutUserPerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.PutUserPerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.PutUserPerferencesRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.PutUserPerferencesResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.PutUserPerferencesResponse>;
}
interface IDataServiceService_IGetMatchHistory extends grpc.MethodDefinition<proto_data_pb.MatchHistoryRequest, proto_data_pb.MatchHistoryResponse> {
    path: "/data.DataService/GetMatchHistory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_data_pb.MatchHistoryRequest>;
    requestDeserialize: grpc.deserialize<proto_data_pb.MatchHistoryRequest>;
    responseSerialize: grpc.serialize<proto_data_pb.MatchHistoryResponse>;
    responseDeserialize: grpc.deserialize<proto_data_pb.MatchHistoryResponse>;
}

export const DataServiceService: IDataServiceService;

export interface IDataServiceServer {
    createUser: grpc.handleUnaryCall<proto_data_pb.CreateUserRequest, proto_data_pb.CreateUserResponse>;
    createMatch: grpc.handleUnaryCall<proto_data_pb.CreateMatchRequest, proto_data_pb.CreateMatchResponse>;
    endCall: grpc.handleUnaryCall<proto_data_pb.EndCallRequest, proto_data_pb.StandardResponse>;
    createFeedback: grpc.handleUnaryCall<proto_data_pb.CreateFeedbackRequest, proto_data_pb.Match>;
    getRelationshipScores: grpc.handleUnaryCall<proto_data_pb.GetRelationshipScoresRequest, proto_data_pb.GetRelationshipScoresResponse>;
    checkUserFilters: grpc.handleUnaryCall<proto_data_pb.CheckUserFiltersRequest, proto_data_pb.CheckUserFiltersResponse>;
    updatePerferences: grpc.handleUnaryCall<proto_data_pb.UpdatePerferencesRequest, proto_data_pb.StandardResponse>;
    getUserPerferences: grpc.handleUnaryCall<proto_data_pb.GetUserPerferencesRequest, proto_data_pb.GetUserPerferencesResponse>;
    putUserPerferences: grpc.handleUnaryCall<proto_data_pb.PutUserPerferencesRequest, proto_data_pb.PutUserPerferencesResponse>;
    getMatchHistory: grpc.handleUnaryCall<proto_data_pb.MatchHistoryRequest, proto_data_pb.MatchHistoryResponse>;
}

export interface IDataServiceClient {
    createUser(request: proto_data_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: proto_data_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: proto_data_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_data_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_data_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_data_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    endCall(request: proto_data_pb.EndCallRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    endCall(request: proto_data_pb.EndCallRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    endCall(request: proto_data_pb.EndCallRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_data_pb.CreateFeedbackRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_data_pb.CreateFeedbackRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_data_pb.CreateFeedbackRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_data_pb.MatchHistoryRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_data_pb.MatchHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_data_pb.MatchHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
}

export class DataServiceClient extends grpc.Client implements IDataServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createUser(request: proto_data_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: proto_data_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: proto_data_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_data_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_data_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_data_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public endCall(request: proto_data_pb.EndCallRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public endCall(request: proto_data_pb.EndCallRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public endCall(request: proto_data_pb.EndCallRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_data_pb.CreateFeedbackRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_data_pb.CreateFeedbackRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_data_pb.CreateFeedbackRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.Match) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_data_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_data_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_data_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_data_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_data_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_data_pb.MatchHistoryRequest, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_data_pb.MatchHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_data_pb.MatchHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_data_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
}
