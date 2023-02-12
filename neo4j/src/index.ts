import * as neo4j from "neo4j-driver";

let result;

function printResults(result: any) {
  //   console.log("Results:");
  //   console.log(result.records);
  console.log();
  //   console.log("Summary:");
  //   console.log(result.summary);
  const records = result.records;
  console.log("print each record");
  records.forEach((record: any) => {
    console.log(record);
  });
  console.log("records.length:", records.length);
}

(async () => {
  const driver = neo4j.driver(
    "neo4j://localhost:7687",
    neo4j.auth.basic("neo4j", "password")
  );
  const session = driver.session();

  try {
    // console.log(result);
    // printResults(result);
  } finally {
    await session.close();
    await driver.close();
  }

  // on application exit:
})();
