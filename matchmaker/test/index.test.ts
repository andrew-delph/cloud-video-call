import { RelationshipScoreWrapper } from '../src/types';

test(`adds 1 + 2 to equal 3`, () => {
  expect(1 + 2).toBe(3);
});

test(`RelationshipScoreWrapper default values`, () => {
  const relationshipScore: RelationshipScoreWrapper =
    new RelationshipScoreWrapper({});
  expect(relationshipScore.score).toBe(-1);
  expect(relationshipScore.prob).toBe(-1);
});
