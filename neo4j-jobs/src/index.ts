import * as common from 'common';
import * as funcs from 'neo4jscripts';
console.log(funcs.callAlgo);

common.listenGlobalExceptions();

funcs.setDriver(`bolt://neo4j:7687`); // `bolt://127.0.0.1:7687`

const job = process.env.JOB;

// funcs.createData();
let node_attributes: string[];

const print_num = 5;

let results;
console.log(`Value of JOB:`, job);
(async () => {
  switch (job) {
    case `TRAIN`:
    case `COMPUTE`:
      // await funcs.createFriends();
      node_attributes = await funcs.getAttributeKeys();
      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results, print_num);

      // results = await funcs.callShortestPath();
      // funcs.printResults(results, print_num);

      results = await funcs.callPriority();
      funcs.printResults(results, print_num);

      results = await funcs.callCommunities();
      funcs.printResults(results, print_num);

      results = await funcs.callWriteSimilar();
      funcs.printResults(results, print_num);

      results = await funcs.createPipeline();
      funcs.printResults(results, print_num);

      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results, print_num);
      break;

    default:
      console.error(`Unknown JOB: ${job}`);
      process.exit(1);
  }
  switch (job) {
    case `TRAIN`:
      results = await funcs.train();
      funcs.printResults(results, print_num);

    case `TRAIN`:
    case `COMPUTE`:
      results = await funcs.predict();
      funcs.printResults(results, print_num);

      results = await funcs.compareTypes();
      funcs.printResults(results, print_num);

      break;
  }
  console.log(`complted ${job}`);
  process.exit(0);
})();
