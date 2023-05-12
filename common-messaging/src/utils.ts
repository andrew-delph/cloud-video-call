import * as gpb from 'google-protobuf';

export function messageToBuffer(message: gpb.Message): Buffer {
  return Buffer.from(message.serializeBinary());
}

export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer);
}
