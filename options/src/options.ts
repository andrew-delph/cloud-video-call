import express from 'express';
import * as common from 'react-video-call-common';
import * as neo4j from 'neo4j-driver';
import { getUid } from 'react-video-call-common';

common.listenGlobalExceptions();

const logger = common.getLogger();

const durationWarn = 2;

const app = express();
const port = 80;

app.use(express.json());

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

app.post(`/providefeedback`, async (req, res) => {
  const { feedback_id, score } = req.body;

  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    res.status(401).json({ error: `Missing Authorization` });
    return;
  } else if (!feedback_id || score == null) {
    logger.debug(
      `!feedback_id || !score) feedback_id: ${feedback_id} score: ${score}`,
    );
    res.status(400).json({ error: `feedback_id and score are required` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(401).send(`failed authentication`);
    return;
  });

  const start_time = performance.now();
  let session = driver.session();

  // get the match with id

  const match_rel = await session.run(
    `
      MATCH (n1)-[r]->(n2)
      WHERE id(r) = $feedback_id
      RETURN r, n1.userId, n2.userId
    `,
    { feedback_id: parseInt(feedback_id) },
  );

  await session.close();
  // if doesnt exist return error
  if (match_rel.records.length == 0) {
    logger.debug(`No records found for feedback_id: ${feedback_id}`);
    res.status(404).send(`No records found for feedback_id: ${feedback_id}`);
    return;
  }

  const n1_userId = match_rel.records[0].get(`n1.userId`);
  const n2_userId = match_rel.records[0].get(`n2.userId`);

  // verify request owns the rel
  if (n1_userId != uid) {
    logger.debug(`Forbidden ${n1_userId} ${uid}`);
    res.status(403).send({ message: `Forbidden`, auth, uid, n1_userId });
    return;
  }

  // create new feedback relationship with score and id
  // merge so it can only be done once per match rel
  session = driver.session();
  const feedback_rel = await session.run(
    // TODO only allow one feedback for match.
    `
      MATCH (n1:Person {userId: $n1_userId}), (n2:Person {userId: $n2_userId })
      CREATE (n1)-[r:FEEDBACK {score: $score}]->(n2) return r
    `,
    { score, n1_userId, n2_userId },
  );

  await session.close();

  if (feedback_rel.records.length != 1) {
    res.status(500).send(`Failed to create feedback`);
    return;
  }
  const duration = (performance.now() - start_time) / 1000;
  if (duration > durationWarn) {
    logger.warn(`providefeedback duration: \t ${duration}s`);
  } else {
    logger.debug(`providefeedback duration: \t ${duration}s`);
  }
  res.status(201).send(`Feedback created.`);
});

app.put(`/updateattributes`, async (req, res) => {
  const { attributes } = req.body;

  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    res.status(401).json({ error: `Missing Authorization` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(401).send(`failed authentication`);
    return;
  });

  if (!attributes) {
    logger.debug(`Missing attributes`);
    res.status(400).json({ error: `Missing attributes` });
    return;
  }

  const session = driver.session();

  const results = await session.run(
    `
    MERGE (p:Person{userId: $uid})-[r:USER_DEFINED_ATTRIBUTES]->(md:MetaData{type:"USER_DEFINED_ATTRIBUTES"})
    SET md = $attributes
    SET md.type = "USER_DEFINED_ATTRIBUTES"
    RETURN p, md
    `,
    { uid, attributes },
  );

  const md = results.records[0].get(`md`);

  await session.close();

  res.status(200).send(md.properties);
});

app.put(`/updatefilters`, async (req, res) => {
  const { filters } = req.body;

  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    res.status(401).json({ error: `Missing Authorization` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(401).send(`failed authentication`);
    return;
  });

  if (!filters) {
    logger.debug(`Missing filters`);
    res.status(400).json({ error: `Missing filters` });
    return;
  }

  const session = driver.session();
  const results = await session.run(
    `
    MERGE (p:Person{userId: $uid})-[r:USER_FILTERS]->(md:MetaData{type:"USER_FILTERS"})
    SET md = $filters
    SET md.type = "USER_FILTERS"
    RETURN p, md
    `,
    { uid, filters },
  );

  const md = results.records[0].get(`md`);

  await session.close();

  res.status(200).send(md.properties);
});

app.post(`/nukedata`, async (req, res) => {
  // TODO REMOVE THIS LOL WHAT THE HECK?

  const session = driver.session();
  await session.run(`
    MATCH (n)
    CALL {
      WITH n
      DETACH DELETE n
    } IN TRANSACTIONS
    `);

  await session.close();

  res.status(200).send(`ITS DONE.`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
