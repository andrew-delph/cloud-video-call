import { calcScoreMap, UserType } from './libs/User';
import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

console.log(UserType.Female);

console.log(calcScoreMap.get(UserType.Female.toString() as UserType)!({}));

console.log(randomIntBetween(0, 5));

// console.log(UserType.Female.toString() == UserType.Female);
