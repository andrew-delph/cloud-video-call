import { driver, retryFunction, session } from './neo4j_functions';

export enum PersonType {
  Random = `Random`,
  Female = `Female`,
  Male = `Male`,
  LocationBound = `LocationBound`,
  Hot = `Hot`,
}

export const indexToColor: { [key: number]: string } = {
  1: `Orange`,
  2: `Blue`,
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
      if ((otherPerson.attributes.hot ?? -10) >= me.attributes.hot - 2)
        return 10;
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

export const getRandomPerson = (auth: string): Person => {
  let userFunctions = [];
  userFunctions.push(createFemale);
  userFunctions.push(createMale);
  // userFunctions.push(createRandom);
  // userFunctions.push(createHot);

  return userFunctions[Math.floor(Math.random() * userFunctions.length)](auth);
};

export const createRandom = (auth: string): Person => {
  const attributes = { hot: -5 };

  return new Person(PersonType.Random, auth, attributes);
};

export const createFemale = (auth: string): Person => {
  const attributes = {
    gender: `female`,
  };

  return new Person(PersonType.Female, auth, attributes);
};

export const createMale = (auth: string): Person => {
  const attributes = { gender: `male` };

  return new Person(PersonType.Male, auth, attributes);
};

export const createHot = (auth: string): Person => {
  const attributes = { hot: Math.round(Math.random() * 20) - 10 };

  return new Person(PersonType.Hot, auth, attributes);
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

export class Person {
  type: PersonType;
  userId: string;
  attributes: any;

  constructor(type: PersonType, userId: string, attributes: any) {
    this.type = type;
    this.userId = userId;
    this.attributes = attributes;
  }

  async createNode(): Promise<void> {
    const typeIndex = Object.values(PersonType).indexOf(this.type);
    const session = driver.session();
    await session.run(
      `
        MERGE (p:Person {userId:$userId})
        WITH p
        CREATE (d:MetaData)
        SET d = $attributes
        SET p.typeIndex = ${typeIndex}
        SET p.type = '${this.type.valueOf()}'
        MERGE (p)-[:USER_ATTRIBUTES_CONSTANT]->(d);
    `,
      { userId: this.userId, attributes: this.attributes },
    );

    await session.close();
  }

  async createFeedback(other: Person): Promise<void> {
    const calcScore = calcScoreMap.get(this.type);
    if (!calcScore) throw Error(`calcScore is undefined`);

    retryFunction(
      this._createFeedback.bind(this, other, calcScore(this, other)),
      5,
      100,
    );
  }

  async _createFeedback(other: Person, score: number): Promise<void> {
    const session = driver.session();
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
    await session.close();
  }
}
