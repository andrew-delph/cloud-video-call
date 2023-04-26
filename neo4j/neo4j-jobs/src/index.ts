import * as common from 'common';
common.listenGlobalExceptions();

const job = process.env.JOB;

// funcs.createData();

console.log(`Value of JOB:`, job);

switch (job) {
  case `TRAIN`:
    console.log(`JOB is TRAIN`);
    break;
  case `COMPUTE`:
    console.log(`JOB is COMPUTE`);
    break;
  default:
    console.error(`Unknown JOB: ${job}`);
}
