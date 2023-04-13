import http from 'k6/http';

import { check, sleep } from 'k6';
import { options_url } from '../src/k6_exp';

export const nuke = () => {
  console.log(`starting nuke`);
  const r = http.post(`${options_url}/nukedata`);
  console.log(`completed nuke`);
  check(r, { 'DATA NUKED': r && r.status == 200 });
};
