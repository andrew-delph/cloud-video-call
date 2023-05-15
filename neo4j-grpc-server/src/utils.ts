import * as math from 'mathjs';

import { memoize } from 'lodash';
import { LRUCache } from 'typescript-lru-cache';

import * as common from 'common';
const logger = common.getLogger();
// Create a cache. Optional options object can be passed in.
const cache = new LRUCache<string, string>({ maxSize: 5000 });

function getMapSizeInMB(map: any) {
  const jsonStr = JSON.stringify([...map]);
  const sizeInBytes = Buffer.byteLength(jsonStr, `utf8`);
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB.toFixed(2); // Limiting to 2 decimal places
}

export const cosineSimilarity = memoize(
  cosineSimilarityFunc,
  (vectorA: number[], vectorB: number[]) => {
    var memCache: any = cosineSimilarity.cache;

    logger.info(
      `cosineSimilarity size=${memCache.size} mb=${getMapSizeInMB(memCache)}`,
    );
    return JSON.stringify(vectorA.toString() + `,` + vectorB.toString());
  },
);
cosineSimilarity.cache = cache;

function cosineSimilarityFunc(vectorA: number[], vectorB: number[]): number {
  const dotProduct = math.dot(vectorA, vectorB);
  const magnitudeA = math.norm(vectorA);
  const magnitudeB = math.norm(vectorB);

  const mathjsScore = Number(
    math.divide(dotProduct, math.multiply(magnitudeA, magnitudeB)),
  );

  return mathjsScore;
}
