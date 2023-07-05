import * as usersLib from './User';
import { User, createChatStream, userFunctions } from './User';
import { K6SocketIoExp } from './libs/K6SocketIoExp';
import { nuke, shuffleArray } from './libs/utils';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import redis from 'k6/experimental/redis';
import http from 'k6/http';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

const vus = 50;
const authKeysNum = vus + 15; // number of users created for each parallel instance running
const iterations = vus * 2; //authKeysNum * 1000;

const nukeData = true; // this doesnt work with multile running instances
const uniqueAuthIds = true; //for every test new auth will be created
const shuffleUsers = true; // shuffle the users to insert redis
const updatePreferences = false; // update attributes/filters in neo4j
const maxAuthSkip = 10; // max number of times a auth can be skipped

let validMatchChatTime = 60 * 10; // number of seconds to delay if valid match
let invalidMatchChatTime = 15;

// validMatchChatTime= 10
// invalidMatchChatTime= 10

const matches = 1; //Infinity; // number of matches per vus. -1 is inf

let runnerId = ``;
let uniqueAuthKey = ``;

let authKeysName = `authKeysName`;
let authPrefix = `k6_auth_`;

userFunctions.push(usersLib.createFemale);
userFunctions.push(usersLib.createMale);
userFunctions.push(usersLib.createGroupA);
userFunctions.push(usersLib.createGroupB);
// usersLib.setHotRange(10)
for (let i = 0; i < usersLib.hotRange / 3; i++) {
  userFunctions.push(usersLib.createHot);
}

const updateAuthVars = () => {
  if (uniqueAuthIds) {
    uniqueAuthKey = `${exec.vu.tags[`testid`] || `local`}_`;
    runnerId = `${Math.random().toFixed(5)}_`;
  }

  authKeysName = `authKeysName${uniqueAuthKey}`;
  authPrefix = `k6_auth_${uniqueAuthKey}${runnerId}`;
};

export const options = {
  setupTimeout: `20m`,
  scenarios: {
    shared: {
      executor: `shared-iterations`,
      vus: vus,
      iterations: iterations,
      maxDuration: `10h`,
    },
    // ramping: {
    //   executor: `ramping-vus`,
    //   startVUs: 0,
    //   stages: [
    //     { duration: `5m`, target: vus },
    //     { duration: `2d`, target: vus },
    //     // { duration: `3m`, target: vus * 1 },
    //   ],
    // },
    // longConnection: {
    //   executor: `ramping-vus`,
    //   exec: `longWait`,
    //   stages: [
    //     { duration: `20m`, target: 1000 },
    //     { duration: `2d`, target: 1000 },
    //   ],
    // },
    chatStream: {
      executor: `shared-iterations`,
      exec: `biChatStream`,
      vus: 50,
      iterations: 100,
      maxDuration: `10h`,
    },
    // chatPull: {
    //   executor: `shared-iterations`,
    //   exec: `biChatPull`,
    //   vus: 5,
    //   iterations: 2000,
    //   maxDuration: `10h`,
    // },
  },
};

const established_elapsed = new Trend(`established_elapsed`, true);
const match_elapsed = new Trend(`match_elapsed`, true);
const ready_elapsed = new Trend(`ready_elapsed`, true);
const auth_keys_name_size_trend = new Trend(`auth_keys_name_size`);

const get_auth_trend = new Trend(`get_auth_trend`, true);

const match_elapsed_gauge = new Gauge(`match_elapsed_gauge`, true);

const established_success = new Rate(`established_success`);
const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);
const success_counter = new Counter(`success_counter`);

const matchmakerProgess = new Counter(`matchmakerProgess`);

const valid_score = new Counter(`valid_score`);
const invalid_score = new Counter(`invalid_score`);

const other_parity = new Rate(`other_parity`);

const prediction_score_trend = new Trend(`prediction_score_trend`);
const score_trend = new Trend(`score_trend`);
const score_gauge = new Gauge(`score_gauge`);

export const ws_url =
  __ENV.WS_HOST || `ws://localhost:8888/socket.io/?EIO=4&transport=websocket`;
export const options_url = __ENV.OPTIONS_HOST || `ws://localhost:8888`;

// console.log(`ws_url`, ws_url);
// console.log(`options_url`, options_url);

export const redisClient = new redis.Client({
  addrs: new Array(__ENV.REDIS || `192.168.49.2:30001`), // in the form of 'host:port', separated by commas
});

export async function setup() {
  updateAuthVars();

  if (nukeData) nuke();
  const authKeys: string[] = [];
  for (let i = 0; i < authKeysNum; i++) {
    authKeys.push(`${authPrefix}${i}_`);
  }
  await (async () => {
    await redisClient.del(authKeysName);
    // Change this to watch and delete only if the first time
    return;
  })().then(async () => {
    let users: User[] = [];
    for (let auth of authKeys) {
      let user = usersLib.createUser(auth);
      users.push(user);
    }

    if (shuffleUsers) {
      users = shuffleArray(users);
    }

    for (let user of users) {
      await redisClient.lpush(authKeysName, user.auth);
      await user.init(updatePreferences);
      console.log(`post updatePreferences ${user.auth}`);
    }
  });
}

const getAuth = async () => {
  updateAuthVars();
  let auth: string | null = null;

  const popAuth = async (count: number = 0): Promise<string> => {
    const auth = await redisClient.lpop(authKeysName);
    if (!auth) {
      throw `auth is nill: ${auth}`;
    }

    if (shuffleUsers) {
      if (Math.random() > 0.5 && count < maxAuthSkip) {
        await redisClient.rpush(authKeysName, auth);
        return await popAuth(count + 1);
      }
    }
    return auth;
  };

  try {
    auth = await popAuth();
  } catch (e) {
    console.error(`error with getting auth: ${e}`);
    check(false, {
      popAuth: (_) => false,
    });
    throw e;
  }

  auth_keys_name_size_trend.add(await redisClient.llen(authKeysName));

  return auth;
};
const extraLabels = (myUser: usersLib.User) => {
  return { type: myUser.getTypeString() };
  // return {}
};

function matchUser(socket: K6SocketIoExp, myUser: usersLib.User): Promise<any> {
  let expectMatch: any;
  return (() => {
    expectMatch = socket.expectMessage(`match`, 0, 3);
    const readyPromise = socket.sendWithAck(`ready`, {});
    return readyPromise;
  })()
    .catch((error) => {
      console.info(`failed ready`);
      ready_success.add(false, extraLabels(myUser));
      return Promise.reject(error);
    })
    .then((data: any) => {
      console.log(`ready..`);
      return expectMatch.take(1);
    })
    .then((data: any) => {
      console.log(`match 1 ... ${JSON.stringify(data)}`);
      check(data, {
        'approval has approve': (data: any) =>
          data && data.data && data.data.approve,
      });
      if (typeof data.callback === `function`) {
        data.callback({ approve: true });
      } else {
        console.error(`no approval ack.`);
        throw `no approval ack.`;
      }
      return expectMatch.take(2);
    })
    .then(async (data: any) => {
      console.log(`match 2 ...  ${JSON.stringify(data)}`);
      if (typeof data.callback === `function`) {
        data.callback(`ok`);
      } else {
        console.error(`no accept ack. ${JSON.stringify(data)}`);
        throw `no accept ack.`;
      }
      match_success.add(true, extraLabels(myUser));
      match_elapsed.add(data.elapsed, extraLabels(myUser));
      match_elapsed_gauge.add(data.elapsed / 1000, extraLabels(myUser));
      success_counter.add(1, extraLabels(myUser));
      check(data, {
        'match has feedback id': (data: any) =>
          data && data.data && data.data.feedback_id,
        'match has role': (data: any) => data && data.data && data.data.role,
        'match has other': (data: any) => data && data.data && data.data.other,
        'match has score': (data: any) =>
          data && data.data && data.data.score != null,
        'match has iceservers': (data: any) =>
          data &&
          data.data &&
          data.data.iceServers != null &&
          Array.isArray(data.data.iceServers) &&
          data.data.iceServers.length > 0,
      });

      const matchSuccess = await expectMatch.take(3);

      console.log(`match 3 ...  ${JSON.stringify(data)}`);

      if (!matchSuccess || !matchSuccess.data || !matchSuccess.data.success) {
        console.error(
          `matchSuccess.success is incorrect: ${JSON.stringify(matchSuccess)}`,
        );
        throw `matchSuccess.success is incorrect: ${matchSuccess.data.success}`;
      } else {
        console.log(`matchSuccess.success: ${matchSuccess.data.success}`);
      }

      return data.data;
    })
    .catch((error) => {
      console.info(`failed match`);
      match_success.add(false, extraLabels(myUser));
      return Promise.reject(error);
    });
}
export default async function () {
  let auth: string;
  try {
    const auth_start_time = Date.now();
    auth = await getAuth();
    const auth_end_time = Date.now();
    get_auth_trend.add(auth_end_time - auth_start_time);
  } catch (e) {
    console.error(`getAuth: `, e);
    return;
  }
  console.log(`default auth`, auth);

  const myUser = await usersLib.fromRedis(auth);

  const socket = new K6SocketIoExp(ws_url, { auth: auth }, {});

  socket.setEventMessageHandle(
    `matchmakerProgess`,
    (data: any, callback: any) => {
      matchmakerProgess.add(1, extraLabels(myUser));
      check(data, {
        'valid matchmakerProgess': (data: any) =>
          data && data.readySize != null && data.filterSize != null,
      });
    },
  );

  socket.setOnClose(async () => {
    await redisClient.rpush(authKeysName, auth);
  });

  socket.setOnConnect(() => {
    let expectMatch: any;

    socket.on(`error`, () => {
      error_counter.add(1, extraLabels(myUser));
      console.error(`socket.on.error`);
    });

    socket
      .expectMessage(`established`)
      .take(1)
      .catch((error) => {
        console.info(`failed established`);
        established_success.add(false, extraLabels(myUser));
        return Promise.reject(error);
      })
      .then(async (data: any) => {
        established_success.add(true, extraLabels(myUser));
        established_elapsed.add(data.elapsed, extraLabels(myUser));

        // start the match sequence
        for (let i = 0; i < matches; i++) {
          await matchUser(socket, myUser)
            .then(async (data: any) => {
              // prediction_score_trend.add(data.score);

              let validMatch: boolean = await myUser.getValidMatch(data.other);

              const score = validMatch ? 5 : -5;

              if (validMatch) {
                valid_score.add(1, extraLabels(myUser));
              } else {
                invalid_score.add(1, extraLabels(myUser));
              }

              score_trend.add(score, extraLabels(myUser));
              score_gauge.add(score, extraLabels(myUser));

              const r = http.post(
                `${options_url}/providefeedback`,
                JSON.stringify({
                  feedback_id: data.feedback_id,
                  score: score,
                }),
                {
                  headers: {
                    authorization: auth,
                    'Content-Type': `application/json`,
                  },
                },
              );
              check(r, {
                'feedback response status is 201': r && r.status == 201,
              });

              return validMatch;
            })
            .then(async (validMatch: boolean) => {
              if (validMatch) {
                await socket.sleep(validMatchChatTime * 1000);
              } else {
                await socket.sleep(invalidMatchChatTime * 1000);
              }
            })
            .then(async () => {
              await socket.sendWithAck(`endchat`, true, 1000 * 10);
            });
        }
      })
      .catch((error) => {
        error_counter.add(1, extraLabels(myUser));
        console.error(`end run: ${error}`);
      })
      .finally(async () => {
        socket.close();
      });
  });
  socket.connect();
}

export async function longWait() {
  let auth: string;
  try {
    const auth_start_time = Date.now();
    auth = await getAuth();
    const auth_end_time = Date.now();
    get_auth_trend.add(auth_end_time - auth_start_time);
  } catch (e) {
    console.error(`getAuth: `, e);
    return;
  }

  console.log(`longWait auth`, auth);

  const socket = new K6SocketIoExp(ws_url, { auth: auth }, {}, 0);

  socket.setOnClose(async () => {
    await redisClient.rpush(authKeysName, auth);
  });

  socket.setOnConnect(() => {
    socket.on(`error`, () => {
      error_counter.add(1);
    });
    socket
      .expectMessage(`established`)
      .take(1)
      .catch((error) => {
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        established_success.add(true);
        established_elapsed.add(data.elapsed);
      })
      .then(async () => {
        await socket.sleep(200 * 1000);
      })
      .finally(async () => {
        check(socket.connected, {
          'socket is still connected': socket.connected,
        });
        socket.close();
      });
  });
  socket.connect();
}

export async function biChatStream() {
  console.log(`RUNNING biChatStream`);

  const user1: User = createChatStream();

  await user1.init(true);

  const socket1 = new K6SocketIoExp(
    ws_url,
    { auth: user1.auth },
    {},
    1000 * 60 * 2,
  );

  socket1.setOnConnect(() => {
    socket1.on(`error`, () => {
      error_counter.add(1);
    });
  });

  const numberOfChats = 100;

  const socket1ExpectChat = socket1.expectMessage(`chat`, 0, numberOfChats);

  socket1.setOnConnect(() => {
    matchUser(socket1, user1)
      .then((data) => {
        const score = 5;

        const r = http.post(
          `${options_url}/providefeedback`,
          JSON.stringify({
            feedback_id: data.feedback_id,
            score: score,
          }),
          {
            headers: {
              authorization: user1.auth,
              'Content-Type': `application/json`,
            },
          },
        );
        return data;
      })
      .then(async (data) => {
        for (let i = 0; i < numberOfChats; i++) {
          socket1.send(
            `chat`,
            { target: data.other, message: `msg from socket1. #${i}` },
            null,
          );

          socket1ExpectChat.take(i + 1).then((data) => {
            check(JSON.stringify(data), {
              'message is in order.': (msg) => {
                return msg.includes(`#${i}`);
              },
            });

            if (typeof data.callback === `function`) {
              data.callback({ good: `1111` });
            } else {
              error_counter.add(1);
              console.error(`no chat ack.`);
              throw `no chat ack.`;
            }
          });
          await socket1.sleep(500);
        }

        return Promise.all([socket1ExpectChat.take(numberOfChats)]);
      })
      .finally(async () => {
        socket1.close();
      });
  });

  socket1.connect();
}

export async function biChatPull() {
  console.log(`RUNNING biChatPull`);
  let auth1: string = `k6_bi_pull_chat_1_${Math.random()}`;

  let auth2: string = `k6_bi_pull_chat_2_${Math.random()}`;

  const socket1 = new K6SocketIoExp(ws_url, { auth: auth1 }, {}, 0);

  const socket2 = new K6SocketIoExp(ws_url, { auth: auth2 }, {}, 0);

  socket1.setOnConnect(() => {
    socket1.on(`error`, () => {
      error_counter.add(1);
    });
  });

  socket2.setOnConnect(() => {
    socket2.on(`error`, () => {
      error_counter.add(1);
    });

    const numberOfChats = 10;

    Promise.all([
      socket1.expectMessage(`established`).take(1),
      socket2.expectMessage(`established`).take(1),
    ])
      .catch((error) => {
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        established_success.add(true);
        established_elapsed.add(data.elapsed);
        socket2.close();
      })
      .then(async () => {
        for (let i = 0; i < numberOfChats; i++) {
          socket1.send(
            `chat`,
            { target: auth2, message: `msg from socket1. #${i}` },
            null,
          );
        }
        await socket1.sleep(1000 * 10);
        return;
      })
      .finally(async () => {
        socket1.close();
        const r = http.get(`${options_url}/chat/${auth1}`, {
          headers: {
            authorization: auth2,
          },
        });
        const chatMessages: any[] = r.json(`chatMessages`) as any;

        check(chatMessages, {
          '>= 5 msgs returned': (val) => {
            return Array.isArray(val) && val.length >= 5;
          },
        });
      });
  });

  socket1.connect();
  socket2.connect();
}
