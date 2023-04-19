import * as neo4j from 'neo4j-driver';
import { Dict } from 'neo4j-driver-core/types/record';
import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';
import { createLineChart } from './chart';

let result: neo4j.QueryResult<Dict<PropertyKey, any>>;

export function printResults(
  result: neo4j.QueryResult<Dict<PropertyKey, any>>,
  limit: number = 10,
) {
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
      throw `dont use`;
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
(async () => {
  try {
    const pieData = [
      { value: 1, name: `value1` },
      { value: 2, name: `value2` },
      { value: 3, name: `value3`, colour: `blue` },
    ];
    await createLineChart(pieData);

    return;
    let results;

    // results = await funcs.getFriends();
    // printResults(results, 50);

    // return;

    await funcs.createData({ deleteData: true, nodesNum: 100, edgesNum: 50 });

    await funcs.createFriends();

    await funcs.createGraph();
    results = await funcs.callPriority();
    results = await funcs.callCommunities();
    // results = await funcs.callWriteSimilar();
    // results = await funcs.callNodeEmbeddings();

    results = await funcs.getUsers();
    // printResults(results, 50);

    // results = await funcs.getVarience();
    // printResults(results, 3);

    await lp.createPipeline();
    await funcs.createGraph(`mlGraph`);
    await lp.train();
    await lp.predict();
  } finally {
    const end_time = performance.now();
    console.log(`closing. ${(end_time - start_time) / 1000}`);
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
