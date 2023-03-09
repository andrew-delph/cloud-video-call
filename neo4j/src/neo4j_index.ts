import * as neo4j from 'neo4j-driver';
import { Dict } from 'neo4j-driver-core/types/record';
import * as funcs from './neo4j_functions';

let result: neo4j.QueryResult<Dict<PropertyKey, any>>;

function printResults(
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
      // console.log(record.get(`r`));
      // console.log(`value`, Object.keys(record.get(`r`)));
      console.log(`>`);
      console.log(`n`, record.get(`priority`), typeof record.get(`priority`));
      console.log(`>`);
    } catch (e) {
      console.log(record);
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
    await funcs.createGraph();
    // result = await funcs.callWriteSimilar();
    // await funcs.callPriority();
    result = await funcs.callCommunities();
    // result = await funcs.getSimilarTarget(`k6_auth_1`, Array.from(x));

    printResults(result, 1);
  } finally {
    console.log(`closing.`);
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
