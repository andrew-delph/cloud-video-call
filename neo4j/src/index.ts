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
    // delete myGraph if it exists
    try {
      result = await session.run("CALL gds.graph.drop('myGraph');");
      console.log("graph delete successfully");
    } catch (e) {
      console.log("graph doesn't exist");
    }

    const start_time = performance.now();
    // create myGraph
    console.log("creating graph");
    result = await session.run(
      "CALL gds.graph.project( 'myGraph', '*', '*' );"
    );
    console.log("created graph", performance.now() - start_time);

    // run simularity

    const query1 = `
    CALL gds.nodeSimilarity.stream('myGraph' , {})
        YIELD node1, node2, similarity
        RETURN gds.util.asNode(node1).name
        AS Person1, gds.util.asNode(node2).name
        AS Person2, similarity 
        ORDER BY similarity DESCENDING, Person1, Person2`;

    const query2 = `
    CALL gds.knn.stream('myGraph', {
            topK: 1,
            randomSeed: 1337,
            concurrency: 1,
            sampleRate: 1.0,
            deltaThreshold: 0.0
        })
        YIELD node1, node2, similarity
        RETURN gds.util.asNode(node1).name AS Person1, gds.util.asNode(node2).name AS Person2, similarity
        ORDER BY similarity DESCENDING, Person1, Person2`;

    const query3 = `
    CALL gds.pageRank.stream('myGraph')
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId).name AS name, score
        ORDER BY score DESC, name ASC`;

    const query4 = `
        CALL gds.betweenness.stream('myGraph')
          YIELD nodeId, score
          RETURN gds.util.asNode(nodeId).name AS name, score
          ORDER BY score ASC`;

    result = await session.run(query1);

    const end_time = performance.now();

    console.log("it took: ", end_time - start_time);

    // console.log(result);
    // printResults(result);
  } finally {
    await session.close();
    await driver.close();
  }

  // on application exit:
})();
