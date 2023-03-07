// create graph with person node and feedback rel. if exists delete and create new one
// create similarity relationships with score and job id
// delete all similarity rels not using the jobs id

import * as common from 'react-video-call-common';

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

(async () => {
  const session = driver.session();

  let result;

  try {
    await session.run(`CALL gds.graph.drop('similarityGraph');`);
    logger.debug(`graph delete successfully`);
  } catch (e) {
    logger.debug(`graph doesn't exist`);
  }

  await session.run(
    `CALL gds.graph.project( 'similarityGraph', 'Person', 'FEEDBACK' ,{ relationshipProperties: ['score'] });`,
  );

  logger.debug(`graph created`);

  result = await session.run(
    `
    CALL gds.nodeSimilarity.stream('similarityGraph', { relationshipWeightProperty: 'score', similarityCutoff: 0.3 })
        YIELD node1, node2, similarity
        WITH gds.util.asNode(node1) AS n1, gds.util.asNode(node2) AS n2, similarity
        CREATE (n1)-[r:SIMILAR_TO {similarity: similarity, jobId: $jobId }]->(n2)
        RETURN n1.userid AS User1, n2.userid AS User2, similarity 
        ORDER BY similarity DESCENDING, User1, User2
  `,
    { jobId },
  );

  logger.info(
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

  logger.info(
    `relationshipsDeleted: ${
      result.summary.counters.updates().relationshipsDeleted
    }`,
  );
  session.close();
})()
  .catch((error) => {
    logger.error(`error: ${error}`);
  })
  .finally(() => {
    logger.info(`similarity job took: ${performance.now() - start_time}`);
    process.exit(0);
  });
