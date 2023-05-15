import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { K6SocketIoExp } from './libs/K6SocketIoExp';
import redis from 'k6/experimental/redis';
import { check, sleep } from 'k6';
import http from 'k6/http';
import * as usersLib from './libs/User';
import { nuke, shuffleArray } from './libs/utils';
import exec from 'k6/execution';
import { userFunctions } from './libs/User';

const vus = 20;
const authKeysNum = 1000; // number of users created for each parallel instance running
const nukeData = true; // this doesnt work with multile running instances
const uniqueAuthIds = true; //for every test new auth will be created
const shuffleUsers = true; // shuffle the users to insert redis

let runnerId = ``;
let uniqueAuthKey = ``;

let authKeysName = `authKeysName`;
let authPrefix = `k6_auth_`;

userFunctions.push(usersLib.createFemale);
userFunctions.push(usersLib.createMale);
userFunctions.push(usersLib.createGroupA);
userFunctions.push(usersLib.createGroupB);
for (let i = 0; i < usersLib.hotRange / 3; i++) {
  userFunctions.push(usersLib.createHot);
}

const updateAuthVars = () => {
  if (uniqueAuthIds) {
    uniqueAuthKey = `${exec.vu.tags[`testid`]}_`;
    runnerId = `${Math.random().toFixed(5)}_`;
  }

  authKeysName = `authKeysName${uniqueAuthKey}`;
  authPrefix = `k6_auth_${uniqueAuthKey}${runnerId}`;
};

export const options = {
  setupTimeout: `20m`,
  scenarios: {
    matchTest: {
      executor: `shared-iterations`,
      vus: vus,
      iterations: authKeysNum * 3,
    },
    //   matchTest: {
    //     executor: `ramping-vus`,
    //     startVUs: vus,
    //     stages: [
    //       { duration: `3h`, target: vus },
    //       // { duration: `2h`, target: vus * 3 },
    //       // { duration: `3m`, target: vus * 1 },
    //     ],
    //   },
    // longConnection: { // TODO fix this....
    //   executor: `ramping-vus`,
    //   exec: `longWait`,
    //   startVUs: 10,
    //   stages: [{ duration: `10m`, target: 10 }],
    // },
  },
};

const established_elapsed = new Trend(`established_elapsed`, true);
const match_elapsed = new Trend(`match_elapsed`, true);
const ready_elapsed = new Trend(`ready_elapsed`, true);

const get_auth_trend = new Trend(`get_auth_trend`, true);
const setup_trend = new Trend(`setup_trend`, true); //TODO implement

const match_elapsed_gauge = new Gauge(`match_elapsed_gauge`, true);

const established_success = new Rate(`established_success`);
const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);
const success_counter = new Counter(`success_counter`);

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
  addrs: new Array(__ENV.REDIS || `localhost:6379`), // in the form of 'host:port', separated by commas
});

export function setup() {
  updateAuthVars();

  if (nukeData) nuke();
  const authKeys: string[] = [];
  for (let i = 0; i < authKeysNum; i++) {
    authKeys.push(`${authPrefix}${i}_`);
  }
  (async () => {
    // await redisClient.del(authKeysName);
    // Change this to watch and delete only if the first time
    return;
  })().then(async () => {
    let users = [];
    for (let auth of authKeys) {
      let user = usersLib.createUser(auth);
      users.push(user);
    }

    if (shuffleUsers) {
      users = shuffleArray(users);
    }

    for (let user of users) {
      await redisClient.lpush(authKeysName, user.auth);
      await user.updatePreferences();
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
      if (Math.random() > 0.5 && count < authKeysNum / 3) {
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

  return auth;
};
export default async function () {
  let auth: string;
  try {
    const auth_start_time = Date.now();
    auth = await getAuth();
    const auth_end_time = Date.now();
    get_auth_trend.add(auth_end_time - auth_start_time);
  } catch (e) {
    console.error(e);
    return;
  }

  console.log(`auth`, auth);

  const myUser = await usersLib.fromRedis(auth);

  const socket = new K6SocketIoExp(ws_url, { auth: auth }, {});

  socket.setOnClose(async () => {
    await redisClient.rpush(authKeysName, auth);
  });

  socket.setOnConnect(() => {
    let expectMatch: any;

    socket.on(`error`, () => {
      error_counter.add(1, { type: myUser.getTypeString() });
    });
    socket
      .expectMessage(`established`)
      .catch((error) => {
        console.error(`failed established`);
        established_success.add(false, { type: myUser.getTypeString() });
        return Promise.reject(error);
      })
      .then((data: any) => {
        established_success.add(true, { type: myUser.getTypeString() });
        established_elapsed.add(data.elapsed, { type: myUser.getTypeString() });

        expectMatch = socket.expectMessage(`match`);
        const readyPromise = socket.sendWithAck(`ready`, {});
        return readyPromise;
      })
      .catch((error) => {
        console.error(`failed ready`);
        ready_success.add(false, { type: myUser.getTypeString() });
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`ready..`);
        ready_success.add(true, { type: myUser.getTypeString() });
        ready_elapsed.add(data.elapsed, { type: myUser.getTypeString() });
        return expectMatch;
      })
      .catch((error) => {
        console.error(`failed match`);
        match_success.add(false, { type: myUser.getTypeString() });
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`match`);
        if (typeof data.callback === `function`) {
          data.callback(`ok`);
        }
        match_success.add(true, { type: myUser.getTypeString() });
        match_elapsed.add(data.elapsed, { type: myUser.getTypeString() });
        match_elapsed_gauge.add(data.elapsed / 1000, {
          type: myUser.getTypeString(),
        });
        success_counter.add(1, { type: myUser.getTypeString() });
        check(data, {
          'match has feedback id': (data: any) =>
            data && data.data && data.data.feedback_id,
          'match has role': (data: any) => data && data.data && data.data.role,
          'match has other': (data: any) =>
            data && data.data && data.data.other,
          'match has score': (data: any) =>
            data && data.data && data.data.score != null,
        });
        return data.data;
      })
      .then(async (data: any) => {
        // prediction_score_trend.add(data.score);

        let score = await myUser.getScore(data.other);

        score_trend.add(score, { type: myUser.getTypeString() });
        score_gauge.add(score, { type: myUser.getTypeString() });

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
        check(r, { 'feedback response status is 201': r && r.status == 201 });
      })
      .finally(async () => {
        socket.close();
      });
  });
  socket.connect();
}

export async function longWait() {
  const auth = await getAuth();

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
      .then(() => {
        check(socket.connected, {
          'socket is still connected': socket.connected,
        });
      })
      .finally(async () => {
        socket.close();
      });
  });
  socket.connect();
}
