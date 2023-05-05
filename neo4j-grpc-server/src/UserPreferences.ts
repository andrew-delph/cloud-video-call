import { driver, redisClient } from './neo4j-grpc-server';
import * as neo4j from 'neo4j-driver';
import * as common from 'common';
import haversine from 'haversine-distance';

const logger = common.getLogger();

export type UserPreferences = {
  a_constant: any;
  f_constant: any;
  a_custom: any;
  f_custom: any;
  priority: number;
};
const userPreferencesCacheEx = 60 * 60 * 2;
const compareUserFiltersCacheEx = 60 * 60 * 2;

const getUserPreferencesCacheKey = (userId: string): string => {
  return `UserPreferences-${userId}`;
};

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
const CompareUserFiltersPrefix = `CompareUserFilters-`;

const getCompareUserFiltersCacheKey = (
  userId1: string,
  userId2: string,
): string => {
  if (userId1 > userId2) return getCompareUserFiltersCacheKey(userId2, userId1);
  return `${CompareUserFiltersPrefix}${userId1}-${userId2}`;
};

const getCompareUserFiltersPatternCacheKey = (userId: string): string => {
  return `${CompareUserFiltersPrefix}*${userId}*`;
};

async function readCompareUserFiltersCache(
  userId1: string,
  userId2: string,
): Promise<boolean | null> {
  const compareUserFiltersString = await redisClient.get(
    getCompareUserFiltersCacheKey(userId1, userId2),
  );
  if (compareUserFiltersString) {
    return JSON.parse(compareUserFiltersString);
  } else {
    return null;
  }
}

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
    MERGE (p)-[r:USER_ATTRIBUTES_CONSTANT]->(md:MetaData)
    SET md = $constant
    RETURN p, md
    `,
    { userId, constant: preferences.a_constant || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_ATTRIBUTES_CUSTOM]->(md:MetaData)
    SET md = $custom
    RETURN p, md
    `,
    { userId, custom: preferences.a_custom || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_FILTERS_CONSTANT]->(md:MetaData)
    SET md = $constant
    RETURN p, md
    `,
    { userId, constant: preferences.f_constant || {} },
  );

  await session.run(
    `
    MERGE (p:Person{userId: $userId})
    MERGE (p)-[r:USER_FILTERS_CUSTOM]->(md:MetaData)
    SET md = $custom
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

  const userFilterKeys = await common.redisScanKeys(
    redisClient,
    getCompareUserFiltersPatternCacheKey(userId),
  );

  if (userFilterKeys.size > 0) {
    const keysDeleted = await redisClient.del(Array.from(userFilterKeys));

    logger.debug(
      `CompareUserFilters for ${userId} size:${userFilterKeys.size} keysDeleted:${keysDeleted}`,
    );
  }

  await session.close();
}

export const compareUserFilters = async (
  userId1: string,
  userId2: string,
): Promise<boolean> => {
  const cacheResult = await readCompareUserFiltersCache(userId1, userId2);

  if (cacheResult != null) {
    return cacheResult;
  }

  const user1Data = await readUserPreferences(userId1);
  const user2Data = await readUserPreferences(userId2);

  const filterConstants = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    let inner_valid = true;
    Object.entries(userDataA.f_constant).forEach((entry) => {
      const key = entry[0].toString();
      const value = entry[1] != null ? entry[1].toString() : null;
      if (userDataB.a_constant[key] != value) {
        inner_valid = false;
      }
    });
    return inner_valid;
  };

  let valid = true;

  valid = valid && filterConstants(user1Data, user2Data);
  valid = valid && filterConstants(user2Data, user1Data);

  const filterDistance = (
    userDataA: UserPreferences,
    userDataB: UserPreferences,
  ) => {
    const aDistance = userDataA.f_custom.distance;
    const aLong = userDataA.a_custom.long;
    const aLat = userDataA.a_custom.lat;

    const bLong = userDataB.a_custom.long;
    const bLat = userDataB.a_custom.lat;

    if (aDistance && aLong && aLat) {
      if (!bLong || !bLat) return false;
      const aCord = { lat: aLat, lng: aLong };
      const bCord = { lat: bLat, lng: bLong };
      const dist = haversine(aCord, bCord);

      if (dist > aDistance) return false;
    }
    return true;
  };

  valid = valid && filterDistance(user1Data, user2Data);
  valid = valid && filterDistance(user2Data, user1Data);

  await redisClient.set(
    getCompareUserFiltersCacheKey(userId1, userId2),
    JSON.stringify(valid),
    `EX`,
    compareUserFiltersCacheEx,
  );

  return valid;
};
