// package: rabbitmq
// file: proto/rabbitmq.proto

/* tslint:disable */

/* eslint-disable */
import * as jspb from 'google-protobuf';

export class MatchmakerMessage extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): MatchmakerMessage;

  getCooldownAttempts(): number;
  setCooldownAttempts(value: number): MatchmakerMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MatchmakerMessage.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MatchmakerMessage,
  ): MatchmakerMessage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MatchmakerMessage,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): MatchmakerMessage;
  static deserializeBinaryFromReader(
    message: MatchmakerMessage,
    reader: jspb.BinaryReader,
  ): MatchmakerMessage;
}

export namespace MatchmakerMessage {
  export type AsObject = {
    userId: string;
    cooldownAttempts: number;
  };
}

export class ReadyMessage extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): ReadyMessage;

  getPriority(): number;
  setPriority(value: number): ReadyMessage;

  getCooldownAttempts(): number;
  setCooldownAttempts(value: number): ReadyMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReadyMessage.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ReadyMessage,
  ): ReadyMessage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ReadyMessage,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ReadyMessage;
  static deserializeBinaryFromReader(
    message: ReadyMessage,
    reader: jspb.BinaryReader,
  ): ReadyMessage;
}

export namespace ReadyMessage {
  export type AsObject = {
    userId: string;
    priority: number;
    cooldownAttempts: number;
  };
}

export class MatchMessage extends jspb.Message {
  getUserId1(): string;
  setUserId1(value: string): MatchMessage;

  getUserId2(): string;
  setUserId2(value: string): MatchMessage;

  getScore(): number;
  setScore(value: number): MatchMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MatchMessage.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MatchMessage,
  ): MatchMessage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MatchMessage,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): MatchMessage;
  static deserializeBinaryFromReader(
    message: MatchMessage,
    reader: jspb.BinaryReader,
  ): MatchMessage;
}

export namespace MatchMessage {
  export type AsObject = {
    userId1: string;
    userId2: string;
    score: number;
  };
}

export class UserNotificationMessage extends jspb.Message {
  getUserId(): string;
  setUserId(value: string): UserNotificationMessage;

  getEventName(): string;
  setEventName(value: string): UserNotificationMessage;

  getJsonData(): string;
  setJsonData(value: string): UserNotificationMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserNotificationMessage.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UserNotificationMessage,
  ): UserNotificationMessage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UserNotificationMessage,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UserNotificationMessage;
  static deserializeBinaryFromReader(
    message: UserNotificationMessage,
    reader: jspb.BinaryReader,
  ): UserNotificationMessage;
}

export namespace UserNotificationMessage {
  export type AsObject = {
    userId: string;
    eventName: string;
    jsonData: string;
  };
}
