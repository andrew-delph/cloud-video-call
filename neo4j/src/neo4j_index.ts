import * as neo4j from 'neo4j-driver';
import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';

console.log(`starting neo4j_index`);
let result: neo4j.QueryResult;

export function printResults(result: neo4j.QueryResult, limit: number = 10) {
  console.log(``);
  //   console.log("Results:");
  //   console.log(result.records);
  // console.log(`Summary:`);
  // console.log(result.summary);
  const records = result.records;
  console.log(`print records. limit is ${limit}`);
  console.log(`>>`);
  records.slice(0, limit).forEach((record) => {
    try {
      // console.log(record.get(`r`));
      // console.log(`value`, Object.keys(record.get(`r`)));
      console.log(
        record.get(`person1.userId`),
        record.get(`person2.userId`),
        record.get(`probability`),
        record.get(`gender1`),
        record.get(`gender2`),
        record.get(`other`),
      );
    } catch (e) {
      let line = ``;
      record.keys.forEach((key) => {
        line =
          line +
          ` ` +
          `${key.toString()}: ${JSON.stringify(record.get(key))}` +
          `\t`;
      });
      console.log(line);

      // record.keys.forEach((key) => {
      // console.log(`${key.toString()}: ${JSON.stringify(record.get(key))}`);
      // });
    }
  });
  console.log(`<<`);

  console.log(`records.length:`, records.length);
}
const start_time = performance.now();

export const run = async () => {
  try {
    funcs.setDriver(`bolt://localhost:7687`);
    let results;
    // results = await funcs
    //   .compareTypes
    //   // ``,
    //   // ``,
    //   // `{gender:'male'}`,
    //   // `{gender:'female'}`,
    //   ();

    const otherIds = [];
    console.log(`...`);

    for (let i = 0; i < 10; i++) {
      otherIds.push(`k6_auth_${i}`);
    }

    results = await funcs.run(
      `UNWIND $otherUsers AS otherId
      MATCH (n1:Person{userId: $target})
      MATCH (n2:Person{userId: otherId})
      OPTIONAL MATCH (n1)-[prel:PREDICTION]->(n2)
      OPTIONAL MATCH (n1)-[:FRIENDS]-()-[:FRIENDS]-()-[:FRIENDS]-(n2)
      WITH n1, n2, prel, count(*) as num_friends
      return
      EXISTS((n1)-[:FRIENDS]->(n2)) as friends, 
      coalesce(prel.probability,0) as prob, 
      round(n2.priority,3) as p2,
      n1.userId as targetId,
      n2.userId as otherId,
      num_friends
      ORDER BY prob DESC, num_friends DESC, p2 DESC`,
      { otherUsers: otherIds, target: `k6_auth_221` },
    );

    printResults(results, 20);
    return;

    await funcs.createData({ deleteData: true, nodesNum: 100, edgesNum: 50 });

    // await funcs.createAttributeFloat();

    const node_attributes: string[] = await funcs.getAttributeKeys();
    results = await funcs.createGraph(`myGraph`, node_attributes);

    // results = await funcs.callShortestPath();

    results = await funcs.callPriority();
    results = await funcs.callCommunities();
    results = await funcs.callWriteSimilar();
    // results = await funcs.callNodeEmbeddings();
    results = await funcs.getUsers();
    // printResults(results, 50);

    results = await funcs.readGraph(`myGraph`, `values`);
    // printResults(results, 50);

    results = await lp.createPipeline();
    results = await funcs.createGraph(`myGraph`, node_attributes);

    const train_results = await lp.train();
    results = await lp.predict();
    printResults(results, 200);

    results = await funcs.compareTypes();
    printResults(results, 200);

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
