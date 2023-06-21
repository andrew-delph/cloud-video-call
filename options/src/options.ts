import * as common from 'common';
import { getUid } from 'common';
import * as neo4j_common from 'common-messaging';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import Client from 'ioredis';
import * as neo4j from 'neo4j-driver';

var cors = require(`cors`);
const omitDeep = require(`omit-deep-lodash`);

common.listenGlobalExceptions();

const logger = common.getLogger();

const firebaseApp = initializeApp();

const neo4jRpcClient = neo4j_common.createNeo4jClient();

const durationWarn = 2;

const app = express();
const port = 80;

const mainRedisClient = common.createRedisClient();

app.use(express.json());
app.use(cors());

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

app.get(`/health`, async (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

app.post(`/providefeedback`, async (req, res) => {
  let { feedback_id, score } = req.body;

  feedback_id = parseInt(feedback_id); // TODO send number from ui

  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    res.status(403).json({ error: `Missing Authorization` });
    return;
  } else if (
    !(typeof feedback_id === `number` && !isNaN(feedback_id)) ||
    !(typeof score === `number` && !isNaN(score))
  ) {
    logger.debug(
      `!feedback_id || !score) feedback_id: ${feedback_id} score: ${score}`,
    );
    res.status(400).json({ error: `feedback_id or score failed validation` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(403).send(`failed authentication`);
    return;
  });

  try {
    await common.ratelimit(mainRedisClient, `post_providefeedback`, uid, 5);
  } catch (err) {
    res.send(`${err}`);
    return;
  }

  const createFeedbackRequest = new neo4j_common.CreateFeedbackRequest();
  createFeedbackRequest.setUserId(uid);
  createFeedbackRequest.setScore(score);
  createFeedbackRequest.setFeedbackId(feedback_id);

  try {
    await neo4jRpcClient.createFeedback(
      createFeedbackRequest,
      (error: any, response: neo4j_common.StandardResponse) => {
        if (error) {
          res.status(401).json({
            error: JSON.stringify(error),
            message: `Failed createFeedbackRequest`,
          });
        } else {
          res.status(201).send(`Feedback created.`);
        }
      },
    );
  } catch (error) {
    res.status(401).json({
      error: JSON.stringify(error),
      message: `failed createFeedbackRequest`,
    });
  }
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
    res.status(403).json({ error: `Missing Authorization` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(403).send(`failed authentication`);
    return;
  });

  try {
    await common.ratelimit(mainRedisClient, `put_preferences`, uid, 5);
  } catch (err) {
    res.send(`${err}`);
    return;
  }

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
          logger.error(`putUserPerferences`, error);
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
    logger.error(`putUserPerferences`, error);
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
    res.status(403).json({ error: `Missing Authorization` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(403).send(`failed authentication`);
    return;
  });

  try {
    await common.ratelimit(mainRedisClient, `get_preferences`, uid, 5);
  } catch (err) {
    res.send(`${err}`);
    return;
  }

  const checkUserFiltersRequest = new neo4j_common.GetUserPerferencesRequest();
  checkUserFiltersRequest.setUserId(uid);

  try {
    await neo4jRpcClient.getUserPerferences(
      checkUserFiltersRequest,
      (error: any, response: neo4j_common.GetUserPerferencesResponse) => {
        if (error) {
          logger.error(`getUserPerferences`, error);
          res.status(401).json({
            error: JSON.stringify(error),
            message: `Failed checkUserFiltersRequest`,
          });
        } else {
          res.status(200).json(
            omitDeep({
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
              priority: response.getPriority(),
            }),
          );
        }
      },
    );
  } catch (error) {
    logger.error(`getUserPerferences`, error);
    res.status(401).json({
      error: JSON.stringify(error),
      message: `failed checkUserFiltersRequest`,
    });
  }

  return;
});

app.get(`/history`, async (req, res) => {
  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    res.status(403).json({ error: `Missing Authorization` });
    return;
  }

  let uid: string = await getUid(auth).catch((error) => {
    logger.debug(`getUid error: ${error}`);
    res.status(403).send(`failed authentication`);
    return;
  });

  try {
    await common.ratelimit(mainRedisClient, `get_history`, uid, 5);
  } catch (err) {
    res.send(`${err}`);
    return;
  }

  const matchHistoryRequest = new neo4j_common.MatchHistoryRequest();
  matchHistoryRequest.setUserId(uid);

  try {
    await neo4jRpcClient.getMatchHistory(
      matchHistoryRequest,
      (error: any, response: neo4j_common.MatchHistoryResponse) => {
        if (error) {
          logger.error(`getMatchHistory`, error);
          res.status(401).json({
            error: JSON.stringify(error),
            message: `Failed getMatchHistory`,
          });
        } else {
          res.status(200).json(response.toObject());
        }
      },
    );
  } catch (error) {
    logger.error(`getMatchHistory`, error);
    res.status(401).json({
      error: JSON.stringify(error),
      message: `failed getMatchHistory`,
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
    } IN TRANSACTIONS OF 10 ROWS
    `);

  await session.close();

  await mainRedisClient.flushall();

  res.status(200).send(`ITS DONE.`);
});

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
