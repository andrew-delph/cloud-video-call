import * as common from 'common';
import * as neo4j_common from 'common-messaging';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
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

const router = express.Router();

// autorize all apis
app.use(async (req: any, res, next) => {
  if (req.path.includes(`health`)) {
    return next();
  }
  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization`);
    next(new Error(`Missing Authorization`));
    return;
  }

  let userId: string = await common.getUserId(auth).catch((error) => {
    logger.debug(`getuserId error: ${error}`);
    next(new Error(`Failed Authorization`));
    return;
  });
  req.userId = userId;
  next();
});

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

  const userId: string = req.userId;

  try {
    await common.ratelimit(mainRedisClient, `post_providefeedback`, userId, 20);
  } catch (err) {
    res.status(401).json({
      error: JSON.stringify(err),
      message: `Rate Limit`,
    });
    return;
  }

  const createFeedbackRequest = new neo4j_common.CreateFeedbackRequest();
  createFeedbackRequest.setUserId(userId);
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

  const userId: string = req.userId;

  try {
    await common.ratelimit(mainRedisClient, `put_preferences`, userId, 5);
  } catch (err) {
    res.status(401).json({
      error: JSON.stringify(err),
      message: `Rate Limit`,
    });
    return;
  }

  const putUserFiltersRequest = new neo4j_common.PutUserPerferencesRequest();
  putUserFiltersRequest.setUserId(userId);

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
  const userId: string = req.userId;

  try {
    await common.ratelimit(mainRedisClient, `get_preferences`, userId, 5);
  } catch (err) {
    res.status(401).json({
      error: JSON.stringify(err),
      message: `Rate Limit`,
    });
    return;
  }

  const checkUserFiltersRequest = new neo4j_common.GetUserPerferencesRequest();
  checkUserFiltersRequest.setUserId(userId);

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
  const userId: string = req.userId;

  try {
    await common.ratelimit(mainRedisClient, `get_history`, userId, 20);
  } catch (err) {
    res.status(401).json({
      error: JSON.stringify(err),
      message: `Rate Limit`,
    });
    return;
  }

  const matchHistoryRequest = new neo4j_common.MatchHistoryRequest();
  matchHistoryRequest.setUserId(userId);

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

  const userId: string = req.userId;

  const session = driver.session();
  await session.run(`
  MATCH (n)
  WHERE n.userId STARTS WITH 'k6_auth_'
    CALL {
      WITH n
      DETACH DELETE n
    } IN TRANSACTIONS OF 10 ROWS
    `);

  await session.close();

  // await mainRedisClient.flushall();

  res.status(200).send(`ITS DONE.`);
});

app.post(`/activity`, async (req, res) => {
  // TODO REMOVE THIS LOL WHAT THE HECK?

  const userId: string = req.userId;

  try {
    await common.uploadProfilePicture(
      `test${Math.random()}`,
      `hehehehe${Math.random()}`,
    );
    res.status(200).send(`ITS DONE.`);
  } catch (err) {
    res
      .status(500)
      .send(
        `${err} creds: "${process.env.AWS_ACCESS_KEY_ID!}" "${process.env
          .AWS_SECRET_ACCESS_KEY!}"`,
      );
  }
});

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
