import http from 'k6/http';

import { check, sleep } from 'k6';

export const nuke = () => {
  const secure = false;
  const domain = __ENV.HOST || `localhost:8888`;

  const r = http.post(
    `${secure ? `https` : `http`}://${domain}/options/nukedata`,
  );
  check(r, { 'DATA NUKED': r && r.status == 200 });
};
