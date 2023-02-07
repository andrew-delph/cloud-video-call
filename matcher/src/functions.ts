// import * as functions from "firebase-functions";
import { createAdapter } from "@socket.io/redis-adapter";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
import * as common from "react-video-call-common";
import Redlock, { ResourceLockedError } from "redlock";
import { Redis } from "ioredis";
import { Channel, ConsumeMessage } from "amqplib";

const matchTimeout = 50000;

dotenv.config();
initializeApp();
// const db = getFirestore();

// type RedisClientType = ReturnType<typeof createClient>;

function createRedisClient() {
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  redisClient.on("error", function (error) {
    console.error(error);
  });
  return redisClient;
}

const mainRedisClient = createRedisClient();
const pubRedisClient = createRedisClient();
const subRedisClient = createRedisClient();
const lockRedisClient = new Redis({
  host: `${process.env.REDIS_HOST}`,
});

const redlock = new Redlock([lockRedisClient]);

redlock.on("error", (error) => {
  // Ignore cases where a resource is explicitly marked as locked on a client.
  if (error instanceof ResourceLockedError) {
    return;
  }

  // Log all other errors.
  console.log("redlock error");
});

const httpServer = createServer();
const io = new Server(httpServer, {});

const init = Promise.all([
  mainRedisClient.connect(),
  pubRedisClient.connect(),
  subRedisClient.connect(),
])
  .then(async () => {
    io.adapter(
      createAdapter(pubRedisClient, subRedisClient, {
        requestsTimeout: 20000,
      })
    );
    return;
  })
  .then(() => {
    console.log("loaded init");
  });

// export const periodicMaintenanceTask = functions.pubsub
//   .schedule("every minute")
//   .onRun(async (context) => {
//     await init;

//     const connectedSockets = await io.fetchSockets();

//     const connectedSocketsIdList: any = connectedSockets.map(
//       (socket: any) => socket.id
//     );
//     const connectedNum = connectedSockets.length;

//     if (connectedSocketsIdList.length > 0) {
//       // update activeSet start
//       await mainRedisClient.del("temp_activeSet");
//       await mainRedisClient.sAdd("temp_activeSet", connectedSocketsIdList);
//       await mainRedisClient.sInterStore(common.activeSetName, [
//         common.activeSetName,
//         "temp_activeSet",
//       ]);
//       await mainRedisClient.sInterStore(common.readySetName, [
//         common.readySetName,
//         "temp_activeSet",
//       ]);
//       await mainRedisClient.del("temp_activeSet");
//       // update activeSet end
//     }

//     const docRef = db.collection("users").doc("count");

//     await docRef.set({
//       sockets: connectedNum,
//     });

//     functions.logger.info("completed...");
//   });

export const readyEvent = async (msg: ConsumeMessage, channel: Channel) => {
  await init;

  const msgContent: [string, string] = JSON.parse(msg.content.toString());

  const socket1 = msgContent[0];
  const socket2 = msgContent[1];

  // console.log("recieved", socket1, socket2);

  io.in(socket1)
    .timeout(matchTimeout)
    .emit("match", "guest", (err: any, response: any) => {
      if (err) {
        console.error(err);
        // reject("host");
      } else {
        // resolve();
      }
    });

  io.in(socket2)
    .timeout(matchTimeout)
    .emit("match", "host", (err: any, response: any) => {
      if (err) {
        console.error(err);
        // reject("host");
      } else {
        // resolve();
      }
    });

  return;

  // console.log("ready event for " + socketId);

  // io.in(socketId).emit("message", `readyEvent ${socketId}`);

  // const isReady = await mainRedisClient.sIsMember(
  //   common.readySetName,
  //   socketId
  // );

  // if (!isReady) {
  //   console.log("socketId does not exist in the set.");
  //   return;
  // }

  // const randomMembers = (
  //   await mainRedisClient.sRandMemberCount(common.readySetName, 2)
  // ).filter((val) => val != socketId);

  // const otherId = randomMembers.pop();

  // if (otherId == null) {
  //   console.error(`otherID is null`);
  //   throw "other id is null";
  // }

  // redlock.using(
  //   [socketId, otherId],
  //   5000,
  //   { retryCount: 0 },
  //   async (signal) => {
  //     const roomMsg = `locked ${socketId} and ${otherId}.`;

  //     console.log(roomMsg);

  //     const socketIdExists = await mainRedisClient.sIsMember(
  //       common.readySetName,
  //       socketId
  //     );

  //     if (socketIdExists == false) {
  //       console.log(
  //         "socketId does not exist in the set. socketIdExists=" + socketIdExists
  //       );
  //       // task is complete
  //       return;
  //     }

  //     const otherIdExists = await mainRedisClient.sIsMember(
  //       common.readySetName,
  //       otherId
  //     );

  //     if (otherIdExists == false) {
  //       console.log("otherId does not exist in the set.");
  //       // task is not complete
  //       throw "otherId does not exist in the set.";
  //     }

  //     io.socketsLeave(`room-${otherId}`);
  //     io.socketsLeave(`room-${socketId}`);

  //     io.in(socketId).socketsJoin(`room-${otherId}`);
  //     io.in(otherId).socketsJoin(`room-${socketId}`);

  //     io.in(socketId).emit("message", `pairing with ${otherId}`);
  //     io.in(otherId).emit("message", `pairing with ${socketId}`);

  //     // start try without ack

  //     // io.in(otherId).emit("match", "guest", (err: any, response: any) => {
  //     //   if (err) {
  //     //     console.error(err);
  //     //   } else {
  //     //   }
  //     // });

  //     // io.in(socketId).emit("match", "host", (err: any, response: any) => {
  //     //   if (err) {
  //     //     console.error(err);
  //     //   } else {
  //     //   }
  //     // });

  //     // await mainRedisClient.sRem(common.readySetName, socketId);
  //     // await mainRedisClient.sRem(common.readySetName, otherId);

  //     // end try without ack

  //     const guestCallback = (resolve: any, reject: any) => {
  //       io.in(otherId)
  //         .timeout(matchTimeout)
  //         .emit("match", "guest", (err: any, response: any) => {
  //           if (err) {
  //             console.error(err);
  //             reject("guest");
  //           } else {
  //             resolve();
  //           }
  //         });
  //     };

  //     const hostCallback = (resolve: any, reject: any) => {
  //       io.in(socketId)
  //         .timeout(matchTimeout)
  //         .emit("match", "host", (err: any, response: any) => {
  //           if (err) {
  //             console.error(err);
  //             reject("host");
  //           } else {
  //             resolve();
  //           }
  //         });
  //     };

  //     await new Promise(guestCallback)
  //       .then(() => {
  //         return new Promise(hostCallback);
  //       })
  //       .then(async () => {
  //         // if both acks are acked. we can remove them from the ready set.
  //         await mainRedisClient.sRem(common.readySetName, socketId);
  //         await mainRedisClient.sRem(common.readySetName, otherId);
  //       })
  //       .catch((value) => {
  //         io.in(socketId).emit("message", `host paring: failed with ${value}`);
  //         io.in(otherId).emit("message", `guest paring: failed with ${value}`);
  //         throw `match failed with ${value}`;
  //       });
  //   }
  // );
};

// exports.readyEvent = functions
//   .runWith({})
//   .tasks.taskQueue({
//     retryConfig: {
//       maxAttempts: 5,
//       minBackoffSeconds: 1,
//       maxDoublings: 2,
//     },
//     rateLimits: {
//       maxConcurrentDispatches: 50,
//     },
//   })
//   .onDispatch(async (data: any, context: any) => {
//     await init;

//     const socketId: string = data.id;

//     io.in(socketId).emit("message", `readyEvent ${socketId}`);

//     const isReady = await mainRedisClient.sIsMember(
//       common.readySetName,
//       socketId
//     );

//     if (!isReady) {
//       console.log("socketId does not exist in the set.");
//       return;
//     }

//     const randomMembers = (
//       await mainRedisClient.sRandMemberCount(common.readySetName, 2)
//     ).filter((val) => val != socketId);

//     const otherId = randomMembers.pop();

//     if (otherId == null) {
//       // console.error(`otherID is null`);
//       throw "other id is null";
//     }

//     redlock.using(
//       [socketId, otherId],
//       5000,
//       { retryCount: 0 },
//       async (signal) => {
//         const roomMsg = `locked ${socketId} and ${otherId}.`;

//         console.log(roomMsg);

//         const socketIdExists = await mainRedisClient.sIsMember(
//           common.readySetName,
//           socketId
//         );

//         if (socketIdExists == false) {
//           console.log("socketId does not exist in the set.");
//           // task is complete
//           return;
//         }

//         const otherIdExists = await mainRedisClient.sIsMember(
//           common.readySetName,
//           otherId
//         );

//         if (otherIdExists == false) {
//           console.log("otherId does not exist in the set.");
//           // task is not complete
//           throw "otherId does not exist in the set.";
//         }

//         io.socketsLeave(`room-${otherId}`);
//         io.socketsLeave(`room-${socketId}`);

//         io.in(socketId).socketsJoin(`room-${otherId}`);
//         io.in(otherId).socketsJoin(`room-${socketId}`);

//         io.in(socketId).emit("message", `pairing with ${otherId}`);
//         io.in(otherId).emit("message", `pairing with ${socketId}`);

//         // start try without ack

//         // io.in(otherId).emit("match", "guest", (err: any, response: any) => {
//         //   if (err) {
//         //     console.error(err);
//         //   } else {
//         //   }
//         // });

//         // io.in(socketId).emit("match", "host", (err: any, response: any) => {
//         //   if (err) {
//         //     console.error(err);
//         //   } else {
//         //   }
//         // });

//         // await mainRedisClient.sRem(common.readySetName, socketId);
//         // await mainRedisClient.sRem(common.readySetName, otherId);

//         // end try without ack

//         const matchTimeout = 50000;

//         const guestCallback = (resolve: any, reject: any) => {
//           io.in(otherId)
//             .timeout(matchTimeout)
//             .emit("match", "guest", (err: any, response: any) => {
//               if (err) {
//                 console.error(err);
//                 reject("guest");
//               } else {
//                 resolve();
//               }
//             });
//         };

//         const hostCallback = (resolve: any, reject: any) => {
//           io.in(socketId)
//             .timeout(matchTimeout)
//             .emit("match", "host", (err: any, response: any) => {
//               if (err) {
//                 console.error(err);
//                 reject("host");
//               } else {
//                 resolve();
//               }
//             });
//         };

//         await new Promise(guestCallback)
//           .then(() => {
//             return new Promise(hostCallback);
//           })
//           .then(async () => {
//             // if both acks are acked. we can remove them from the ready set.
//             await mainRedisClient.sRem(common.readySetName, socketId);
//             await mainRedisClient.sRem(common.readySetName, otherId);
//           })
//           .catch((value) => {
//             io.in(socketId).emit(
//               "message",
//               `host paring: failed with ${value}`
//             );
//             io.in(otherId).emit(
//               "message",
//               `guest paring: failed with ${value}`
//             );
//             throw `match failed with ${value}`;
//           });
//       }
//     );
//   });
