export const hi = `hi1`;

export * from '../proto_gen/neo4j_grpc_pb';
export * from '../proto_gen/neo4j_pb';

export * as grpc from '@grpc/grpc-js';

// export function requestPromise<T>(clientCall, request): Promise<T> {
//   return new Promise((resolve, reject) => {
//     clientCall(request, (error, response) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(response as T); // Cast the response to type T1
//       }
//     });
//   });
// }
