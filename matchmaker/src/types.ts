import moment from 'moment';

export class RelationshipScoreWrapper {
  otherId: string;
  prob: number;
  score: number;
  nscore: number;
  latest_match: moment.Moment | null = null;

  constructor(data: any) {
    this.otherId = data.otherId;
    this.prob = data.prob || -1;
    this.score = data.score || -1;
    this.nscore = data.nscore || 0;
    this.latest_match = data.latest_match || null;
  }
}

export type FilteredUserType = {
  otherId: string;
  latest_match: moment.Moment;
};
