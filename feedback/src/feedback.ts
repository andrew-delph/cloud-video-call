import express from 'express';
import * as common from 'react-video-call-common';
import * as neo4j from 'neo4j-driver';

common.listenGlobalExceptions();

const logger = common.getLogger();

const durationWarn = 2;

const app = express();
const port = 8080;

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

app.post(`/providefeedback`, async (req, res) => {
  const start_time = performance.now();

  const session = driver.session();
  await session.run(
    `CREATE INDEX  Person_userId IF NOT EXISTS  FOR (n:Person) ON (n.userId);`,
  );

  await session.close();
  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`verifyIndexes duration: \t ${duration}s`);
  } else {
    logger.debug(`verifyIndexes duration: \t ${duration}s`);
  }

  res.send(`provideFeedback is good. duration: ${duration}`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
