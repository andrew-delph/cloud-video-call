import * as common from 'common';
import * as funcs from 'neo4jscripts';
console.log(funcs.callAlgo);

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
