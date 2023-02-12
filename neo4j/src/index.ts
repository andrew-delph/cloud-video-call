import * as neo4j from 'neo4j-driver';
import * as funcs from './functions';

let result;

function printResults(result: any) {
  //   console.log("Results:");
  //   console.log(result.records);
  console.log('Summary:');
  console.log(result.summary);
  const records = result.records;
  const limit = 10;
  console.log(`print records. limit is ${limit}`);
  records.slice(0, 10).forEach((record: any) => {
    console.log(record.get('n'));
  });
  console.log('records.length:', records.length);
}

(async () => {
  try {
    // for (var i = 0; i < 1000; i++) {
    //   result = await funcs.changeRandomReady();
    // }
    result = await funcs.getAllReady();
    // await funcs.testGraph();
    // printResults(result);
  } finally {
    console.log('closing');
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
})();
