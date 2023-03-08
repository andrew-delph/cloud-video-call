// create graph with person node and feedback rel. if exists delete and create new one
// create priority relationships with score and job id
// delete all priority rels not using the jobs id

import * as common from 'react-video-call-common';
import Client from 'ioredis';
import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';
import { newFeedbackThreshold } from '.';

common.listenGlobalExceptions();

const logger = common.getLogger();

const jobId = uuid();

const start_time = performance.now();

logger.info(`priority-score-job jobId: ${jobId}`);

const mainRedisClient = new Client({
  host: `${process.env.REDIS_HOST || `redis`}`,
});

const lastFeedbackCountKey = `last-priority-feedbackCount`;

export const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

(async () => {
  const session = driver.session();

  let result;

  result = await session.run(
    `MATCH ()-[r:FEEDBACK]->()
    RETURN COUNT(r) AS feedbackCount;`,
  );

  const feedbackCount = parseInt(result.records[0].get(`feedbackCount`));

  const lastFeedbackCount = parseInt(
    (await mainRedisClient.get(lastFeedbackCountKey)) || `0`,
  );

  if (Math.abs(feedbackCount - lastFeedbackCount) < newFeedbackThreshold) {
    logger.info(
      `skipping simularity jobs. diff is ${feedbackCount - lastFeedbackCount}`,
    );
    return;
  } else {
    logger.info(`diff is ${feedbackCount - lastFeedbackCount}`);
  }

  try {
    await session.run(`CALL gds.graph.drop('priorityGraph');`);
    logger.debug(`priorityGraph delete successfully`);
  } catch (e) {
    logger.debug(`priorityGraph doesn't exist`);
  }

  await session.run(
    `CALL gds.graph.project( 'priorityGraph', 'Person', 'FEEDBACK' ,{ relationshipProperties: ['score'] });`,
  );

  logger.debug(`priorityGraph created`);

  result = await session.run(
    `
    CALL gds.pageRank.write('priorityGraph', { relationshipWeightProperty: 'score',  scaler: "MinMax", writeProperty: 'priority' })
        YIELD nodePropertiesWritten, ranIterations
  `,
  );

  logger.debug(
    `nodePropertiesWritten: ${JSON.stringify(
      result.records[0].get(`nodePropertiesWritten`),
    )}`,
  );

  await mainRedisClient.set(lastFeedbackCountKey, feedbackCount);

  session.close();
})()
  .catch((error) => {
    logger.error(`error: ${error}`);
  })
  .finally(() => {
    logger.info(`priority job took: ${performance.now() - start_time}`);
    process.exit(0);
  });
