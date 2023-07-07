import {
  lastMatchedCooldownMinutes,
  relationShipScoresSortFunc,
} from '../src/matchmaker';
import { RelationshipScoreWrapper } from '../src/types';
import { shuffleArray } from 'common';
import moment from 'moment';

test(`adds 1 + 2 to equal 3`, () => {
  expect(1 + 2).toBe(3);
});

test(`RelationshipScoreWrapper default values`, () => {
  const relationshipScore: RelationshipScoreWrapper =
    new RelationshipScoreWrapper({ otherId: `test` });
  expect(relationshipScore.score).toBe(-1);
  expect(relationshipScore.prob).toBe(-1);
});

test(`sort scores`, () => {
  let mockRandom = () => {
    return 1;
  };
  const delta = 5;
  let relationShipScores: [string, RelationshipScoreWrapper][] = [];
  const genScores = (): [string, RelationshipScoreWrapper][] => {
    return [
      [`noscore`, new RelationshipScoreWrapper({ otherId: `test` })],
      [
        `noscore_after`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes - delta,
            `minutes`,
          ),
        }),
      ],
      [
        `noscore_before`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes + delta,
            `minutes`,
          ),
        }),
      ],

      [
        `score1`,
        new RelationshipScoreWrapper({ otherId: `test`, score: mockRandom() }),
      ],
      [
        `score1_before`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          score: mockRandom(),
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes + delta,
            `minutes`,
          ),
        }),
      ],
      [
        `score1_after`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          score: mockRandom(),
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes - delta,
            `minutes`,
          ),
        }),
      ],

      [`score-1`, new RelationshipScoreWrapper({ otherId: `test`, score: -1 })],
      [
        `score-1_before`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          score: -mockRandom(),

          latest_match: moment().subtract(
            lastMatchedCooldownMinutes + delta,
            `minutes`,
          ),
        }),
      ],
      [
        `score-1_after`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          score: -mockRandom(),
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes - delta,
            `minutes`,
          ),
        }),
      ],
      [
        `nscore`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          nscore: 3 * mockRandom(),
        }),
      ],
      [
        `nscore-after`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          nscore: 3 * mockRandom(),
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes - delta,
            `minutes`,
          ),
        }),
      ],
      [
        `prob`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          prob: mockRandom(),
        }),
      ],
      [
        `prob-after`,
        new RelationshipScoreWrapper({
          otherId: `test`,
          prob: mockRandom(),
          latest_match: moment().subtract(
            lastMatchedCooldownMinutes - delta,
            `minutes`,
          ),
        }),
      ],
    ];
  };

  relationShipScores.push(...genScores());
  relationShipScores.push(...genScores());
  relationShipScores.push(...genScores());

  relationShipScores.sort(relationShipScoresSortFunc);
  console.log(relationShipScores.map((entry) => entry[0]));

  expect(relationShipScores.map((entry) => entry[0])).toStrictEqual([
    `prob`,
    `prob`,
    `prob`,
    `score1`,
    `score1_before`,
    `score1`,
    `score1_before`,
    `score1`,
    `score1_before`,
    `noscore`,
    `noscore_before`,
    `score-1`,
    `score-1_before`,
    `noscore`,
    `noscore_before`,
    `score-1`,
    `score-1_before`,
    `noscore`,
    `noscore_before`,
    `score-1`,
    `score-1_before`,
    `nscore`,
    `nscore`,
    `nscore`,
    `prob-after`,
    `prob-after`,
    `prob-after`,
    `score1_after`,
    `score1_after`,
    `score1_after`,
    `noscore_after`,
    `score-1_after`,
    `noscore_after`,
    `score-1_after`,
    `noscore_after`,
    `score-1_after`,
    `nscore-after`,
    `nscore-after`,
    `nscore-after`,
  ]);

  // TEST TO DISPLAY SCORES...

  mockRandom = () => {
    return Math.random();
  };

  relationShipScores = [];
  relationShipScores.push(...genScores());
  relationShipScores.push(...genScores());
  relationShipScores.push(...genScores());

  shuffleArray(relationShipScores);

  relationShipScores.sort(relationShipScoresSortFunc);

  relationShipScores.sort(relationShipScoresSortFunc);
  const cooldownTime = moment().subtract(lastMatchedCooldownMinutes, `minutes`);

  console.log(`>>>>>>>>>>>>>>>>>>>>>>>>`);
  console.log(
    relationShipScores
      .map(
        (entry) =>
          `>> ${entry[1].latest_match.isBefore(
            cooldownTime,
          )} \t ${entry[1].prob.toFixed(2)} \t ${entry[1].score.toFixed(
            2,
          )} \t ${entry[1].nscore.toFixed(2)} \t ${entry[0]}`,
      )
      .join(`\n`),
  );
});
