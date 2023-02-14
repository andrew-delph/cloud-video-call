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
      console.log(record.get(`n`));
    } catch (e) {
      console.log(record);
    }
  });
  console.log(`records.length:`, records.length);
}

(async () => {
  try {
    // for (var i = 0; i < 3; i++) {
    //   result = await funcs.changeRandomReady()
    // }

    let result;

    for (var i = 0; i < 100; i++) {
      result = funcs.mergePerson();
    }

    // printResults(result, 2);
  } finally {
    console.log(`closing`);
    // await funcs.session.close();
    // await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
