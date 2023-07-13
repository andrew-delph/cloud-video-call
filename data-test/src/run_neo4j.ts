import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';
import { printResults } from './neo4j_functions';
import * as nodembeddings_flow from './nodembeddings_flow';
import { nodeEmbeddingsFlowMain } from './nodembeddings_flow';
import {
  userFunctions,
  createFemale,
  createMale,
  createGroupA,
  createGroupB,
} from './person';
import * as neo4j from 'neo4j-driver';

console.log(`starting neo4j_index`);
let results: neo4j.QueryResult;

const start_time = performance.now();
export async function run() {
  try {
    funcs.setDriver(`bolt://localhost:7687`);

    await nodeEmbeddingsFlowMain();

    return;
    results = await funcs.run(`Match (n:Person) return n.userId;`);

    // console.log(results.summary);
    printResults(results, 200, 0, false);

    // await nodembeddings_flow.main();

    // results = await funcs.compareTypes(`Male`);
    results = await funcs.getFriends();

    printResults(results, 100, 0, false);

    return;
    const node_attributes: string[] = await funcs.getAttributeKeys();

    const userIds = results.records.map((record) => record.get(`userId`));

    const sliceNum = 100;

    results = await funcs.createGraph(
      `testGraph`,
      node_attributes,
      // userIds.slice(0, 100),
      // true,
    );

    // results = await funcs.callPriority();
    // results = await funcs.callCommunities();
    // results = await funcs.callWriteSimilar();
    // results = await funcs.callNodeEmbeddings();
    // printResults(results, 50);

    results = await lp.createPipeline();
    const train_results = await lp.train(`testGraph`);

    results = await lp.predict(false, `testGraph`);
    printResults(results, 10, 10);

    // results = await funcs.compareTypes();
    // printResults(results, 200);

    console.log(`graph_attributes`, node_attributes);
  } finally {
    const end_time = performance.now();
    console.log(
      `neo4j_index closing. ${((end_time - start_time) / 1000).toFixed(
        1,
      )}secs ${((end_time - start_time) / 1000 / 60).toFixed(1)}mins`,
    );
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
}
let START_TIME = performance.now();
run()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    console.log(`DONE ${(performance.now() - START_TIME) / 1000}seconds`);
    process.exit(0);
  });
