import * as common from 'common';

export const user_viewed = new common.prom.Counter({
  name: `user_viewed`,
  help: `Every time the bot is viewed by a user`,
});
