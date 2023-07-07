import * as common from 'common';

export const user_created = new common.prom.Counter({
  name: `user_created`,
  help: `A new user created in Neo4j`,
  labelNames: [`test_user`],
});
