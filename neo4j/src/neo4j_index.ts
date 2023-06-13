import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';
import * as nodembeddings_flow from './nodembeddings_flow';
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

export function printResults(
  result: neo4j.QueryResult,
  topLimit: number = 10,
  bottomLimit: number = 0,
  shortUserId = true,
) {
  console.log(``);
  //   console.log("Results:");
  //   console.log(result.records);
  // console.log(`Summary:`);
  // console.log(result.summary);
  const records = result.records;
  console.log(
    `print records. topLimit: ${topLimit}  bottomLimit: ${bottomLimit}`,
  );
  console.log(`>>`);

  const printRecord = (record: any, index: any) => {
    let line = `#: ${index} `;
    record.keys.forEach((key: any) => {
      try {
        if (!shortUserId) throw `not shortUserId`;
        line =
          line +
          ` ` +
          `${key.toString()}: ${record.get(key).toString().split(`_`).pop()}` +
          `\t`;
      } catch {
        line = line + ` ` + `${key.toString()}: ${record.get(key)}` + `\t`;
      }
    });
    console.log(line);
  };
  records.slice(0, topLimit).forEach(printRecord);
  if (bottomLimit > 0) {
    console.log(`---`);
    records.slice(-bottomLimit).forEach(printRecord);
  }

  console.log(`<<`);

  console.log(`records.length:`, records.length);
}

const start_time = performance.now();
export const run = async () => {
  try {
    funcs.setDriver(`bolt://localhost:7687`);

    const node_attributes: string[] = await funcs.getAttributeKeys();

    results = await funcs.run(`MATCH (p:Person) RETURN p.userId as userId`);

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
};
