import * as math from 'mathjs';

import { memoize } from 'lodash';

export const cosineSimilarity = memoize(
  cosineSimilarityFunc,
  (vectorA: number[], vectorB: number[]) => {
    return JSON.stringify(vectorA.toString() + `,` + vectorB.toString());
  },
);

function cosineSimilarityFunc(vectorA: number[], vectorB: number[]): number {
  const dotProduct = math.dot(vectorA, vectorB);
  const magnitudeA = math.norm(vectorA);
  const magnitudeB = math.norm(vectorB);

  const mathjsScore = Number(
    math.divide(dotProduct, math.multiply(magnitudeA, magnitudeB)),
  );

  return mathjsScore;
}
