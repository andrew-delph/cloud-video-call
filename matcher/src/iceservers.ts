import axios from 'axios';
import * as common from 'common';

const logger = common.getLogger();
export const iceServers: any[] = [
  //   {
  //     urls: [`stun:stun1.l.google.com:19302`, `stun:stun2.l.google.com:19302`],
  //   },
];
export async function loadIceServers() {
  const METERED_API_KEY = process.env.METERED_API_KEY;
  const response = await axios.get(
    `https://andrewdelph.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`,
  );

  iceServers.push(...((await response.data) as []));

  logger.info(`iceServers loaded.`);
}
