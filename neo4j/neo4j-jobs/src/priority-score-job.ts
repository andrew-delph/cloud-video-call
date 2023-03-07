// create graph with person node and feedback rel. if exists delete and create new one
// create priority relationships with score and job id
// delete all priority rels not using the jobs id

import * as common from 'react-video-call-common';

import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';

common.listenGlobalExceptions();

const logger = common.getLogger();

const jobId = uuid();

const start_time = performance.now();

logger.info(`priority-score-job jobId: ${jobId}`);

export const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

(async () => {
  const session = driver.session();

  let result;

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
    CALL gds.pageRank.write('priorityGraph', { relationshipWeightProperty: 'score',  scaler: "L1Norm", writeProperty: 'pagerank' })
        YIELD nodePropertiesWritten, ranIterations
  `,
  );

  logger.info(
    `propertiesSet: ${result.summary.counters.updates().propertiesSet}`,
  );

  session.close();
})()
  .catch((error) => {
    logger.error(`error: ${error}`);
  })
  .finally(() => {
    logger.info(`priority job took: ${performance.now() - start_time}`);
    process.exit(0);
  });
