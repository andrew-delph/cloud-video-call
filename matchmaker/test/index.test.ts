import { relationShipScoresSortFunc } from '../src/matchmaker';
import { RelationshipScoreWrapper } from '../src/types';

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
  const relationShipScores: [string, RelationshipScoreWrapper][] = [
    [`user1`, new RelationshipScoreWrapper({ otherId: `test` })],
    [`user2`, new RelationshipScoreWrapper({ otherId: `test`, score: 1 })],
    [`user3`, new RelationshipScoreWrapper({ otherId: `test` })],
    [`user4`, new RelationshipScoreWrapper({ otherId: `test` })],
  ];
  console.log(relationShipScores.map((entry) => entry[0]));
  relationShipScores.sort(relationShipScoresSortFunc);
});
