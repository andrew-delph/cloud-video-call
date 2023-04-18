import { session } from './neo4j_functions';

export enum PersonType {
  Random = `Random`,
  Female = `Female`,
  Male = `Male`,
  LocationBound = `LocationBound`,
  Hot = `Hot`,
}

export const calcScoreMap = new Map<
  PersonType,
  (me: Person, otherAttr: Person) => number
>([
  [
    PersonType.Random,
    (me: Person, otherAttr: Person) => {
      return 3;
    },
  ],
  [
    PersonType.Male,
    (me: Person, otherAttr: Person) => {
      return 3;
    },
  ],
  [
    PersonType.Female,
    (me: Person, otherAttr: Person) => {
      return 3;
    },
  ],
  [
    PersonType.LocationBound,
    (me: Person, otherAttr: Person) => {
      return 3;
    },
  ],
  [
    PersonType.Hot,
    (me: Person, otherAttr: Person) => {
      return 3;
    },
  ],
]);

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
    await session.run(
      `
        MERGE (p:Person {userId:$userId})
        WITH p
        CREATE (d:MetaData)
        SET d = $attributes
        MERGE (p)-[:USER_ATTRIBUTES_CONSTANT]->(d);
    `,
      { userId: this.userId, attributes: this.attributes },
    );
  }

  async createFeedback(other: Person): Promise<void> {
    await session.run(
      `
        MATCH (a:Person{userId: $userId})
        MATCH (b:Person{userId: $otherId})
        CREATE (a)-[f1:FEEDBACK {score: $score}]->(b)
      `,
      { userId: this.userId, otherId: other.userId, score: 0 },
    );
  }
}
