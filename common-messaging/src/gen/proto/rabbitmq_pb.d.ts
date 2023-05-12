// package: rabbitmq
// file: proto/rabbitmq.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class ReadyMessage extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): ReadyMessage;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadyMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ReadyMessage): ReadyMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadyMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadyMessage;
    static deserializeBinaryFromReader(message: ReadyMessage, reader: jspb.BinaryReader): ReadyMessage;
}

export namespace ReadyMessage {
    export type AsObject = {
        userId: string,
    }
}

export class MatchmakerMessage extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): MatchmakerMessage;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MatchmakerMessage.AsObject;
    static toObject(includeInstance: boolean, msg: MatchmakerMessage): MatchmakerMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MatchmakerMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MatchmakerMessage;
    static deserializeBinaryFromReader(message: MatchmakerMessage, reader: jspb.BinaryReader): MatchmakerMessage;
}

export namespace MatchmakerMessage {
    export type AsObject = {
        userId: string,
    }
}
