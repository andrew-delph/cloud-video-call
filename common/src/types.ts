export type ReadyMessage = {
  userId: string;
};

export type MatchMessage = {
  userId1: string;
  userId2: string;
  score: RelationshipScoreType;
};

export type RelationshipScoreType = {
  prob: number;
  score: number;
  num_friends: number;
};
