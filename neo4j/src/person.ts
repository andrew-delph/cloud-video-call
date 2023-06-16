import { driver, retryFunction, session } from './neo4j_functions';

export enum PersonType {
  Random = `Random`,
  Female = `Female`,
  Male = `Male`,
  LocationBound = `LocationBound`,
  Hot = `Hot`,
  Positive = `Positive`,
  Negative = `Negative`,
  GroupA = `GroupA`,
  GroupB = `GroupB`,
}

export function userdIdToType(userId: string) {
  const split = userId.split(`_`);
  const val = split.pop()!;
  return val;
}

export const indexToColor: { [key: number]: string } = {
  1: `Orange`,
  2: `Blue`,
};

function areListsEqual(list1: string[], list2: string[]) {
  const sortedList1 = list1.slice().sort();
  const sortedList2 = list2.slice().sort();

  return (
    sortedList1.length === sortedList2.length &&
    sortedList1.every((element, index) => element === sortedList2[index])
  );
}

const validLists = [
  [PersonType.Male.valueOf(), PersonType.Female.valueOf()],
  [PersonType.GroupA.valueOf(), PersonType.GroupA.valueOf()],
  [PersonType.GroupB.valueOf(), PersonType.GroupB.valueOf()],
  [PersonType.Random.valueOf(), PersonType.Random.valueOf()],
];
for (let i = 0; i < 6; i++) {
  validLists.push([
    `${PersonType.Hot.valueOf()}${i}`,
    `${PersonType.Hot.valueOf()}${i}`,
  ]);
  validLists.push([
    `${PersonType.Hot.valueOf()}${i}`,
    `${PersonType.Hot.valueOf()}${i - 1}`,
  ]);
  validLists.push([
    `${PersonType.Hot.valueOf()}${i}`,
    `${PersonType.Hot.valueOf()}${i + 1}`,
  ]);
}

export const validFriends = (ntype: string, mtype: string): boolean => {
  const testList = [userdIdToType(ntype), userdIdToType(mtype)];

  for (let check of validLists) {
    if (areListsEqual(testList, check)) {
      return true;
    }
  }

  return false;
};

export const calcScoreMap = new Map<
  PersonType,
  (me: Person, otherPerson: Person) => number
>([
  [
    PersonType.Random,
    (me: Person, otherPerson: Person) => {
      return Math.round(Math.random() * 20) - 10;
    },
  ],
  [
    PersonType.Male,
    (me: Person, otherPerson: Person) => {
      if (otherPerson.type == PersonType.Female) return 10;
      return -10;
    },
  ],
  [
    PersonType.Female,
    (me: Person, otherPerson: Person) => {
      if (otherPerson.type == PersonType.Male) return 10;
      return -10;
    },
  ],
  [
    PersonType.Hot,
    (me: Person, otherPerson: Person) => {
      if ((otherPerson.attributes.hot ?? -10) >= me.attributes.hot - 1)
        return 10;
      return -10;
    },
  ],
  [
    PersonType.Positive,
    (me: Person, otherPerson: Person) => {
      return 10;
    },
  ],
  [
    PersonType.Negative,
    (me: Person, otherPerson: Person) => {
      return -10;
    },
  ],
  [
    PersonType.GroupA,
    (me: Person, otherPerson: Person) => {
      if (otherPerson.type == PersonType.GroupA) return 10;
      return -10;
    },
  ],
  [
    PersonType.GroupB,
    (me: Person, otherPerson: Person) => {
      if (otherPerson.type == PersonType.GroupB) return 10;
      return -10;
    },
  ],
  //   [
  //     PersonType.LocationBound,
  //     (me: Person, otherPerson: Person) => {
  //       return 3;
  //     },
  //   ],
]);

export const createRandom = (auth: string): Person => {
  const attributes = {};

  return new Person(PersonType.Random, auth, attributes);
};

export const createFemale = (auth: string): Person => {
  let attributes: any = {
    gender: `female`,
  };
  // attributes = {};

  return new Person(PersonType.Female, auth, attributes);
};

export const createMale = (auth: string): Person => {
  let attributes: any = { gender: `male` };
  // attributes = {};

  return new Person(PersonType.Male, auth, attributes);
};

export const createHot = (auth: string): Person => {
  const attributes = { hot: Math.floor(Math.random() * 4) };

  return new Person(PersonType.Hot, auth, attributes);
};

export const createPositive = (auth: string): Person => {
  let attributes = {};
  // attributes = { random: `other` };

  return new Person(PersonType.Positive, auth, attributes);
};

export const createNegative = (auth: string): Person => {
  let attributes = {};
  // attributes = { random: `other` };

  return new Person(PersonType.Negative, auth, attributes);
};

export const createGroupA = (auth: string): Person => {
  let attributes = {};
  attributes = { group: `A` };

  return new Person(PersonType.GroupA, auth, attributes);
};

export const createGroupB = (auth: string): Person => {
  let attributes = {};
  attributes = { group: `B` };

  return new Person(PersonType.GroupB, auth, attributes);
};

// export const createLocationBound = (auth: string): Person => {
//   let attributes;
//   if (Math.random() > 0.5) {
//     attributes = { custom: { long: 1, lat: 2 } };
//   } else {
//     attributes = { custom: { long: 100, lat: 200 } };
//   }
//   const filters = { custom: { distance: 100 } };

//   return new Person(auth, attributes, filters, PersonType.LocationBound);
// };

export let userFunctions: any[] = [];

// let friends = true;
// // friends = false;

// if (friends) {
//   userFunctions.push(createFemale);
//   userFunctions.push(createMale);
// } else {
//   userFunctions.push(createGroupA);
//   userFunctions.push(createGroupB);
// }

userFunctions.push(createFemale);
userFunctions.push(createMale);
userFunctions.push(createGroupA);
userFunctions.push(createGroupB);

// userFunctions.push(createPositive);
// userFunctions.push(createNegative);
// userFunctions.push(createRandom);
// userFunctions.push(createHot);

function* getPersonGenerator() {
  let current = 0;

  while (true) {
    yield userFunctions[current % userFunctions.length];
    current += 1;
  }
}

const personGenerator = getPersonGenerator();

export const getPerson = (auth: string): Person => {
  //return userFunctions[Math.floor(Math.random() * userFunctions.length)](auth);
  return personGenerator.next().value(auth);
};

export class Person {
  type: PersonType;
  userId: string;
  attributes: any;

  constructor(type: PersonType, userId: string, attributes: any) {
    this.type = type;
    this.userId = userId + `_` + type.valueOf();
    this.attributes = attributes;
  }

  async createNode(): Promise<void> {
    const typeIndex = Object.values(PersonType).indexOf(this.type);
    let typeLabel = this.type.valueOf();
    if (this.attributes.hot) {
      typeLabel += this.attributes.hot;
    }
    // const session = driver.session();
    await session.run(
      `
        MERGE (p:Person {userId:$userId})
        WITH p
        CREATE (d:MetaData)
        SET d = $attributes
        SET p.typeIndex = ${typeIndex}
        SET p.type = '${typeLabel}'
        MERGE (p)-[:USER_ATTRIBUTES_CONSTANT]->(d);
    `,
      { userId: this.userId, attributes: this.attributes },
    );

    // await session.close();
  }

  async createFeedback(other: Person): Promise<void> {
    const calcScore = calcScoreMap.get(this.type);
    if (!calcScore) throw Error(`calcScore is undefined`);

    await this._createFeedback(other, calcScore(this, other));
    // retryFunction(
    //   this._createFeedback.bind(this, other, calcScore(this, other)),
    //   5,
    //   100,
    // );
  }

  async _createFeedback(other: Person, score: number): Promise<void> {
    // const session = driver.session();
    await session.run(
      `
        MATCH (a:Person{userId: $userId})
        MATCH (b:Person{userId: $otherId})
        CREATE (a)-[f1:FEEDBACK {score: $score}]->(b)
      `,
      {
        userId: this.userId,
        otherId: other.userId,
        score: score,
      },
    );
    // await session.close();
  }
}
