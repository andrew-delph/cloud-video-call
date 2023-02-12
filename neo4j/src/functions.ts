import * as neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "neo4j://localhost:7687",
  neo4j.auth.basic("neo4j", "password")
);
const session = driver.session();

const nodesNum = 20000;

const edgesNum = nodesNum * 4;

async function createData() {
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

  edges.push({ a: "node1", b: "node2" });
  edges.push({ a: "andrew2", b: "andrew3" });

  await session.run("MATCH (n) DETACH DELETE n");

  console.log("create nodes");

  await session.run(
    `UNWIND $nodes as node CREATE (:Person {name: toString(node)})`,
    { nodes: nodes }
  );

  console.log("create edges");

  await session.run(
    `UNWIND $edges as edge MATCH (a:Person), (b:Person) WHERE a.name = toString(edge.a) AND b.name = toString(edge.b) CREATE (a)-[:KNOWS]->(b), (b)-[:KNOWS]->(a)`,
    { edges: edges }
  );

  console.log("done");
}
