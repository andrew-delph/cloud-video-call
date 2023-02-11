import * as neo4j from "neo4j-driver";

const nodesNum = 100000;

const edgesNum = nodesNum * 15;

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

  const nodes = [];
  const edges = [];

  for (var i = 0; i < nodesNum; i++) {
    nodes.push(`node${i}`);
  }

  nodes.push("andrew1");
  nodes.push("andrew2");
  nodes.push("andrew3");
  nodes.push("andrew4");
  nodes.push("andrew5");
  nodes.push("andrew6");

  for (var i = 0; i < edgesNum; i++) {
    const a = nodes[Math.floor(Math.random() * nodesNum)];
    let b = nodes[Math.floor(Math.random() * nodesNum)];
    while (a === b) {
      b = nodes[Math.floor(Math.random() * nodesNum)];
    }
    edges.push({ a, b });
  }

  edges.push({ a: "andrew1", b: "andrew2" });
  edges.push({ a: "andrew2", b: "andrew3" });
  edges.push({ a: "andrew3", b: "andrew4" });
  edges.push({ a: "andrew4", b: "andrew5" });
  edges.push({ a: "andrew3", b: "andrew6" });

  //   edges.push({ a: "node1", b: "node2" });
  //   edges.push({ a: "andrew2", b: "andrew3" });

  try {
    let start_time = performance.now();
    await session.run("MATCH (n) DETACH DELETE n");
    console.log("delete nodes", performance.now() - start_time);

    start_time = performance.now();
    const nodePromises = [];

    for (var i = 0; i < nodes.length; i++) {
      const id = nodes[i];
      nodePromises.push(
        (async () => {
          const s = driver.session();
          await s.run("CREATE (a:Person {name: $name}) RETURN a", {
            name: id,
          });
          s.close();
          return;
        })()
      );
    }

    await Promise.all(nodePromises);

    const edgePromises = [];

    for (var i = 0; i < edges.length; i++) {
      const edge = edges[i];
      edgePromises.push(
        (async () => {
          const s = driver.session();
          await session.run(
            "MATCH (a:Person), (b:Person) WHERE a.name = $a AND b.name = $b CREATE (a)-[:KNOWS]->(b), (b)-[:KNOWS]->(a)",
            edge
          );
          s.close();
        })()
      );
    }

    await Promise.all(edgePromises);

    console.log("add data", performance.now() - start_time);

    start_time = performance.now();

    // delete myGraph if it exists
    try {
      result = await session.run("CALL gds.graph.drop('myGraph');");
      // console.log("graph delete successfully");
    } catch (e) {
      // console.log("graph doesn't exist");
    }

    console.log("delete graph", performance.now() - start_time);

    start_time = performance.now();
    // create myGraph
    // console.log("creating graph");
    result = await session.run(
      "CALL gds.graph.project( 'myGraph', '*', '*' );"
    );
    console.log("created graph", performance.now() - start_time);

    start_time = performance.now();
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
  }

  // on application exit:
  console.log("end");
  await driver.close();
})();
