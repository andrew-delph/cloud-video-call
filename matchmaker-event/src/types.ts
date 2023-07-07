import moment from 'moment';

export class RelationshipScoreWrapper {
  otherId: string;
  prob: number;
  score: number;
  nscore: number;
  latest_match: moment.Moment;

  constructor(data: {
    otherId: string;
    prob?: number;
    score?: number;
    nscore?: number;
    latest_match?: moment.Moment;
  }) {
    this.otherId = data.otherId;
    this.prob = data.prob ?? -1;
    this.score = data.score ?? -1;
    this.nscore = data.nscore ?? 0;
    this.latest_match = data.latest_match ?? moment(0);
  }
}

export type FilteredUserType = {
  otherId: string;
  latest_match: moment.Moment;
};
