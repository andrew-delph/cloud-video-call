// package: neo4j
// file: neo4j.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as neo4j_pb from "./neo4j_pb";

interface INeo4jService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createUser: INeo4jService_ICreateUser;
    createMatch: INeo4jService_ICreateMatch;
    updateMatch: INeo4jService_IUpdateMatch;
    getRelationshipScores: INeo4jService_IGetRelationshipScores;
    checkUserFilters: INeo4jService_ICheckUserFilters;
    updatePerferences: INeo4jService_IUpdatePerferences;
    getPerferences: INeo4jService_IGetPerferences;
}

interface INeo4jService_ICreateUser extends grpc.MethodDefinition<neo4j_pb.CreateUserRequest, neo4j_pb.CreateUserResponse> {
    path: "/neo4j.Neo4j/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.CreateUserResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.CreateUserResponse>;
}
interface INeo4jService_ICreateMatch extends grpc.MethodDefinition<neo4j_pb.CreateMatchRequest, neo4j_pb.CreateMatchResponse> {
    path: "/neo4j.Neo4j/CreateMatch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.CreateMatchRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.CreateMatchRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.CreateMatchResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.CreateMatchResponse>;
}
interface INeo4jService_IUpdateMatch extends grpc.MethodDefinition<neo4j_pb.UpdateMatchRequest, neo4j_pb.UpdateMatchResponse> {
    path: "/neo4j.Neo4j/UpdateMatch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.UpdateMatchRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.UpdateMatchRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.UpdateMatchResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.UpdateMatchResponse>;
}
interface INeo4jService_IGetRelationshipScores extends grpc.MethodDefinition<neo4j_pb.GetRelationshipScoresRequest, neo4j_pb.GetRelationshipScoresResponse> {
    path: "/neo4j.Neo4j/GetRelationshipScores";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.GetRelationshipScoresRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.GetRelationshipScoresRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.GetRelationshipScoresResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.GetRelationshipScoresResponse>;
}
interface INeo4jService_ICheckUserFilters extends grpc.MethodDefinition<neo4j_pb.CheckUserFiltersRequest, neo4j_pb.CheckUserFiltersResponse> {
    path: "/neo4j.Neo4j/CheckUserFilters";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.CheckUserFiltersRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.CheckUserFiltersRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.CheckUserFiltersResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.CheckUserFiltersResponse>;
}
interface INeo4jService_IUpdatePerferences extends grpc.MethodDefinition<neo4j_pb.UpdatePerferencesRequest, neo4j_pb.StandardResponse> {
    path: "/neo4j.Neo4j/UpdatePerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.UpdatePerferencesRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.UpdatePerferencesRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.StandardResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.StandardResponse>;
}
interface INeo4jService_IGetPerferences extends grpc.MethodDefinition<neo4j_pb.GetPerferencesRequest, neo4j_pb.GetPerferencesResponse> {
    path: "/neo4j.Neo4j/GetPerferences";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<neo4j_pb.GetPerferencesRequest>;
    requestDeserialize: grpc.deserialize<neo4j_pb.GetPerferencesRequest>;
    responseSerialize: grpc.serialize<neo4j_pb.GetPerferencesResponse>;
    responseDeserialize: grpc.deserialize<neo4j_pb.GetPerferencesResponse>;
}

export const Neo4jService: INeo4jService;

export interface INeo4jServer extends grpc.UntypedServiceImplementation {
    createUser: grpc.handleUnaryCall<neo4j_pb.CreateUserRequest, neo4j_pb.CreateUserResponse>;
    createMatch: grpc.handleUnaryCall<neo4j_pb.CreateMatchRequest, neo4j_pb.CreateMatchResponse>;
    updateMatch: grpc.handleUnaryCall<neo4j_pb.UpdateMatchRequest, neo4j_pb.UpdateMatchResponse>;
    getRelationshipScores: grpc.handleUnaryCall<neo4j_pb.GetRelationshipScoresRequest, neo4j_pb.GetRelationshipScoresResponse>;
    checkUserFilters: grpc.handleUnaryCall<neo4j_pb.CheckUserFiltersRequest, neo4j_pb.CheckUserFiltersResponse>;
    updatePerferences: grpc.handleUnaryCall<neo4j_pb.UpdatePerferencesRequest, neo4j_pb.StandardResponse>;
    getPerferences: grpc.handleUnaryCall<neo4j_pb.GetPerferencesRequest, neo4j_pb.GetPerferencesResponse>;
}

export interface INeo4jClient {
    createUser(request: neo4j_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createUser(request: neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: neo4j_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    createMatch(request: neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: neo4j_pb.UpdateMatchRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    updateMatch(request: neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    getPerferences(request: neo4j_pb.GetPerferencesRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
    getPerferences(request: neo4j_pb.GetPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
    getPerferences(request: neo4j_pb.GetPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
}

export class Neo4jClient extends grpc.Client implements INeo4jClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createUser(request: neo4j_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createUser(request: neo4j_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateUserResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: neo4j_pb.CreateMatchRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public createMatch(request: neo4j_pb.CreateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CreateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: neo4j_pb.UpdateMatchRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public updateMatch(request: neo4j_pb.UpdateMatchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.UpdateMatchResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public getRelationshipScores(request: neo4j_pb.GetRelationshipScoresRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetRelationshipScoresResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public checkUserFilters(request: neo4j_pb.CheckUserFiltersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.CheckUserFiltersResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public updatePerferences(request: neo4j_pb.UpdatePerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.StandardResponse) => void): grpc.ClientUnaryCall;
    public getPerferences(request: neo4j_pb.GetPerferencesRequest, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getPerferences(request: neo4j_pb.GetPerferencesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
    public getPerferences(request: neo4j_pb.GetPerferencesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: neo4j_pb.GetPerferencesResponse) => void): grpc.ClientUnaryCall;
}
