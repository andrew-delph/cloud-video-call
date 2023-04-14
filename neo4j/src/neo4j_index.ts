import * as neo4j from 'neo4j-driver';
import { Dict } from 'neo4j-driver-core/types/record';
import { linkPredictionML } from './lp_pipeling';
import * as funcs from './neo4j_functions';

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
      console.log(`>>`);
      record.keys.forEach((key) => {
        console.log(`${key.toString()}: ${JSON.stringify(record.get(key))}`);
      });
      console.log(`<<`);
    }
  });
  console.log(`records.length:`, records.length);
}

(async () => {
  try {
    let results;

    await funcs.createData({ deleteData: true, nodesNum: 999 });

    await funcs.createFriends();
    // await funcs.createFeedback2();

    await funcs.createGraph();

    await funcs.callPriority();
    results = await funcs.callCommunities();

    // // // results = await funcs.callWriteSimilar();

    // results = await funcs.getUsers();
    // printResults(results, 500);

    results = await funcs.getVarience();
    printResults(results, 10);
  } finally {
    console.log(`closing.`);
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
