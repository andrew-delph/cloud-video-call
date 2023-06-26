import http from 'k6/http';

import { check, sleep } from 'k6';
import { options_url } from '../k6';

export const nuke = () => {
  console.log(`starting nuke`);
  const r = http.post(`${options_url}/nukedata`,{},{
    headers: {
      authorization: `k6_admin`,
    },
  },);
  console.log(`completed nuke`);
  check(r, { 'DATA NUKED': r && r.status == 200 });
};

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
