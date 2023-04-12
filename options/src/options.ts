import express from 'express';
import * as common from 'common';
import { getUid } from 'common';
import * as neo4j from 'neo4j-driver';
import Client from 'ioredis';
import { initializeApp } from 'firebase-admin/app';

import * as neo4j_common from 'neo4j-grpc-common';

var cors = require(`cors`);
const omitDeep = require(`omit-deep-lodash`);

common.listenGlobalExceptions();

const logger = common.getLogger();

const firebaseApp = initializeApp();

const neo4jRpcClient = neo4j_common.createNeo4jClient();

const durationWarn = 2;

const app = express();
const port = 80;

const mainRedisClient = new Client({
  host: `${process.env.REDIS_HOST || `redis`}`,
});

app.use(express.json());
app.use(cors());

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
  } else if (!feedback_id || !(typeof score === `number` && !isNaN(score))) {
    logger.debug(
      `!feedback_id || !score) feedback_id: ${feedback_id} score: ${score}`,
    );
    res.status(400).json({ error: `feedback_id or score failed validation` });
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
    logger.debug(`Failed to create feedback ${feedback_rel.records.length} `);
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

app.put(`/preferences`, async (req, res) => {
  const { attributes = {}, filters = {} } = req.body;

  const a_custom: { [key: string]: string } = attributes.custom || {};
  const a_constant: { [key: string]: string } = attributes.constant || {};
  const f_custom: { [key: string]: string } = filters.custom || {};
  const f_constant: { [key: string]: string } = filters.constant || {};

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

  const putUserFiltersRequest = new neo4j_common.PutUserPerferencesRequest();
  putUserFiltersRequest.setUserId(uid);

  Object.entries(a_constant).forEach(([key, value]) => {
    putUserFiltersRequest
      .getAttributesConstantMap()
      .set(String(key), String(value));
  });
  Object.entries(a_custom).forEach(([key, value]) => {
    putUserFiltersRequest
      .getAttributesCustomMap()
      .set(String(key), String(value));
  });
  Object.entries(f_constant).forEach(([key, value]) => {
    putUserFiltersRequest
      .getFiltersConstantMap()
      .set(String(key), String(value));
  });
  Object.entries(f_custom).forEach(([key, value]) => {
    putUserFiltersRequest.getFiltersCustomMap().set(String(key), String(value));
  });

  try {
    await neo4jRpcClient.putUserPerferences(
      putUserFiltersRequest,
      (error: any, response: neo4j_common.PutUserPerferencesResponse) => {
        if (error) {
          res.status(401).json({
            error: JSON.stringify(error),
            message: `Failed checkUserFiltersRequest`,
          });
        } else {
          res.status(201).send(`preferences updated`);
        }
      },
    );
  } catch (error) {
    res.status(401).json({
      error: JSON.stringify(error),
      message: `failed checkUserFiltersRequest`,
    });
  }
});

app.get(`/preferences`, async (req, res) => {
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

  const checkUserFiltersRequest = new neo4j_common.GetUserPerferencesRequest();
  checkUserFiltersRequest.setUserId(uid);

  try {
    await neo4jRpcClient.getUserPerferences(
      checkUserFiltersRequest,
      (error: any, response: neo4j_common.GetUserPerferencesResponse) => {
        if (error) {
          res.status(401).json({
            error: JSON.stringify(error),
            message: `Failed checkUserFiltersRequest`,
          });
        } else {
          res.status(200).json(
            omitDeep(
              {
                attributes: {
                  custom: Object.fromEntries(
                    response.getAttributesCustomMap().entries(),
                  ),
                  constant: Object.fromEntries(
                    response.getAttributesConstantMap().entries(),
                  ),
                },
                filters: {
                  custom: Object.fromEntries(
                    response.getFiltersCustomMap().entries(),
                  ),
                  constant: Object.fromEntries(
                    response.getFiltersConstantMap().entries(),
                  ),
                },
              },
              `type`,
            ),
          );
        }
      },
    );
  } catch (error) {
    res.status(401).json({
      error: JSON.stringify(error),
      message: `failed checkUserFiltersRequest`,
    });
  }

  return;
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

  await mainRedisClient.flushall();

  res.status(200).send(`ITS DONE.`);
});

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
