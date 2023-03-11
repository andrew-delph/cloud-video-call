import { Counter, Rate, Trend } from 'k6/metrics';
import { K6SocketIoExp } from '../libs/K6SocketIoExp';
import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import redis from 'k6/experimental/redis';
import { check, sleep } from 'k6';
import http from 'k6/http';
import * as users from '../libs/User';
import { nuke } from '../libs/utils';

export const redisClient = new redis.Client({
  addrs: new Array(`redis.default.svc.cluster.local:6379`), // in the form of 'host:port', separated by commas
});
const authKeysNum = 1000;
const authKeysName = `authKeysName`;
export function setup() {
  nuke();
  const authKeys: string[] = [];
  for (let i = 0; i < authKeysNum; i++) {
    authKeys.push(`k6_auth_${i}`);
  }
  redisClient.del(authKeysName).finally(async () => {
    for (let auth of authKeys) {
      let user;

      if (Math.random() < 0.5) {
        user = users.createFemale(auth);
      } else {
        user = users.createMale(auth);
      }
      await user.updateAttributes();
      await user.updateFilters();
    }

    await redisClient.lpush(authKeysName, ...authKeys);
  });
}

const vus = 5;
export const options = {
  // vus: 5,
  // iterations: authKeysNum * 10,
  // duration: `1h`,
  scenarios: {
    matchTest: {
      executor: `ramping-vus`,
      startVUs: 4,
      stages: [
        { duration: `3m`, target: vus * 1 },
        { duration: `5m`, target: vus * 3 },
        { duration: `3m`, target: vus * 1 },
      ],
    },
    longConnection: {
      executor: `ramping-vus`,
      exec: `longWait`,
      startVUs: 10,
      stages: [{ duration: `20m`, target: 10 }],
    },
  },
};

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
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  let url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  const auth = await getAuth();

  const myUser = await users.fromRedis(auth);

  const socket = new K6SocketIoExp(url, { auth: auth }, {}, 0);

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
        ready_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
        ready_success.add(true);
        ready_elapsed.add(data.elapsed);
        return expectMatch;
      })
      .catch((error) => {
        match_success.add(false);
        return Promise.reject(error);
      })
      .then((data: any) => {
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

        const r = http.post(
          `${secure ? `https` : `http`}://${domain}/options/providefeedback`,
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
        console.log(`r.status is ${r.status}`);
        sleep(5);
      })
      .finally(async () => {
        socket.close();
      });
  });
  socket.connect();
}

export async function longWait() {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;
  let url = `${
    secure ? `wss` : `ws`
  }://${domain}/socket.io/?EIO=4&transport=websocket`;

  const auth = await getAuth();

  const socket = new K6SocketIoExp(url, { auth: auth }, {}, 0);

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
      .then(() => {
        sleep(100);
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
