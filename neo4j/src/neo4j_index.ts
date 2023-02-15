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
      console.log(`value`, record.get(`r.value`));
      console.log(`a`, record.get(`a.name`));
      console.log(`b`, record.get(`b.name`));
    } catch (e) {
      console.log(`...`);
      // console.log(record);
    }
  });
  console.log(`records.length:`, records.length);
}

(async () => {
  try {
    // for (var i = 0; i < 3; i++) {
    //   result = await funcs.changeRandomReady()
    // }

    // await funcs.createData(10, 20, true);

    let result;

    const x = new Set();
    x.add(`node2`);
    x.add(`node3`);
    x.add(`node4`);
    x.add(`node5`);

    result = await funcs.session.run(
      `
    UNWIND $others AS otherId
    MATCH (a { name: $main })-[r:KNOWS]->(b { name: otherId })
    RETURN r.value, a.name, b.name
    `,
      { main: `node1`, others: x },
    );
    printResults(result, 10);
  } finally {
    console.log(`closing`);
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})().then(() => {});
