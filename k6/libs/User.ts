const secure = false;
const domain = __ENV.HOST || `localhost:8888`;

import http from 'k6/http';
import { check, sleep } from 'k6';
import { options_url, redisClient } from '../src/k6_exp';

import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export enum UserType {
  Random = `Random`,
  Female = `Female`,
  Male = `Male`,
  LocationBound = `LocationBound`,
}

export const getRandomUser = (auth: string): User => {
  const userFunctions = [createRandom];

  return userFunctions[Math.floor(Math.random() * userFunctions.length)](auth);
};

export const createRandom = (auth: string): User => {
  const attributes = {};
  const filters = {};

  return new User(auth, attributes, filters, UserType.Random);
};

export const createFemale = (auth: string): User => {
  const attributes = {
    constant: { gender: `female` },
    custom: { long: 1, lat: 1 },
  };
  const filters = { constant: { gender: `male` } };

  return new User(auth, attributes, filters, UserType.Female);
};

export const createMale = (auth: string): User => {
  const attributes = { constant: { gender: `male` } };
  const filters = { constant: { gender: `female` } };

  return new User(auth, attributes, filters, UserType.Male);
};

export const createLocationBound = (auth: string): User => {
  let attributes;
  if (Math.random() > 0.5) {
    attributes = { custom: { long: 1, lat: 2 } };
  } else {
    attributes = { custom: { long: 100, lat: 200 } };
  }
  const filters = { custom: { distance: 100 } };

  return new User(auth, attributes, filters, UserType.LocationBound);
};

export const fromRedis = async (auth: string): Promise<User> => {
  const type: UserType = await redisClient.get(auth + `_type`);
  const attributes = JSON.parse(await redisClient.get(auth + `_attributes`));

  return new User(auth, attributes, {}, type);
};

export const calcScoreMap = new Map<UserType, (otherAttr: any) => number>([
  [
    UserType.Random,
    (otherAttr: any) => {
      return 3;
    },
  ],
  [
    UserType.Male,
    (otherAttr: any) => {
      return otherAttr?.constant?.gender?.startsWith(`female`) ? 5 : 1;
    },
  ],
  [
    UserType.Female,
    (otherAttr: any) => {
      return otherAttr?.constant?.gender?.startsWith(`male`) ? 5 : 1;
    },
  ],
  [
    UserType.LocationBound,
    (otherAttr: any) => {
      return 5;
    },
  ],
]);

export class User {
  attributes = {};
  filters = {};
  auth: string = ``;
  type: UserType;

  constructor(auth: string, attributes: {}, filters: {}, type: UserType) {
    this.type = type;
    this.auth = auth;
    this.attributes = attributes;
    this.filters = filters;
  }

  async updatePreferences(): Promise<void> {
    await redisClient.set(
      this.auth + `_attributes`,
      JSON.stringify(this.attributes),
    );

    await redisClient.set(this.auth + `_type`, this.type.toString());
    const r = http.put(
      `${options_url}/preferences`,
      JSON.stringify({ attributes: this.attributes, filters: this.filters }),
      {
        headers: {
          authorization: this.auth,
          'Content-Type': `application/json`,
        },
      },
    );
    check(r, {
      'updatePreferences response status is 201': r && r.status == 201,
    });
  }

  async getScore(otherAuth: string) {
    const otherAtributes = JSON.parse(
      await redisClient.get(otherAuth + `_attributes`),
    );
    return calcScoreMap.get(this.type)!(otherAtributes);
  }
}
