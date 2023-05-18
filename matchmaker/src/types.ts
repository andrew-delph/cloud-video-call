export type RelationshipScoreType = {
  otherId: string;
  prob: number;
  score: number;
  latest_match: moment.Moment;
};

export type FilteredUserType = {
  otherId: string;
  latest_match: moment.Moment;
};
