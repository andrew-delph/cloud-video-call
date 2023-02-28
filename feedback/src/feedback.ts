import express from 'express';
import * as common from 'react-video-call-common';

common.listenGlobalExceptions();

const logger = common.getLogger();

const app = express();
const port = 3000;

app.get(`/health`, (req, res) => {
  logger.debug(`got health check`);
  res.send(`Health is good.`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
