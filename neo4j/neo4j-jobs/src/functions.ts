// create graph with person node and feedback rel. if exists delete and create new one
// create similarity relationships with score and job id
// delete all similarity rels not using the jobs id

import * as common from 'common';
import Client from 'ioredis';
import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';

common.listenGlobalExceptions();

const logger = common.getLogger();

const jobId = uuid();

const start_time = performance.now();

logger.info(`similarity-score-job jobId: ${jobId}`);

export const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

const mainRedisClient = new Client({
  host: `${process.env.REDIS_HOST || `redis`}`,
});
