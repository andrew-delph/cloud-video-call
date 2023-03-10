import { async } from '../dist/k6_exp';
import { redisClient } from '../src/k6_exp';
import { User, UserType } from './User';

export const createFemale = (auth: string): User => {
  const attributes = { gender: `female` };
  const preferences = {};

  return new User(auth, attributes, preferences, UserType.Female);
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
