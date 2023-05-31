import * as common from 'common';
import { memoize, throttle } from 'lodash';
import * as math from 'mathjs';
import { LRUCache } from 'typescript-lru-cache';

const logger = common.getLogger();

// Create a cache. Optional options object can be passed in.
const cache = new LRUCache<string, string>({ maxSize: 750000 });

function getMapSizeInMB(map: any) {
  const jsonStr = JSON.stringify([...map]);
  const sizeInBytes = Buffer.byteLength(jsonStr, `utf8`);
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB.toFixed(2); // Limiting to 2 decimal places
}

const logCacheSizeThrottle = throttle(async () => {
  logger.warn(
    `cosineSimilarity size=${cache.size} mb=${getMapSizeInMB(cache)}`,
  );
}, 20000);

export const cosineSimilarity = memoize(
  cosineSimilarityFunc,
  (vectorA: number[], vectorB: number[]) => {
    logCacheSizeThrottle();

    // cache in sorted order because result is the same
    if (vectorA < vectorB) {
      return JSON.stringify(vectorA.toString() + `,` + vectorB.toString());
    } else {
      return JSON.stringify(vectorB.toString() + `,` + vectorA.toString());
    }
  },
);
cosineSimilarity.cache = cache;

export function cosineSimilarityFunc(
  vectorA: number[],
  vectorB: number[],
): number {
  const dotProduct = math.dot(vectorA, vectorB);
  const magnitudeA = math.norm(vectorA);
  const magnitudeB = math.norm(vectorB);

  const mathjsScore = Number(
    math.divide(dotProduct, math.multiply(magnitudeA, magnitudeB)),
  );

  return mathjsScore;
}
