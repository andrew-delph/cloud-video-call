// create graph with person node and feedback rel. if exists delete and create new one
// create similarity relationships with score and job id
// delete all similarity rels not using the jobs id

import * as common from 'react-video-call-common';
import Client from 'ioredis';
import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';
import { newFeedbackThreshold } from '.';

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

const lastFeedbackCountKey = `last-simularity-feedbackCount`;

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
    await session.run(`CALL gds.graph.drop('similarityGraph');`);
    logger.debug(`similarityGraph delete successfully`);
  } catch (e) {
    logger.debug(`similarityGraph doesn't exist`);
  }

  await session.run(
    `CALL gds.graph.project( 'similarityGraph', 'Person', 'FEEDBACK' ,{ relationshipProperties: ['score'] });`,
  );

  logger.debug(`similarityGraph created`);

  result = await session.run(
    `
    CALL gds.nodeSimilarity.stream('similarityGraph', { relationshipWeightProperty: 'score'})
        YIELD node1, node2, similarity
        WITH gds.util.asNode(node1) AS n1, gds.util.asNode(node2) AS n2, similarity
        CREATE (n1)-[r:SIMILAR_TO {similarity: similarity, jobId: $jobId }]->(n2)
        RETURN n1.userid AS User1, n2.userid AS User2, similarity 
        ORDER BY similarity DESCENDING, User1, User2
  `,
    { jobId },
  );

  logger.debug(
    `relationshipsCreated: ${
      result.summary.counters.updates().relationshipsCreated
    }`,
  );

  result = await session.run(
    `
      MATCH ()-[r:SIMILAR_TO]->()
          WHERE r.jobId <> $jobId
          DELETE r

    `,
    { jobId },
  );

  logger.debug(
    `relationshipsDeleted: ${
      result.summary.counters.updates().relationshipsDeleted
    }`,
  );

  await mainRedisClient.set(lastFeedbackCountKey, feedbackCount);
  session.close();
})()
  .catch((error) => {
    logger.error(`error: ${error}`);
  })
  .finally(() => {
    logger.info(`similarity job took: ${performance.now() - start_time}`);
    process.exit(0);
  });
