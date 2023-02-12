import * as neo4j from 'neo4j-driver';

export const driver = neo4j.driver(
  `neo4j://localhost:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);
export const session = driver.session();

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export async function createData(
  nodesNum: number = 1000,
  edgesNum: number = 4,
  deleteData: Boolean = false,
) {
  edgesNum = nodesNum * edgesNum;

  const nodes = [];
  const edges = [];

  for (var i = 0; i < nodesNum; i++) {
    nodes.push(`node${i}`);
  }

  //   nodes.push(`andrew1`);
  //   nodes.push(`andrew2`);
  //   nodes.push(`andrew3`);
  //   nodes.push(`andrew4`);
  //   nodes.push(`andrew5`);
  //   nodes.push(`andrew6`);

  for (var i = 0; i < edgesNum; i++) {
    const a = nodes[Math.floor(Math.random() * nodesNum)];
    let b = nodes[Math.floor(Math.random() * nodesNum)];
    while (a === b) {
      b = nodes[Math.floor(Math.random() * nodesNum)];
    }
    edges.push({ a, b });
  }

  //   edges.push({ a: `andrew1`, b: `andrew2` });
  //   edges.push({ a: `andrew2`, b: `andrew3` });
  //   edges.push({ a: `andrew3`, b: `andrew4` });
  //   edges.push({ a: `andrew4`, b: `andrew5` });
  //   edges.push({ a: `andrew3`, b: `andrew6` });

  //   edges.push({ a: `node1`, b: `node2` });
  //   edges.push({ a: `andrew2`, b: `andrew3` });

  if (deleteData) {
    console.log(`Deleting`);
    await session.run(`MATCH (n) DETACH DELETE n`);
  }

  console.log(`create nodes ${nodesNum}`);

  await session.run(
    `UNWIND $nodes as node MERGE (:Person {name: toString(node)})`,
    { nodes: nodes },
  );

  console.log(`create edges ${edgesNum}`);

  await session.run(
    `UNWIND $edges as edge MATCH (a:Person), (b:Person) WHERE a.name = toString(edge.a) AND b.name = toString(edge.b) MERGE (a)-[:KNOWS]->(b)`,
    { edges: edges },
  );

  console.log(`done`);
}

export async function createGraph() {
  let result;
  // delete myGraph if it exists
  try {
    result = await session.run(`CALL gds.graph.drop('myGraph');`);
    console.log(`graph delete successfully`);
  } catch (e) {
    console.log(`graph doesn't exist`);
  }

  let start_time = performance.now();
  // create myGraph
  console.log(`creating graph`);
  result = await session.run(`CALL gds.graph.project( 'myGraph', '*', '*' );`);
  console.log(`created graph`, performance.now() - start_time);

  return result;
}

export async function callAlgo() {
  // run simularity
  console.log(``);
  console.log(`--- callAlgo`);

  const query1 = `
      CALL gds.nodeSimilarity.stream('myGraph' , {})
          YIELD node1, node2, similarity
          RETURN gds.util.asNode(node1).name
          AS Person1, gds.util.asNode(node2).name
          AS Person2, similarity 
          ORDER BY similarity DESCENDING, Person1, Person2
          `;

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

  const query5 = `WITH ['node1', 'node2', 'node3', 'node4'] AS names
          CALL gds.nodeSimilarity.stream('myGraph', {})
            YIELD node1, node2, similarity
            WHERE gds.util.asNode(node1).name IN names
            AND gds.util.asNode(node2).name IN names
            AND gds.util.asNode(node1).name <> gds.util.asNode(node2).name
            RETURN gds.util.asNode(node1).name AS Person1,
              gds.util.asNode(node2).name AS Person2,
              similarity
            ORDER BY similarity DESCENDING, Person1, Person2
          `;

  const query6 = `WITH ['node1', 'node2', 'node3', 'node4'] AS nodeNames
          MATCH (n)
          WHERE n.name IN nodeNames
          CALL gds.nodeSimilarity.stream('myGraph', {
            nodeProjection: 'n'
          })
          YIELD node1, node2, similarity
          RETURN gds.util.asNode(node1).name AS Person1,
                 gds.util.asNode(node2).name AS Person2,
                 similarity
          ORDER BY similarity DESCENDING, Person1, Person2
          `;

  const query7 = `CALL gds.nodeSimilarity.write('myGraph', {
            writeRelationshipType: 'SIMILAR',
            writeProperty: 'score'
        })
        YIELD nodesCompared, relationshipsWritten`;

  //         MATCH (a:Person), (b:Person) WHERE a.name IN ['node1', 'node2', 'node3'] AND b.name IN ['node1', 'node2', 'node3'] AND a <> b
  // MATCH (a)-[r:SIMILAR]-(b)
  // RETURN a.name AS node1, b.name AS node2, r.value AS similarity
  // ORDER BY similarity DESCENDING;

  let start_time = performance.now();

  let result = await session.run(query7);

  const end_time = performance.now();

  console.log(`query`, end_time - start_time);

  return result;
}

export async function changeRandomReady() {
  //   const start_time = performance.now();
  //   // create myGraph
  //   let result;
  //   console.log(`running changeRandomReady`);
  //   result = await session.run(`
  //     MATCH (n) WHERE n.name = "node${getRandomInt(nodesNum)}"
  //       SET n.ready = true
  //   `);
  //   const end_time = performance.now();
  //   console.log(`it took: `, end_time - start_time);
  //   return result;
}

export async function getAllReady() {
  //   const start_time = performance.now();
  //   // create myGraph
  //   let result;
  //   console.log(`running getAllReady`);
  //   result = await session.run(`
  //       MATCH (n)
  //         RETURN n
  //     `);
  //   const end_time = performance.now();
  //   console.log(`it took: `, end_time - start_time);
  //   return result;
}

export async function getFirstN() {
  const n = 100;
  const start_time = performance.now();
  // create myGraph

  let result;
  console.log(`running getFirstN n:${n}`);

  result = await session.run(`
    MATCH (n)
    RETURN n
    LIMIT ${n}
    `);

  const end_time = performance.now();

  console.log(`it took: `, end_time - start_time);

  return result;
}
