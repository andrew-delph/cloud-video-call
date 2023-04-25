import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';
import { printResults } from './neo4j_index';
import { Dict } from 'neo4j-driver-core/types/record';
import { Person, getRandomPerson } from './person';
import { createDotGraph } from './chart';
import async from 'async';
const maxRetryTimeMs = 15 * 1000;

export const driver = neo4j.driver(
  `bolt://localhost:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
  { disableLosslessIntegers: true, maxTransactionRetryTime: maxRetryTimeMs },
);
export const session = driver.session();

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retryFunction(func: any, retries: number, delay: number) {
  return new Promise((resolve, reject) => {
    func()
      .then(resolve)
      .catch((error: any) => {
        if (retries === 0) {
          reject(error);
        } else {
          setTimeout(() => {
            retryFunction(func, retries - 1, delay).then(resolve, reject);
          }, delay);
        }
      });
  });
}

export async function createData({
  nodesNum = 100,
  edgesNum = 7,
  deleteData = false,
}) {
  const start_time = performance.now();

  if (deleteData) {
    console.log(`Deleting`);
    await session.run(`
    MATCH (n)
    CALL {
      WITH n
      DETACH DELETE n
    } IN TRANSACTIONS
    `);
  }

  const nodes = [];
  const edges = [];

  for (var i = 0; i < nodesNum; i++) {
    nodes.push(getRandomPerson(`node${i}`));
  }

  edgesNum = nodesNum * edgesNum;
  for (var i = 0; i < edgesNum; i++) {
    const a = nodes[Math.floor(Math.random() * nodesNum)];
    let b = nodes[Math.floor(Math.random() * nodesNum)];
    while (a === b) {
      b = nodes[Math.floor(Math.random() * nodesNum)];
    }
    edges.push({ a, b });
  }

  console.log(`create nodes ${nodes.length}`);

  const limit = 15;

  await async.eachLimit(nodes, limit, async (node, callback) => {
    await node.createNode();
    callback();
  });

  console.log(`create edges ${edges.length}`);

  await async.eachLimit(edges, limit, async (edge, callback) => {
    await edge.a.createFeedback(edge.b);
    await edge.b.createFeedback(edge.a);
    callback();
  });

  const end_time = performance.now();

  console.log(`createData`, end_time - start_time);
}

export async function getUsers() {
  console.log();
  console.log(`running getUsers`);

  const start_time = performance.now();

  let result;

  result = await session.run(
    `
    MATCH (a:Person)-[rel2:USER_ATTRIBUTES_CONSTANT]->(b:MetaData)
    RETURN a.community, a.priority, b.type, a.embedding
    ORDER BY a.priority DESCENDING
    `,
  );

  // ORDER BY a.priority DESCENDING

  const end_time = performance.now();

  console.log(
    `getUsers`,
    `time ${end_time - start_time}`,
    `length ${result.records.length}`,
  );

  // const priority_vs_community: {
  //   x: number;
  //   y: number;
  // }[] = [];

  // result.records.forEach((record) => {
  //   const x = parseFloat(record.get(`a.community`));
  //   const y = parseFloat(record.get(`a.priority`));
  //   priority_vs_community.push({ x, y });
  // });

  // createDotGraph(priority_vs_community, `priority_vs_community`);

  const community_data: {
    x: number;
    y: number;
  }[] = [];

  result.records.forEach((record) => {
    const x = parseFloat(record.get(`b.type`));
    const y = parseFloat(record.get(`a.community`));
    community_data.push({ x, y });
  });

  createDotGraph(community_data, `community`);

  const priority_data: {
    x: number;
    y: number;
  }[] = [];

  result.records.forEach((record) => {
    const y = parseFloat(record.get(`a.priority`));
    const x = parseFloat(record.get(`b.type`));
    priority_data.push({ x, y });
  });

  createDotGraph(priority_data, `priority`);

  return result;
}

export async function getVarience() {
  console.log();
  console.log(`running getVarience`);

  const start_time = performance.now();

  let result;

  // result = await session.run(
  //   `
  //   MATCH (n:Person)
  //     WHERE n.community = 88
  //     WITH avg(n.priority) as mean_priority, collect(n.priority) as priorities
  //     WITH mean_priority, reduce(s = 0.0, p IN priorities | s + (p - mean_priority) ^ 2) as sum_square_diffs, size(priorities) as num_nodes
  //     RETURN sum_square_diffs / (num_nodes - 1) as variance;
  //   `,
  // );

  result = await session.run(
    `
    MATCH (n:Person)-[rel:USER_ATTRIBUTES_CONSTANT]->(b:MetaData)
      WITH n.community as community, avg(n.priority) as mean_priority, collect(n.priority) as priorities, avg(toFloat(b.hot)) as mean_hot, max(toFloat(b.hot)) as max_hot, min(toFloat(b.hot)) as min_hot
      WITH community, mean_priority, reduce(s = 0.0, p IN priorities | s + (p - mean_priority) ^ 2) as sum_square_diffs, size(priorities) as num_nodes, mean_hot, max_hot, min_hot
      RETURN community, sum_square_diffs / (num_nodes) as variance, num_nodes, mean_hot, max_hot, min_hot
      ORDER BY num_nodes DESCENDING;
  `,
  );

  // ORDER BY rel.score DESCENDING

  const end_time = performance.now();

  console.log(`getVarience`, end_time - start_time);

  return result;
}

export async function readGraph(graphName: string = `myGraph`) {
  console.log();
  console.log(`running readGraph`);

  const start_time = performance.now();

  let result;

  result = await session.run(
    `
    CALL gds.graph.nodeProperty.stream('${graphName}', 'values')
      YIELD nodeId, propertyValue
      RETURN propertyValue as values, gds.util.asNode(nodeId).type AS type
  `,
  );

  const end_time = performance.now();

  console.log(`readGraph`, end_time - start_time);

  return result;
}

export async function createFriends() {
  let start_time = performance.now();
  let result;
  // delete friends
  result = await session.run(
    `
    MATCH ()-[r:FRIENDS]-()
    DELETE r
    RETURN r
  `,
  );

  console.log(`deleted friends: ${result.records.length}`);

  // create friends
  result = await session.run(
    `
      MATCH (a)-[r1:FEEDBACK]->(b), (a)<-[r2:FEEDBACK]-(b)
      //WHERE r1.score > 0 AND r2.score > 0 AND id(a) > id(b)
      MERGE (a)-[f1:FRIENDS]-(b)
      MERGE (b)-[f2:FRIENDS]-(a)
      RETURN f1, f2
  `,
  );
  console.log(`created friends: ${result.records.length}`);
  console.log(`createFriends`, performance.now() - start_time);

  return result;
}

export async function createAttributeFloat() {
  let start_time = performance.now();
  let result;

  result = await session.run(
    `
    MATCH (p:Person)-[rel:USER_ATTRIBUTES_CONSTANT]->(n:MetaData)
    WITH p, n, apoc.map.fromPairs([key IN keys(n) |
        [key, 
        CASE
            WHEN toString(n[key]) = n[key]
            THEN reduce(total = 0, value IN apoc.text.bytes(n[key]) | total + value)
            ELSE n[key]
        END
        ]
    ]) as attributes 
    MERGE (p)-[rel2:USER_ATTRIBUTES_GRAPH]->(num_n:MetaDataGraph)
    ON CREATE SET num_n = attributes
    ON MATCH SET num_n = attributes
    RETURN attributes
  `,
  );

  console.log(`createAttributeFloat`, performance.now() - start_time);

  return result;
}

export async function getAttributeKeys() {
  let start_time = performance.now();
  let result;

  result = await session.run(
    `MATCH (p:Person)-[rel:USER_ATTRIBUTES_CONSTANT]->(n:MetaData)
    WITH DISTINCT keys(n) as keyList
    UNWIND keyList as individualKeys
    WITH DISTINCT individualKeys as uniqueKeys
    RETURN collect(uniqueKeys) as attributes
    `,
  );

  console.log(`getAttributeKeys`, performance.now() - start_time);

  return result.records[0].get(`attributes`);
}

export async function getFriends() {
  let start_time = performance.now();
  let result;

  result = await session.run(
    `
      MATCH (a:Person)-[r:FRIENDS]->(b:Person)
      MATCH (a:Person)-[rel1:USER_ATTRIBUTES_CONSTANT]->(ad:MetaData)
      MATCH (b:Person)-[rel2:USER_ATTRIBUTES_CONSTANT]->(bd:MetaData)
      return ad.type, bd.type
  `,
  );

  console.log(`getFriends`, performance.now() - start_time);

  return result;
}

export async function createGraph(
  graphName: string = `myGraph`,
  graph_attributes: string[] = [],
) {
  console.log(``);
  console.log(
    `--- createGraph ${graphName} graph_attributes = ${graph_attributes}`,
  );
  let start_time = performance.now();
  let result;

  try {
    result = await session.run(`CALL gds.graph.drop('${graphName}');`);
    console.log(`graph delete successfully`);
  } catch (e) {
    console.log(`graph doesn't exist`);
  }

  const createValues = (node: string) => {
    return `
      apoc.map.values(apoc.map.fromPairs([key IN ${JSON.stringify(
        graph_attributes,
      )} |
        [key,
        CASE
            WHEN ${node}_md[key] IS NULL THEN NaN
            WHEN toString(${node}_md[key]) = ${node}_md[key]
            THEN reduce(total = 0.0, value IN apoc.text.bytes(${node}_md[key]) | total + value)
            ELSE toFloat(${node}_md[key])
        END
        ]
      ]), ${JSON.stringify(graph_attributes)}) AS ${node}_values
    `;
  };

  result = await session.run(
    `MATCH (source:Person)-[r:FRIENDS]-(target:Person),
    (source)-[:USER_ATTRIBUTES_CONSTANT]->(source_md:MetaData),
    (target)-[:USER_ATTRIBUTES_CONSTANT]->(target_md:MetaData)
    WITH source, target, source_md, target_md, ${createValues(
      `source`,
    )}, ${createValues(`target`)}
      WITH gds.alpha.graph.project(
      '${graphName}',
      source,
      target,
      {
        sourceNodeProperties: source { values: source_values },
        targetNodeProperties: target { values: target_values }
      },
      {},
      {undirectedRelationshipTypes: ['*']}
    ) as g
    RETURN g.graphName AS graph, g.nodeCount AS nodes, g.relationshipCount AS rels`,
  );

  // result = await session.run(
  //   `MATCH (source:Person)-[r:FRIENDS]-(target:Person),
  //   (source)-[:USER_ATTRIBUTES_CONSTANT]->(source_md:MetaData),
  //   (target)-[:USER_ATTRIBUTES_CONSTANT]->(target_md:MetaData)

  //   return ${createValues(`source`)},${createValues(`target`)}`,
  // );

  // result = await session.run(
  //   `CALL gds.graph.project.cypher(
  //     '${graphName}',
  //     'MATCH (p:Person)-[rel:USER_ATTRIBUTES_CONSTANT]->(n:MetaData)
  //     WITH p, n, apoc.map.fromPairs([key IN ${JSON.stringify(
  //       graph_attributes,
  //     )} |
  //       [key,
  //       CASE
  //           WHEN n[key] IS NULL THEN NaN
  //           WHEN toString(n[key]) = n[key]
  //           THEN reduce(total = 0.0, value IN apoc.text.bytes(n[key]) | total + value)
  //           ELSE toFloat(n[key])
  //       END
  //       ]
  //     ]) as attributes
  //   RETURN id(p) AS id, labels(p) AS labels, apoc.map.values(attributes, ${JSON.stringify(
  //     graph_attributes,
  //   )}) AS values',
  //     'MATCH (n)-[r:FRIENDS]->(m) RETURN id(n) AS source, id(m) AS target, type(r) AS type')
  //   YIELD
  //     graphName AS graph, nodeQuery, nodeCount AS nodes, relationshipCount AS rels`,
  // );

  // result = await session.run(
  //   `CALL gds.graph.project(
  //       '${graphName}',
  //       {
  //         Person:{
  //           properties: {}
  //         },
  //         MetaDataGraph:{
  //           properties: ${JSON.stringify(graph_attributes)}
  //         }
  //       },
  //       {
  //         FRIENDS:{orientation:'UNDIRECTED'}, USER_ATTRIBUTES_GRAPH: {}
  //       },
  //       {

  //       }
  //   );`,
  // );
  const end_time = performance.now();
  console.log(`createGraph`, end_time - start_time);

  return result;
}

export async function callAlgo() {
  // run simularity
  console.log(``);
  console.log(`--- callAlgo`);

  const query1 = `
      CALL gds.nodeSimilarity.stream('myGraph' , {})
          YIELD node1, node2, similarity
          RETURN gds.util.asNode(node1).userid
          AS User1, gds.util.asNode(node2).userid
          AS User2, similarity 
          ORDER BY similarity DESCENDING, User1, User2
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

export async function callWriteSimilar() {
  // run simularity
  console.log(``);
  console.log(`--- callWriteSimilar`);

  const query7 = `CALL gds.nodeSimilarity.write('myGraph', {
            nodeLabels: ['Person'],
            relationshipTypes: ['FRIENDS'],
            writeRelationshipType: 'SIMILAR',
            writeProperty: 'score'
        })
        YIELD nodesCompared, relationshipsWritten`;

  let start_time = performance.now();

  let result = await session.run(query7);

  const end_time = performance.now();

  console.log(`callWriteSimilar`, end_time - start_time);

  return result;
}

export async function callPriority() {
  console.log(``);
  console.log(`--- callPriority`);

  let start_time = performance.now();

  let result = await session.run(
    `
    CALL gds.articleRank.write('myGraph', {  
        scaler: "MinMax",
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS'],
        writeProperty: 'priority' 
      }
    )
    YIELD nodePropertiesWritten, ranIterations
  `,
  );

  const end_time = performance.now();

  console.log(`query`, end_time - start_time);

  return result;
}

export async function callCommunities() {
  console.log(``);
  console.log(`--- callCommunities`);

  let start_time = performance.now();

  let result = await session.run(
    `
    CALL gds.louvain.write('myGraph', 
    {  
      nodeLabels: ['Person'],
      relationshipTypes: ['FRIENDS'],
      writeProperty: 'community' 
    }
    )
  `,
  );

  const end_time = performance.now();

  console.log(`query`, end_time - start_time);

  return result;
}

export async function callNodeEmbeddings() {
  console.log(``);
  console.log(`--- callNodeEmbeddings`);

  let start_time = performance.now();

  let result = await session.run(
    `
    CALL gds.fastRP.write('myGraph', 
    {  
      nodeLabels: ['Person'],
      embeddingDimension: 16,
      writeProperty: 'embedding',
      randomSeed: 33
    }
    )
  `,
  );

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

export async function test() {
  const start_time = performance.now();

  let result;
  console.log(`running getAllReady`);
  result = await session.run(`
  CALL gds.alpha.linkprediction.adamicAdar.stream('myGraph', {
    relationshipWeightProperty: 'weight'
  })
  YIELD node1, node2, similarity

  `);
  const end_time = performance.now();
  console.log(`it took: `, end_time - start_time);
  return result;
}

export async function getFirstN() {
  const n = 100;
  const start_time = performance.now();

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

export async function getSimilar(names: Array<string>) {
  console.log();
  console.log(`running getSimilar`);

  const start_time = performance.now();
  // create myGraph

  let result;

  result = await session.run(
    `
  MATCH (a)-[rel:SIMILAR]->(b) 
  WHERE a.userId < b.userId 
  AND a.userId IN $names
  AND b.userId IN $names
  RETURN a.userId, b.userId, rel.score
  ORDER BY rel.score DESCENDING
    `,
    { names },
  );

  // result = await session.run(`
  // MATCH (n:Person)-[r:SIMILAR]->(m:Person)
  // WHERE n.name IN ["node1", "node2", "node3"]
  // AND m.name IN ["node1", "node2", "node3"]
  // RETURN n.name AS node1, m.name AS node2, r.score AS similarity
  // ORDER BY r.score DESCENDING, node1, node2
  //     `);

  const end_time = performance.now();

  console.log(`it took: `, end_time - start_time);

  return result;
}

export async function getSimilarTarget(target: string, names: Array<string>) {
  console.log();
  console.log(`running getSimilar`);

  const start_time = performance.now();
  // create myGraph

  let result;

  result = await session.run(
    `
  MATCH (a)-[rel:SIMILAR]->(b) 
  WHERE a.userId = $target
  AND b.userId IN $names
  RETURN a.userId as targetId, b.userId as otherId, rel.score as score
  ORDER BY rel.score DESCENDING
    `,
    { target, names },
  );

  const end_time = performance.now();

  console.log(`it took: `, end_time - start_time);

  return result;
}

export async function mergePerson() {
  let result;

  // result = await session.run(`
  // MERGE (:Person {socketid: 'andrew1'})
  //   `);

  const toAdd: any[] = [];

  for (let i = 0; i < 200; i++) {
    toAdd.push({ socketid: uuid() });
  }

  const start_time = performance.now();

  // const session = driver.session();

  result = await session.run(
    `UNWIND $nodes as node
      MERGE (:Person {socketid: node.socketid});
      `,
    {
      nodes: toAdd,
    },
  );

  const end_time = performance.now();
  // await session.close();

  console.log(`it took: `, end_time - start_time);

  return result;
}
