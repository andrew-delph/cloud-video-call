import { calcScoreMap, UserType } from '../libs/User';

console.log(UserType.Female);

console.log(calcScoreMap.get(UserType.Female.toString() as UserType)!({}));

// console.log(calcScoreMap);

// console.log(UserType.Female.toString() == UserType.Female);
