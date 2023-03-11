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
      throw `now`;
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
    let result;

    const x = new Set<string>();

    for (let i = 1; i < 5; i++) {
      x.add(`k6_auth_${i}`);
    }

    // await funcs.createData(0, 0, true);
    // await funcs.createGraph();
    // // result = await funcs.callWriteSimilar();
    // await funcs.callPriority();
    // result = await funcs.callCommunities();
    result = await linkPredictionML();

    // printResults(result, 400);
  } finally {
    console.log(`closing.`);
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
