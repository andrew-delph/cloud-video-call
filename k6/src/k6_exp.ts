import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';
import redis from 'k6/experimental/redis';
import { check, sleep } from 'k6';
import http from 'k6/http';
import * as users from '../libs/User';
import { nuke } from '../libs/utils';

export const ws_url =
  __ENV.WS_HOST || `ws://localhost:8888/socket.io/?EIO=4&transport=websocket`;

export const options_url = __ENV.OPTIONS_HOST || `ws://localhost:8888`;

console.log(`ws_url`, ws_url);
console.log(`options_url`, options_url);

export const redisClient = new redis.Client({
  addrs: new Array(__ENV.REDIS || `localhost:6379`), // in the form of 'host:port', separated by commas
});

const authKeysNum = 300;
const vus = 50;
const nukeData = false;

export const options = {
  setupTimeout: `10m`,
  // vus: 5,
  // iterations: authKeysNum * 10,
  // duration: `1h`,
  scenarios: {
    // matchTest: {
    //   executor: `shared-iterations`,
    //   vus: vus,
    //   iterations: authKeysNum * 100,
    // },
    matchTest: {
      executor: `ramping-vus`,
      startVUs: vus,
      stages: [
        { duration: `2h`, target: vus },
        // { duration: `2h`, target: vus * 3 },
        // { duration: `3m`, target: vus * 1 },
      ],
    },
    // longConnection: { // TODO fix this....
    //   executor: `ramping-vus`,
    //   exec: `longWait`,
    //   startVUs: 10,
    //   stages: [{ duration: `10m`, target: 10 }],
    // },
  },
};

const authKeysName = `authKeysName`;

export function setup() {
  if (nukeData) nuke();
  const authKeys: string[] = [];
  for (let i = 0; i < authKeysNum; i++) {
    authKeys.push(`k6_auth_${i}`);
  }
  console.log(`pre delete connectedAuthMapName`);
  redisClient
    .del(`connectedAuthMapName`)
    .then(() => {
      console.log(`pre delete authKeysName`);
      return redisClient.del(authKeysName);
    })
    .then(async () => {
      console.log(`post delete authKeysName`);
      for (let auth of authKeys) {
        let user = users.getUser(auth);
        await user.updatePreferences();
        console.log(`post updatePreferences ${auth}`);
      }

      await redisClient.lpush(authKeysName, ...authKeys);
    });
}

const established_elapsed = new Trend(`established_elapsed`, true);
const match_elapsed = new Trend(`match_elapsed`, true);
const ready_elapsed = new Trend(`ready_elapsed`, true);

const established_success = new Rate(`established_success`);
const ready_success = new Rate(`ready_success`);
const match_success = new Rate(`match_success`);

const error_counter = new Counter(`error_counter`);
const success_counter = new Counter(`success_counter`);

const other_parity = new Rate(`other_parity`);

const prediction_score_trend = new Trend(`prediction_score_trend`);
const score_trend = new Trend(`score_trend`);
const score_gauge = new Gauge(`score_gauge`);

const getAuth = async () => {
  let auth: string | null = null;

  const popAuth = async (count: number = 0): Promise<string> => {
    const auth = await redisClient.lpop(authKeysName);
    if (!auth) {
      throw `auth is nill: ${auth}`;
    }
    if (Math.random() > 0.5 && count < 10) {
      await redisClient.rpush(authKeysName, auth);
      return await popAuth(count + 1);
    }
    return auth;
  };

  try {
    auth = await popAuth();
    while (!auth) {
      sleep(1);
      auth = await popAuth();
    }
  } catch (e) {
    console.log(`error with getting auth: ${e}`);
    sleep(10);
    throw e;
  }

  return auth;
};

export default async function () {
  const auth = await getAuth();
  console.log(`auth`, auth);

  const myUser = await users.fromRedis(auth);

  const socket = new K6SocketIoExp(ws_url, { auth: auth }, {}, 40000);

  socket.setOnClose(async () => {
    await redisClient.rpush(authKeysName, auth);
  });

  socket.setOnConnect(() => {
    let expectMatch: any;

    socket.on(`error`, () => {
      error_counter.add(1);
    });
    socket
      .expectMessage(`established`)
      .catch((error) => {
        console.error(`failed established`);
        established_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        established_success.add(true);
        established_elapsed.add(data.elapsed);

        expectMatch = socket.expectMessage(`match`);
        const readyPromise = socket.sendWithAck(`ready`, {});
        return readyPromise;
      })
      .catch((error) => {
        console.error(`failed ready`);
        ready_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`ready..`);
        ready_success.add(true);
        ready_elapsed.add(data.elapsed);
        return expectMatch;
      })
      .catch((error) => {
        console.error(`failed match`);
        match_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        console.log(`match`);
        if (typeof data.callback === `function`) {
          data.callback(`ok`);
        }
        match_success.add(true);
        match_elapsed.add(data.elapsed);
        success_counter.add(1);
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
        prediction_score_trend.add(data.score);

        let score = await myUser.getScore(data.other).catch((e) => {
          console.error(`error getting score: ${e}`);
          return -1;
        });

        score_trend.add(score);
        score_gauge.add(score);

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
        await socket.sleep(5000);
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
