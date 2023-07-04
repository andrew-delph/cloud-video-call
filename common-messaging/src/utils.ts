import * as gpb from 'google-protobuf';

export function messageToBuffer(message: gpb.Message): Buffer {
  return Buffer.from(message.serializeBinary());
}

export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer);
}

export type RpcMethod<TRequest, TResponse> = (
  request: TRequest,
  callback: (error: any, response: TResponse) => void,
) => void;

export async function makeGrpcRequest<TRequest, TResponse>(
  client: any,
  method: RpcMethod<TRequest, TResponse>,
  request: TRequest,
): Promise<TResponse> {
  return new Promise<TResponse>((resolve, reject) => {
    try {
      method.call(client, request, (error: any, response: TResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
