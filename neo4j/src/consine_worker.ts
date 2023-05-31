import { userdIdToType } from './person';
import { memoize } from 'lodash';
import * as math from 'mathjs';
import * as neo4j from 'neo4j-driver';
import { LRUCache } from 'typescript-lru-cache';

const P = require(`bluebird`);

const cache = new LRUCache<string, string>({ maxSize: 10000 });

export const cosineSimilarityMem = memoize(
  cosineSimilarityFunc,
  (vectorA: number[], vectorB: number[]) => {
    // cache in sorted order because result is the same
    if (vectorA < vectorB) {
      return JSON.stringify(vectorA.toString() + `,` + vectorB.toString());
    } else {
      return JSON.stringify(vectorB.toString() + `,` + vectorA.toString());
    }
  },
);

cosineSimilarityMem.cache = cache;

function cosineSimilarityFunc(vectorA: number[], vectorB: number[]): number {
  const dotProduct = math.dot(vectorA, vectorB);
  const magnitudeA = math.norm(vectorA);
  const magnitudeB = math.norm(vectorB);

  const mathjsScore = Number(
    math.divide(dotProduct, math.multiply(magnitudeA, magnitudeB)),
  );

  return mathjsScore;
}

export const poolCalcScore = (
  ntype: any,
  mtype: any,
  nembedding: number[],
  membedding: number[],
) => {
  const simScore = cosineSimilarityFunc(nembedding, membedding);
  // const simScore = cosineSimilarityMem(nembedding, membedding);

  return { ntype, mtype, simScore };
};

// module.exports = function squareAsync(args: any) {
//   return P.resolve().then(() => {
//     return poolCalcScore(
//       args.ntype,
//       args.mtype,
//       args.nembedding,
//       args.membedding,
//     );
//   });
// };
