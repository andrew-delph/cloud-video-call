import * as common from 'common';
import * as funcs from 'neo4jscripts';
console.log(funcs.callAlgo);

common.listenGlobalExceptions();

funcs.setDriver(`bolt://neo4j:7687`); // `bolt://127.0.0.1:7687`

const job = process.env.JOB;

// funcs.createData();
let node_attributes: string[];

let results;
console.log(`Value of JOB:`, job);
(async () => {
  switch (job) {
    case `TRAIN`:
      console.log(`JOB is TRAIN`);

      await funcs.createFriends();
      node_attributes = await funcs.getAttributeKeys();
      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results);

      results = await funcs.callShortestPath();
      funcs.printResults(results);

      results = await funcs.callPriority();
      funcs.printResults(results);

      results = await funcs.callCommunities();
      funcs.printResults(results);

      results = await funcs.callWriteSimilar();
      funcs.printResults(results);

      results = await funcs.createPipeline();
      funcs.printResults(results);

      results = await funcs.createGraph(`mlGraph`, node_attributes);
      funcs.printResults(results);

      results = await funcs.train();
      funcs.printResults(results);

      results = await funcs.predict();
      funcs.printResults(results);

      results = await funcs.compareTypes();
      funcs.printResults(results, 200);

      results = await funcs.createPipeline();
      funcs.printResults(results, 200);

      results = await funcs.createGraph(`mlGraph`, node_attributes);
      funcs.printResults(results, 200);

      results = await funcs.train();
      funcs.printResults(results, 200);

      results = await funcs.predict();
      funcs.printResults(results, 200);

      results = await funcs.compareTypes();
      funcs.printResults(results, 200);

      console.log(`graph_attributes`, node_attributes);

      break;
    case `COMPUTE`:
      console.log(`JOB is COMPUTE`);
      await funcs.createFriends();
      node_attributes = await funcs.getAttributeKeys();
      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results);

      results = await funcs.callShortestPath();
      funcs.printResults(results);

      results = await funcs.callPriority();
      funcs.printResults(results);

      results = await funcs.callCommunities();
      funcs.printResults(results);

      results = await funcs.callWriteSimilar();
      funcs.printResults(results);

      results = await funcs.createPipeline();
      funcs.printResults(results);
      results = await funcs.createGraph(`mlGraph`, node_attributes);
      funcs.printResults(results);

      results = await funcs.train();
      funcs.printResults(results);

      results = await funcs.predict();
      funcs.printResults(results);

      results = await funcs.compareTypes();
      funcs.printResults(results, 200);

      break;
    default:
      console.error(`Unknown JOB: ${job}`);
      process.exit(1);
  }
})();
