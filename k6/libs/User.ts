const secure = false;
const domain = __ENV.HOST || `localhost:8888`;

import http from 'k6/http';
import { check, sleep } from 'k6';
import { redisClient } from '../src/k6_exp';

import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export enum UserType {
  Female = `Female`,
  FemalePicky = `FemalePicky`,
  Male = `Male`,
}

export const createFemale = (auth: string): User => {
  const attributes = { gender: `female` };
  const preferences = {};

  return new User(auth, attributes, preferences, UserType.Female);
};

export const createFemalePicky = (auth: string): User => {
  const attributes = { gender: `femalepicky` };
  const preferences = {};

  return new User(auth, attributes, preferences, UserType.FemalePicky);
};

export const createMale = (auth: string): User => {
  const attributes = { gender: `male` };
  const preferences = {};

  return new User(auth, attributes, preferences, UserType.Male);
};

export const fromRedis = async (auth: string): Promise<User> => {
  const type: UserType = await redisClient.get(auth + `_type`);
  const attributes = JSON.parse(await redisClient.get(auth + `_attributes`));

  return new User(auth, attributes, {}, type);
};

export const calcScoreMap = new Map<UserType, (otherAttr: any) => number>([
  [
    UserType.Male,
    (otherAttr: any) => {
      return otherAttr.gender.startsWith(`female`) ? 5 : 1;
    },
  ],
  [
    UserType.Female,
    (otherAttr: any) => {
      return otherAttr.gender.startsWith(`male`) ? 5 : 1;
    },
  ],
  [
    UserType.FemalePicky,
    (otherAttr: any) => {
      return (otherAttr.hot && otherAttr.hot) > 4 ? 5 : 1;
    },
  ],
]);

export class User {
  attributes = {};
  preferences = {};
  auth: string = ``;
  type: UserType;

  constructor(auth: string, attributes: {}, preferences: {}, type: UserType) {
    this.type = type;
    this.auth = auth;
    this.attributes = attributes;
    this.preferences = preferences;
  }

  async updateAttributes(): Promise<void> {
    await redisClient.set(
      this.auth + `_attributes`,
      JSON.stringify(this.attributes),
    );

    await redisClient.set(this.auth + `_type`, this.type.toString());
    const r = http.put(
      `${secure ? `https` : `http`}://${domain}/options/updateAttributes`,
      JSON.stringify({
        attributes: this.attributes,
      }),
      {
        headers: {
          authorization: this.auth,
          'Content-Type': `application/json`,
        },
      },
    );
    check(r, {
      'updateAttributes response status is 200': r && r.status == 200,
    });
  }
  updatePreferences(): void {}

  async getScore(otherAuth: string) {
    const otherAtributes = JSON.parse(
      await redisClient.get(otherAuth + `_attributes`),
    );
    return calcScoreMap.get(this.type)!(otherAtributes);
  }
}
