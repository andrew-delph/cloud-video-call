import axios from 'axios';
import * as common from 'common';
import * as neo4j_common from 'common-messaging';
import {
  CreateFeedbackRequest,
  GetUserPerferencesRequest,
  GetUserPerferencesResponse,
  MatchHistoryRequest,
  MatchHistoryResponse,
  PutUserPerferencesRequest,
  PutUserPerferencesResponse,
  StandardResponse,
  makeGrpcRequest,
} from 'common-messaging';
import express, { response } from 'express';
import { initializeApp } from 'firebase-admin/app';
import moment from 'moment';
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
  if (req.path.includes(`health`) || req.path.includes(`acme-challenge`)) {
    return next();
  }
  const auth = req.headers.authorization;

  if (!auth) {
    logger.debug(`Missing Authorization path ${req.path}`);
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

const rateLimit = (key: string, RPM: number) => {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await common.ratelimit(mainRedisClient, key, req.userId, RPM);
    } catch (err) {
      logger.warn(`${err}`);
      return res
        .status(401)
        .json({ error: `Rate Limit Overflow`, message: `${err}` });
    }

    next();
  };
};

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

app.get(`/health`, async (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

app.put(
  `/providefeedback`,
  rateLimit(`post_providefeedback`, 20),
  async (req, res) => {
    let { match_id, score } = req.body;

    match_id = parseInt(match_id); // TODO send number from ui

    const userId: string = req.userId;

    const createFeedbackRequest = new neo4j_common.CreateFeedbackRequest();
    createFeedbackRequest.setUserId(userId);
    createFeedbackRequest.setScore(score);
    createFeedbackRequest.setMatchId(match_id);

    await makeGrpcRequest<CreateFeedbackRequest, neo4j_common.Match>(
      neo4jRpcClient,
      neo4jRpcClient.createFeedback,
      createFeedbackRequest,
    )
      .then((response) => {
        return res.status(200).json(response.toObject());
      })
      .catch((err) => {
        logger.error(`createFeedbackRequest`, err);
        res.status(401).json({
          error: JSON.stringify(err),
          message: `failed createFeedbackRequest`,
        });
      });
  },
);

app.put(`/preferences`, rateLimit(`put_preferences`, 20), async (req, res) => {
  const { attributes = {}, filters = {} } = req.body;

  const a_custom: { [key: string]: string } = attributes.custom || {};
  const a_constant: { [key: string]: string } = attributes.constant || {};
  const f_custom: { [key: string]: string } = filters.custom || {};
  const f_constant: { [key: string]: string } = filters.constant || {};

  const userId: string = req.userId;

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

  await makeGrpcRequest<PutUserPerferencesRequest, PutUserPerferencesResponse>(
    neo4jRpcClient,
    neo4jRpcClient.putUserPerferences,
    putUserFiltersRequest,
  )
    .then((response) => {
      return res.status(201).send(`preferences updated`);
    })
    .catch((err) => {
      logger.error(`putUserPerferences`, err);
      res.status(401).json({
        error: JSON.stringify(err),
        message: `Failed putUserPerferences`,
      });
    });
});

app.get(`/preferences`, rateLimit(`get_preferences`, 20), async (req, res) => {
  const userId: string = req.userId;

  const checkUserFiltersRequest = new GetUserPerferencesRequest();
  checkUserFiltersRequest.setUserId(userId);

  await makeGrpcRequest<GetUserPerferencesRequest, GetUserPerferencesResponse>(
    neo4jRpcClient,
    neo4jRpcClient.getUserPerferences,
    checkUserFiltersRequest,
  )
    .then((response) => {
      return res.status(200).json(
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
    })
    .catch((err) => {
      logger.error(`getUserPerferences`, err);
      res.status(401).json({
        error: JSON.stringify(err),
        message: `Failed checkUserFiltersRequest`,
      });
    });

  return;
});

app.get(`/history`, rateLimit(`get_history`, 100), async (req, res) => {
  const userId: string = req.userId;

  const { limit, skip } = req.query as { limit: string; skip: string };

  // Convert the query parameters to integers
  const limitInt = common.tryParseInt(limit, 5);
  const skipInt = common.tryParseInt(skip, 0);
  logger.debug(`/history query=${JSON.stringify(req.query)}`);

  const matchHistoryRequest = new neo4j_common.MatchHistoryRequest();
  matchHistoryRequest.setUserId(userId);
  matchHistoryRequest.setLimit(limitInt);
  matchHistoryRequest.setSkip(skipInt);

  await makeGrpcRequest<MatchHistoryRequest, MatchHistoryResponse>(
    neo4jRpcClient,
    neo4jRpcClient.getMatchHistory,
    matchHistoryRequest,
  )
    .then((response) => {
      return res.status(200).json(response.toObject());
    })
    .catch((err) => {
      logger.error(`getMatchHistory`, err);
      res.status(401).json({
        error: JSON.stringify(err),
        message: `Failed getMatchHistory`,
      });
    });
});

app.get(`/chat/:otherId`, rateLimit(`get_chat_id`, 20), async (req, res) => {
  const source: string = req.userId;
  const target = req.params.otherId;

  const chatMessages: common.ChatMessage[] = await common.retrieveChat(
    mainRedisClient,
    source,
    target,
    0,
    5,
  );
  await common.setChatRead(mainRedisClient, source, target, true);
  res.status(200).json({ userId: source, otherId: target, chatMessages });
  return;
});

app.get(`/chat`, rateLimit(`get_chat`, 20), async (req, res) => {
  const userId: string = req.userId;

  const chatRooms = await common.getRecentChats(mainRedisClient, userId);
  const rooms = chatRooms.map((chatRoom) =>
    common.chatActivityRoom(chatRoom.target),
  );

  return await axios
    .post(`http://socketio-service.default.svc.cluster.local/joinRoom`, {
      source: userId,
      rooms: rooms,
    })
    .then(() => {
      res.json({ chatRooms });
    })
    .catch((err) => {
      res.status(500).json({ error: `${err}` });
    });
});

app.post(`/nukedata`, async (req, res) => {
  // ONLY DELETES TEST DATA

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

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
