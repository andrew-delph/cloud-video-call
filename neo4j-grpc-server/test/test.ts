import { assert } from 'chai';
import { cosineSimilarity } from '../src/utils';
import { memoize } from 'lodash';

describe(`basic`, function () {
  it(`test equal`, function () {
    assert.equal(5, 5);
  });

  it(`test notEqual`, function () {
    assert.notEqual(4, 5);
  });
});

describe(`cosine`, function () {
  it(`test 1`, function () {
    const score = cosineSimilarity([1], [2]);
    assert.equal(1, score);
  });

  it(`test 2`, function () {
    const score = cosineSimilarity([1, 1], [2, 2]);
    assert.notEqual(1, score);
  });

  it(`test 3 same vals as 2`, function () {
    const score = cosineSimilarity([1, 1], [2, 2]);
    assert.notEqual(1, score);
  });

  it(`test cosineSimilarity.cache is 2`, function () {
    const cache: any = cosineSimilarity.cache;
    assert.equal(2, cache.size);
  });

  it(`test cache speed`, function () {
    const len = 5;
    const val1 = Array.from({ length: len }, () => Math.random());
    const val2 = Array.from({ length: len }, () => Math.random());
    const start1 = performance.now();
    const score1 = cosineSimilarity(val1, val2);
    const end1 = performance.now();
    const start2 = performance.now();
    const score2 = cosineSimilarity(val1, val2);
    const end2 = performance.now();

    const time1 = end1 - start1;
    const time2 = end2 - start2;

    assert.equal(score1, score2);
    assert.isAbove(time1, time2);

    console.log(`1: ${time1} 2: ${time2} ratio: ${time1 / time2}`);
  });
});

describe(`memorize`, function () {
  it(`test simple`, function () {
    let calls = 0;
    var sum: any = memoize(function (n: number) {
      calls += 1;
      return n < 1 ? n : n + sum(n - 1);
    });

    assert.equal(21, sum(6));
    assert.equal(7, calls);
    assert.equal(21, sum(6));
    assert.equal(7, calls);
    assert.equal(28, sum(7));
    assert.equal(8, calls);
  });
});
