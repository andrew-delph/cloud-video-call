// package: video_call
// file: proto/data.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class CreateUserRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): CreateUserRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserRequest): CreateUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserRequest;
    static deserializeBinaryFromReader(message: CreateUserRequest, reader: jspb.BinaryReader): CreateUserRequest;
}

export namespace CreateUserRequest {
    export type AsObject = {
        userId: string,
    }
}

export class CreateUserResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): CreateUserResponse;

    getMessage(): string;
    setMessage(value: string): CreateUserResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserResponse): CreateUserResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserResponse;
    static deserializeBinaryFromReader(message: CreateUserResponse, reader: jspb.BinaryReader): CreateUserResponse;
}

export namespace CreateUserResponse {
    export type AsObject = {
        error: boolean,
        message: string,
    }
}

export class CreateMatchRequest extends jspb.Message { 
    getUserId1(): string;
    setUserId1(value: string): CreateMatchRequest;

    getUserId2(): string;
    setUserId2(value: string): CreateMatchRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateMatchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateMatchRequest): CreateMatchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateMatchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateMatchRequest;
    static deserializeBinaryFromReader(message: CreateMatchRequest, reader: jspb.BinaryReader): CreateMatchRequest;
}

export namespace CreateMatchRequest {
    export type AsObject = {
        userId1: string,
        userId2: string,
    }
}

export class CreateMatchResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): CreateMatchResponse;

    getMessage(): string;
    setMessage(value: string): CreateMatchResponse;

    getUserId1(): string;
    setUserId1(value: string): CreateMatchResponse;

    getUserId2(): string;
    setUserId2(value: string): CreateMatchResponse;

    getMatchId1(): number;
    setMatchId1(value: number): CreateMatchResponse;

    getMatchId2(): number;
    setMatchId2(value: number): CreateMatchResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateMatchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateMatchResponse): CreateMatchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateMatchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateMatchResponse;
    static deserializeBinaryFromReader(message: CreateMatchResponse, reader: jspb.BinaryReader): CreateMatchResponse;
}

export namespace CreateMatchResponse {
    export type AsObject = {
        error: boolean,
        message: string,
        userId1: string,
        userId2: string,
        matchId1: number,
        matchId2: number,
    }
}

export class EndCallRequest extends jspb.Message { 
    getMatchId(): number;
    setMatchId(value: number): EndCallRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EndCallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EndCallRequest): EndCallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EndCallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EndCallRequest;
    static deserializeBinaryFromReader(message: EndCallRequest, reader: jspb.BinaryReader): EndCallRequest;
}

export namespace EndCallRequest {
    export type AsObject = {
        matchId: number,
    }
}

export class GetRelationshipScoresRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): GetRelationshipScoresRequest;

    clearOtherUsersList(): void;
    getOtherUsersList(): Array<string>;
    setOtherUsersList(value: Array<string>): GetRelationshipScoresRequest;
    addOtherUsers(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRelationshipScoresRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRelationshipScoresRequest): GetRelationshipScoresRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRelationshipScoresRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRelationshipScoresRequest;
    static deserializeBinaryFromReader(message: GetRelationshipScoresRequest, reader: jspb.BinaryReader): GetRelationshipScoresRequest;
}

export namespace GetRelationshipScoresRequest {
    export type AsObject = {
        userId: string,
        otherUsersList: Array<string>,
    }
}

export class GetRelationshipScoresResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): GetRelationshipScoresResponse;

    getMessage(): string;
    setMessage(value: string): GetRelationshipScoresResponse;


    getRelationshipScoresMap(): jspb.Map<string, Score>;
    clearRelationshipScoresMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRelationshipScoresResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetRelationshipScoresResponse): GetRelationshipScoresResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRelationshipScoresResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRelationshipScoresResponse;
    static deserializeBinaryFromReader(message: GetRelationshipScoresResponse, reader: jspb.BinaryReader): GetRelationshipScoresResponse;
}

export namespace GetRelationshipScoresResponse {
    export type AsObject = {
        error: boolean,
        message: string,

        relationshipScoresMap: Array<[string, Score.AsObject]>,
    }
}

export class Score extends jspb.Message { 
    getProb(): number;
    setProb(value: number): Score;

    getScore(): number;
    setScore(value: number): Score;

    getNscore(): number;
    setNscore(value: number): Score;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Score.AsObject;
    static toObject(includeInstance: boolean, msg: Score): Score.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Score, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Score;
    static deserializeBinaryFromReader(message: Score, reader: jspb.BinaryReader): Score;
}

export namespace Score {
    export type AsObject = {
        prob: number,
        score: number,
        nscore: number,
    }
}

export class FilterObject extends jspb.Message { 
    getUserId1(): string;
    setUserId1(value: string): FilterObject;

    getUserId2(): string;
    setUserId2(value: string): FilterObject;

    getPassed(): boolean;
    setPassed(value: boolean): FilterObject;

    getLastMatchedTime(): string;
    setLastMatchedTime(value: string): FilterObject;

    getFriends(): boolean;
    setFriends(value: boolean): FilterObject;

    getNegative(): boolean;
    setNegative(value: boolean): FilterObject;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FilterObject.AsObject;
    static toObject(includeInstance: boolean, msg: FilterObject): FilterObject.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FilterObject, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FilterObject;
    static deserializeBinaryFromReader(message: FilterObject, reader: jspb.BinaryReader): FilterObject;
}

export namespace FilterObject {
    export type AsObject = {
        userId1: string,
        userId2: string,
        passed: boolean,
        lastMatchedTime: string,
        friends: boolean,
        negative: boolean,
    }
}

export class CheckUserFiltersRequest extends jspb.Message { 
    clearFiltersList(): void;
    getFiltersList(): Array<FilterObject>;
    setFiltersList(value: Array<FilterObject>): CheckUserFiltersRequest;
    addFilters(value?: FilterObject, index?: number): FilterObject;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckUserFiltersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckUserFiltersRequest): CheckUserFiltersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckUserFiltersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckUserFiltersRequest;
    static deserializeBinaryFromReader(message: CheckUserFiltersRequest, reader: jspb.BinaryReader): CheckUserFiltersRequest;
}

export namespace CheckUserFiltersRequest {
    export type AsObject = {
        filtersList: Array<FilterObject.AsObject>,
    }
}

export class CheckUserFiltersResponse extends jspb.Message { 
    clearFiltersList(): void;
    getFiltersList(): Array<FilterObject>;
    setFiltersList(value: Array<FilterObject>): CheckUserFiltersResponse;
    addFilters(value?: FilterObject, index?: number): FilterObject;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckUserFiltersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckUserFiltersResponse): CheckUserFiltersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckUserFiltersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckUserFiltersResponse;
    static deserializeBinaryFromReader(message: CheckUserFiltersResponse, reader: jspb.BinaryReader): CheckUserFiltersResponse;
}

export namespace CheckUserFiltersResponse {
    export type AsObject = {
        filtersList: Array<FilterObject.AsObject>,
    }
}

export class StandardResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): StandardResponse;

    getMessage(): string;
    setMessage(value: string): StandardResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StandardResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StandardResponse): StandardResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StandardResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StandardResponse;
    static deserializeBinaryFromReader(message: StandardResponse, reader: jspb.BinaryReader): StandardResponse;
}

export namespace StandardResponse {
    export type AsObject = {
        error: boolean,
        message: string,
    }
}

export class UpdatePerferencesRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UpdatePerferencesRequest;


    getAttributesConstantMap(): jspb.Map<string, string>;
    clearAttributesConstantMap(): void;


    getFiltersConstantMap(): jspb.Map<string, string>;
    clearFiltersConstantMap(): void;


    getAttributesCustomMap(): jspb.Map<string, string>;
    clearAttributesCustomMap(): void;


    getFiltersCustomMap(): jspb.Map<string, string>;
    clearFiltersCustomMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePerferencesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePerferencesRequest): UpdatePerferencesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePerferencesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePerferencesRequest;
    static deserializeBinaryFromReader(message: UpdatePerferencesRequest, reader: jspb.BinaryReader): UpdatePerferencesRequest;
}

export namespace UpdatePerferencesRequest {
    export type AsObject = {
        userId: string,

        attributesConstantMap: Array<[string, string]>,

        filtersConstantMap: Array<[string, string]>,

        attributesCustomMap: Array<[string, string]>,

        filtersCustomMap: Array<[string, string]>,
    }
}

export class GetUserPerferencesRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): GetUserPerferencesRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserPerferencesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserPerferencesRequest): GetUserPerferencesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserPerferencesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserPerferencesRequest;
    static deserializeBinaryFromReader(message: GetUserPerferencesRequest, reader: jspb.BinaryReader): GetUserPerferencesRequest;
}

export namespace GetUserPerferencesRequest {
    export type AsObject = {
        userId: string,
    }
}

export class GetUserPerferencesResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): GetUserPerferencesResponse;

    getMessage(): string;
    setMessage(value: string): GetUserPerferencesResponse;

    getUserId(): string;
    setUserId(value: string): GetUserPerferencesResponse;


    getAttributesConstantMap(): jspb.Map<string, string>;
    clearAttributesConstantMap(): void;


    getFiltersConstantMap(): jspb.Map<string, string>;
    clearFiltersConstantMap(): void;


    getAttributesCustomMap(): jspb.Map<string, string>;
    clearAttributesCustomMap(): void;


    getFiltersCustomMap(): jspb.Map<string, string>;
    clearFiltersCustomMap(): void;

    getPriority(): number;
    setPriority(value: number): GetUserPerferencesResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserPerferencesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserPerferencesResponse): GetUserPerferencesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserPerferencesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserPerferencesResponse;
    static deserializeBinaryFromReader(message: GetUserPerferencesResponse, reader: jspb.BinaryReader): GetUserPerferencesResponse;
}

export namespace GetUserPerferencesResponse {
    export type AsObject = {
        error: boolean,
        message: string,
        userId: string,

        attributesConstantMap: Array<[string, string]>,

        filtersConstantMap: Array<[string, string]>,

        attributesCustomMap: Array<[string, string]>,

        filtersCustomMap: Array<[string, string]>,
        priority: number,
    }
}

export class PutUserPerferencesRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): PutUserPerferencesRequest;


    getAttributesConstantMap(): jspb.Map<string, string>;
    clearAttributesConstantMap(): void;


    getFiltersConstantMap(): jspb.Map<string, string>;
    clearFiltersConstantMap(): void;


    getAttributesCustomMap(): jspb.Map<string, string>;
    clearAttributesCustomMap(): void;


    getFiltersCustomMap(): jspb.Map<string, string>;
    clearFiltersCustomMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PutUserPerferencesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PutUserPerferencesRequest): PutUserPerferencesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PutUserPerferencesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PutUserPerferencesRequest;
    static deserializeBinaryFromReader(message: PutUserPerferencesRequest, reader: jspb.BinaryReader): PutUserPerferencesRequest;
}

export namespace PutUserPerferencesRequest {
    export type AsObject = {
        userId: string,

        attributesConstantMap: Array<[string, string]>,

        filtersConstantMap: Array<[string, string]>,

        attributesCustomMap: Array<[string, string]>,

        filtersCustomMap: Array<[string, string]>,
    }
}

export class PutUserPerferencesResponse extends jspb.Message { 
    getError(): boolean;
    setError(value: boolean): PutUserPerferencesResponse;

    getMessage(): string;
    setMessage(value: string): PutUserPerferencesResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PutUserPerferencesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PutUserPerferencesResponse): PutUserPerferencesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PutUserPerferencesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PutUserPerferencesResponse;
    static deserializeBinaryFromReader(message: PutUserPerferencesResponse, reader: jspb.BinaryReader): PutUserPerferencesResponse;
}

export namespace PutUserPerferencesResponse {
    export type AsObject = {
        error: boolean,
        message: string,
    }
}

export class CreateFeedbackRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): CreateFeedbackRequest;

    getMatchId(): number;
    setMatchId(value: number): CreateFeedbackRequest;

    getScore(): number;
    setScore(value: number): CreateFeedbackRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateFeedbackRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateFeedbackRequest): CreateFeedbackRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateFeedbackRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateFeedbackRequest;
    static deserializeBinaryFromReader(message: CreateFeedbackRequest, reader: jspb.BinaryReader): CreateFeedbackRequest;
}

export namespace CreateFeedbackRequest {
    export type AsObject = {
        userId: string,
        matchId: number,
        score: number,
    }
}

export class MatchHistoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): MatchHistoryRequest;

    getSkip(): number;
    setSkip(value: number): MatchHistoryRequest;

    getLimit(): number;
    setLimit(value: number): MatchHistoryRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MatchHistoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MatchHistoryRequest): MatchHistoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MatchHistoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MatchHistoryRequest;
    static deserializeBinaryFromReader(message: MatchHistoryRequest, reader: jspb.BinaryReader): MatchHistoryRequest;
}

export namespace MatchHistoryRequest {
    export type AsObject = {
        userId: string,
        skip: number,
        limit: number,
    }
}

export class MatchHistoryResponse extends jspb.Message { 
    getTotal(): number;
    setTotal(value: number): MatchHistoryResponse;

    clearMatchHistoryList(): void;
    getMatchHistoryList(): Array<Match>;
    setMatchHistoryList(value: Array<Match>): MatchHistoryResponse;
    addMatchHistory(value?: Match, index?: number): Match;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MatchHistoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MatchHistoryResponse): MatchHistoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MatchHistoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MatchHistoryResponse;
    static deserializeBinaryFromReader(message: MatchHistoryResponse, reader: jspb.BinaryReader): MatchHistoryResponse;
}

export namespace MatchHistoryResponse {
    export type AsObject = {
        total: number,
        matchHistoryList: Array<Match.AsObject>,
    }
}

export class Match extends jspb.Message { 
    getUserId1(): string;
    setUserId1(value: string): Match;

    getUserId2(): string;
    setUserId2(value: string): Match;

    getCreateTime(): string;
    setCreateTime(value: string): Match;

    getUserId1Score(): number;
    setUserId1Score(value: number): Match;

    getUserId2Score(): number;
    setUserId2Score(value: number): Match;

    getFriends(): boolean;
    setFriends(value: boolean): Match;

    getNegative(): boolean;
    setNegative(value: boolean): Match;

    getMatchId(): number;
    setMatchId(value: number): Match;

    getEndTime(): string;
    setEndTime(value: string): Match;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Match.AsObject;
    static toObject(includeInstance: boolean, msg: Match): Match.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Match, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Match;
    static deserializeBinaryFromReader(message: Match, reader: jspb.BinaryReader): Match;
}

export namespace Match {
    export type AsObject = {
        userId1: string,
        userId2: string,
        createTime: string,
        userId1Score: number,
        userId2Score: number,
        friends: boolean,
        negative: boolean,
        matchId: number,
        endTime: string,
    }
}

export class InsertUserVectorsRequest extends jspb.Message { 
    clearUserVectorsList(): void;
    getUserVectorsList(): Array<UserVector>;
    setUserVectorsList(value: Array<UserVector>): InsertUserVectorsRequest;
    addUserVectors(value?: UserVector, index?: number): UserVector;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InsertUserVectorsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InsertUserVectorsRequest): InsertUserVectorsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InsertUserVectorsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InsertUserVectorsRequest;
    static deserializeBinaryFromReader(message: InsertUserVectorsRequest, reader: jspb.BinaryReader): InsertUserVectorsRequest;
}

export namespace InsertUserVectorsRequest {
    export type AsObject = {
        userVectorsList: Array<UserVector.AsObject>,
    }
}

export class UserVector extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserVector;

    clearVectorList(): void;
    getVectorList(): Array<number>;
    setVectorList(value: Array<number>): UserVector;
    addVector(value: number, index?: number): number;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserVector.AsObject;
    static toObject(includeInstance: boolean, msg: UserVector): UserVector.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserVector, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserVector;
    static deserializeBinaryFromReader(message: UserVector, reader: jspb.BinaryReader): UserVector;
}

export namespace UserVector {
    export type AsObject = {
        userId: string,
        vectorList: Array<number>,
    }
}
