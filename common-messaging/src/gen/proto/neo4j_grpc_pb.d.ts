// package: neo4j
// file: proto/neo4j.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as proto_neo4j_pb from "../proto/neo4j_pb";

interface INeo4jService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createUser: INeo4jService_ICreateUser;
    createMatch: INeo4jService_ICreateMatch;
    updateMatch: INeo4jService_IUpdateMatch;
    createFeedback: INeo4jService_ICreateFeedback;
    getRelationshipScores: INeo4jService_IGetRelationshipScores;
    checkUserFilters: INeo4jService_ICheckUserFilters;
    updatePerferences: INeo4jService_IUpdatePerferences;
    getUserPerferences: INeo4jService_IGetUserPerferences;
    putUserPerferences: INeo4jService_IPutUserPerferences;
    getMatchHistory: INeo4jService_IGetMatchHistory;
}

interface INeo4jService_ICreateUser extends grpc.MethodDefinition<proto_neo4j_pb.CreateUserRequest, proto_neo4j_pb.CreateUserResponse> {
    path: "/neo4j.Neo4j/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.CreateUserResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.CreateUserResponse>;
}
interface INeo4jService_ICreateMatch extends grpc.MethodDefinition<proto_neo4j_pb.CreateMatchRequest, proto_neo4j_pb.CreateMatchResponse> {
    path: "/neo4j.Neo4j/CreateMatch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.CreateMatchRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.CreateMatchRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.CreateMatchResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.CreateMatchResponse>;
}
interface INeo4jService_IUpdateMatch extends grpc.MethodDefinition<proto_neo4j_pb.UpdateMatchRequest, proto_neo4j_pb.UpdateMatchResponse> {
    path: "/neo4j.Neo4j/UpdateMatch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.UpdateMatchRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.UpdateMatchRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.UpdateMatchResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.UpdateMatchResponse>;
}
interface INeo4jService_ICreateFeedback extends grpc.MethodDefinition<proto_neo4j_pb.CreateFeedbackRequest, proto_neo4j_pb.StandardResponse> {
    path: "/neo4j.Neo4j/CreateFeedback";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.CreateFeedbackRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.CreateFeedbackRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.StandardResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.StandardResponse>;
}
interface INeo4jService_IGetRelationshipScores extends grpc.MethodDefinition<proto_neo4j_pb.GetRelationshipScoresRequest, proto_neo4j_pb.GetRelationshipScoresResponse> {
    path: "/neo4j.Neo4j/GetRelationshipScores";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.GetRelationshipScoresRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.GetRelationshipScoresRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.GetRelationshipScoresResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.GetRelationshipScoresResponse>;
}
interface INeo4jService_ICheckUserFilters extends grpc.MethodDefinition<proto_neo4j_pb.CheckUserFiltersRequest, proto_neo4j_pb.CheckUserFiltersResponse> {
    path: "/neo4j.Neo4j/CheckUserFilters";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.CheckUserFiltersRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.CheckUserFiltersRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.CheckUserFiltersResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.CheckUserFiltersResponse>;
}
interface INeo4jService_IUpdatePerferences extends grpc.MethodDefinition<proto_neo4j_pb.UpdatePerferencesRequest, proto_neo4j_pb.StandardResponse> {
    path: "/neo4j.Neo4j/UpdatePerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.UpdatePerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.UpdatePerferencesRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.StandardResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.StandardResponse>;
}
interface INeo4jService_IGetUserPerferences extends grpc.MethodDefinition<proto_neo4j_pb.GetUserPerferencesRequest, proto_neo4j_pb.GetUserPerferencesResponse> {
    path: "/neo4j.Neo4j/GetUserPerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.GetUserPerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.GetUserPerferencesRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.GetUserPerferencesResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.GetUserPerferencesResponse>;
}
interface INeo4jService_IPutUserPerferences extends grpc.MethodDefinition<proto_neo4j_pb.PutUserPerferencesRequest, proto_neo4j_pb.PutUserPerferencesResponse> {
    path: "/neo4j.Neo4j/PutUserPerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.PutUserPerferencesRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.PutUserPerferencesRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.PutUserPerferencesResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.PutUserPerferencesResponse>;
}
interface INeo4jService_IGetMatchHistory extends grpc.MethodDefinition<proto_neo4j_pb.MatchHistoryRequest, proto_neo4j_pb.MatchHistoryResponse> {
    path: "/neo4j.Neo4j/GetMatchHistory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_neo4j_pb.MatchHistoryRequest>;
    requestDeserialize: grpc.deserialize<proto_neo4j_pb.MatchHistoryRequest>;
    responseSerialize: grpc.serialize<proto_neo4j_pb.MatchHistoryResponse>;
    responseDeserialize: grpc.deserialize<proto_neo4j_pb.MatchHistoryResponse>;
}

export const Neo4jService: INeo4jService;

export interface INeo4jServer {
    createUser: grpc.handleUnaryCall<proto_neo4j_pb.CreateUserRequest, proto_neo4j_pb.CreateUserResponse>;
    createMatch: grpc.handleUnaryCall<proto_neo4j_pb.CreateMatchRequest, proto_neo4j_pb.CreateMatchResponse>;
    updateMatch: grpc.handleUnaryCall<proto_neo4j_pb.UpdateMatchRequest, proto_neo4j_pb.UpdateMatchResponse>;
    createFeedback: grpc.handleUnaryCall<proto_neo4j_pb.CreateFeedbackRequest, proto_neo4j_pb.StandardResponse>;
    getRelationshipScores: grpc.handleUnaryCall<proto_neo4j_pb.GetRelationshipScoresRequest, proto_neo4j_pb.GetRelationshipScoresResponse>;
    checkUserFilters: grpc.handleUnaryCall<proto_neo4j_pb.CheckUserFiltersRequest, proto_neo4j_pb.CheckUserFiltersResponse>;
    updatePerferences: grpc.handleUnaryCall<proto_neo4j_pb.UpdatePerferencesRequest, proto_neo4j_pb.StandardResponse>;
    getUserPerferences: grpc.handleUnaryCall<proto_neo4j_pb.GetUserPerferencesRequest, proto_neo4j_pb.GetUserPerferencesResponse>;
    putUserPerferences: grpc.handleUnaryCall<proto_neo4j_pb.PutUserPerferencesRequest, proto_neo4j_pb.PutUserPerferencesResponse>;
    getMatchHistory: grpc.handleUnaryCall<proto_neo4j_pb.MatchHistoryRequest, proto_neo4j_pb.MatchHistoryResponse>;
}

export interface INeo4jClient {
    createUser(request: proto_neo4j_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: proto_neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: proto_neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_neo4j_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: proto_neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
}

export class Neo4jClient extends grpc.Client implements INeo4jClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createUser(request: proto_neo4j_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: proto_neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: proto_neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_neo4j_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: proto_neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: proto_neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public createFeedback(request: proto_neo4j_pb.CreateFeedbackRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: proto_neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: proto_neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: proto_neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getUserPerferences(request: proto_neo4j_pb.GetUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.GetUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public putUserPerferences(request: proto_neo4j_pb.PutUserPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.PutUserPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
    public getMatchHistory(request: proto_neo4j_pb.MatchHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_neo4j_pb.MatchHistoryResponse) => void): grpc.ClientUnaryCall;
}
