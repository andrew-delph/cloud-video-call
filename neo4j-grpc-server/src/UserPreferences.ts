import { driver, redisClient } from './neo4j-grpc-server';
import * as neo4j from 'neo4j-driver';
export type UserPreferences = {
  a_constant: any;
  f_constant: any;
  a_custom: any;
  f_custom: any;
  priority: number;
};
const userPreferencesCacheEx = 60 * 60;
const getUserPreferencesCacheKey = (userId: string): string => {
  return `UserPreferences-${userId}`;
};

function parseQueryUserPreferences(
  results: neo4j.QueryResult,
): UserPreferences {
  if (results && results.records && results.records.length) {
    return {
      a_constant: results.records[0].get(`a_constant`)?.properties || {},
      f_constant: results.records[0].get(`f_constant`)?.properties || {},
      a_custom: results.records[0].get(`a_custom`)?.properties || {},
      f_custom: results.records[0].get(`f_custom`)?.properties || {},
      priority: results.records[0].get(`priority`) || 0,
    };
  }
  return {
    a_constant: {},
    f_constant: {},
    a_custom: {},
    f_custom: {},
    priority: 0,
  };
}

const queryMetadata = `
MATCH (p1:Person {userId: $userId})
OPTIONAL MATCH (p1)-[r1:USER_ATTRIBUTES_CONSTANT]->(a_constant:MetaData)
OPTIONAL MATCH (p1)-[r2:USER_FILTERS_CONSTANT]->(f_constant:MetaData)
OPTIONAL MATCH (p1)-[r3:USER_ATTRIBUTES_CUSTOM]->(a_custom:MetaData)
OPTIONAL MATCH (p1)-[r4:USER_FILTERS_CUSTOM]->(f_custom:MetaData)
RETURN p1, a_constant, f_constant, a_custom, f_custom, coalesce(p1.priority,0) as priority`;

export async function readUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const cacheData = await readUserPreferencesCache(userId);
  if (cacheData) {
    return cacheData;
  }
  return readUserPreferencesDatabase(userId);
}

async function readUserPreferencesCache(
  userId: string,
): Promise<UserPreferences | null> {
  const userPreferencesString = await redisClient.get(
    getUserPreferencesCacheKey(userId),
  );
  if (userPreferencesString) {
    return JSON.parse(userPreferencesString);
  } else {
    return null;
  }
}

async function readUserPreferencesDatabase(
  userId: string,
): Promise<UserPreferences> {
  const session = driver.session();
  return await session
    .run(queryMetadata, { userId: userId })
    .then((results) => {
      return parseQueryUserPreferences(results);
    })
    .then(async (preferences) => {
      await redisClient.set(
        getUserPreferencesCacheKey(userId),
        JSON.stringify(preferences),
        `EX`,
        userPreferencesCacheEx,
      );
      return preferences;
    })
    .finally(() => {
      session.close();
    });
}

export async function writeUserPreferencesDatabase(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const session = driver.session();

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_ATTRIBUTES_CONSTANT]->(md:MetaData{type:"USER_ATTRIBUTES_CONSTANT"})
    SET md = $constant
    SET md.type = "USER_ATTRIBUTES_CONSTANT"
    RETURN p, md
    `,
    { userId, constant: preferences.a_constant || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_ATTRIBUTES_CUSTOM]->(md:MetaData{type:"USER_ATTRIBUTES_CUSTOM"})
    SET md = $custom
    SET md.type = "USER_ATTRIBUTES_CUSTOM"
    RETURN p, md
    `,
    { userId, custom: preferences.a_custom || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_FILTERS_CONSTANT]->(md:MetaData{type:"USER_FILTERS_CONSTANT"})
    SET md = $constant
    SET md.type = "USER_FILTERS_CONSTANT"
    RETURN p, md
    `,
    { userId, constant: preferences.f_constant || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_FILTERS_CUSTOM]->(md:MetaData{type:"USER_FILTERS_CUSTOM"})
    SET md = $custom
    SET md.type = "USER_FILTERS_CUSTOM"
    RETURN p, md
    `,
    { userId, custom: preferences.f_custom || {} },
  );

  const result = await session.run(
    `
    MATCH (p:Person{userId: $userId})
    RETURN coalesce(p.priority, 0) as priority
    `,
    { userId },
  );

  if (result.records.length != 1) {
    throw `Incorrect results length for write user: ${result.records.length}`;
  }

  preferences.priority = result.records[0].get(`priority`);

  await redisClient.set(
    getUserPreferencesCacheKey(userId),
    JSON.stringify(preferences),
    `EX`,
    userPreferencesCacheEx,
  );

  await session.close();

  session.close();
}
