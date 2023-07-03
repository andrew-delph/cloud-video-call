import { options_url, redisClient } from './k6_run';
import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';

const secure = false;
const domain = __ENV.HOST || `localhost:8888`;

export enum UserType {
  Random = `Random`,
  Female = `Female`,
  Male = `Male`,
  LocationBound = `LocationBound`,
  Hot = `Hot`,
  GroupA = `GroupA`,
  GroupB = `GroupB`,
}

export const createRandom = (auth: string): User => {
  const attributes = {};
  const filters = {};

  return new User(auth, attributes, filters, UserType.Random);
};

export const createFemale = (auth: string): User => {
  let attributes: any = { constant: { gender: `female` } };
  let filters = { constant: {} };
  // filters = { constant: { gender: `male` } };
  // if (Math.random() > 0.5) {
  //   attributes = { constant: {} };
  // }

  return new User(auth, attributes, filters, UserType.Female);
};

export const createMale = (auth: string): User => {
  let attributes: any = { constant: { gender: `male` } };
  let filters = { constant: {} };
  // filters = { constant: { gender: `female` } };
  // if (Math.random() > 0.5) {
  //   attributes = { constant: {} };
  // }

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

export let hotRange = 6;

export const setHotRange = (range: number) => {
  hotRange = range;
};

function* hotnessGeneratorFunction() {
  let current = 0;

  while (true) {
    yield current % hotRange;
    current += 1;
  }
}
const hotnessGenerator = hotnessGeneratorFunction();
export const createHot = (auth: string): User => {
  const attributes = {
    constant: { hot: `Hot${hotnessGenerator.next().value}` },
  };
  const filters = {};

  return new User(auth, attributes, filters, UserType.Hot);
};

export const createGroupA = (auth: string): User => {
  const attributes = { group: `aaa` };
  const filters = {};

  return new User(auth, attributes, filters, UserType.GroupA);
};

export const createGroupB = (auth: string): User => {
  const attributes = { group: `bbb` };
  const filters = {};

  return new User(auth, attributes, filters, UserType.GroupB);
};

export const userFunctions: any[] = [
  // createFemale,
  // createMale,
  // createGroupA,
  // createGroupB,
  // // createHot,
];

function* getUserGenerator() {
  let current = 0;

  while (true) {
    yield userFunctions[current % userFunctions.length];
    current += 1;
  }
}

const userGenerator = getUserGenerator();

export const createUser = (auth: string): User => {
  // return userFunctions[Math.floor(Math.random() * userFunctions.length)](auth);
  return userGenerator.next().value(auth);
};

export const fromRedis = async (auth: string): Promise<User> => {
  const type: UserType = await redisClient.get(auth + `_type`);
  const attributes = JSON.parse(await redisClient.get(auth + `_attributes`));

  return new User(auth, attributes, {}, type);
};

export const validMatchMap = new Map<
  UserType,
  (me: User, otherUser: User) => boolean
>([
  [
    UserType.Random,
    (me: User, otherUser: User) => {
      return true;
    },
  ],
  [
    UserType.Male,
    (me: User, otherUser: User) => {
      return otherUser.type == UserType.Female ? true : false;
    },
  ],
  [
    UserType.Female,
    (me: User, otherUser: User) => {
      return otherUser.type == UserType.Male ? true : false;
    },
  ],
  [
    UserType.LocationBound,
    (me: User, otherUser: User) => {
      return true;
    },
  ],
  [
    UserType.Hot,
    (me: User, otherUser: User) => {
      const myHotVal = me?.attributes?.constant?.hot ?? `-100`;
      const otherHotVal = otherUser?.attributes?.constant?.hot ?? `-100`;
      const myHot = parseInt(myHotVal.match(/\d+/)[0]);
      const otherHot = parseInt(otherHotVal.match(/\d+/)[0]);
      return Math.abs(myHot - otherHot) <= 1 ? true : false;
    },
  ],
  [
    UserType.GroupA,
    (me: User, otherUser: User) => {
      return me.type == otherUser.type ? true : false;
    },
  ],
  [
    UserType.GroupB,
    (me: any, otherUser: User) => {
      return me.type == otherUser.type ? true : false;
    },
  ],
]);

export class User {
  attributes: any = {};
  filters: any = {};
  auth: string = ``;
  type: UserType;

  constructor(auth: string, attributes: any, filters: any, type: UserType) {
    this.type = type;
    this.attributes = attributes;
    this.filters = filters;
    this.auth = auth + this.getTypeString();
  }

  getTypeString() {
    return `${this.type.valueOf()}`;
    // return `${this.attributes?.constant?.hot ?? this.type.valueOf()}`;
  }

  async init(updatePreferences: boolean): Promise<void> {
    await redisClient.set(
      this.auth + `_attributes`,
      JSON.stringify(this.attributes),
    );

    await redisClient.set(this.auth + `_type`, this.type.toString());

    if (updatePreferences) {
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
  }

  async getValidMatch(otherAuth: string) {
    const otherUser = await fromRedis(otherAuth);
    return validMatchMap.get(this.type)!(this, otherUser);
  }
}
