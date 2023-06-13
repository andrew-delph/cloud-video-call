import { createDotGraph, createRidgeLineChart } from './chart';
import { printResults } from './neo4j_index';
import { Person, getPerson, indexToColor } from './person';
import async from 'async';
import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';

const maxRetryTimeMs = 15 * 1000;

export let driver: neo4j.Driver;
export let session: neo4j.Session;

export function setDriver(host: string) {
  console.log(`setting driver`, host);
  driver = neo4j.driver(host, neo4j.auth.basic(`neo4j`, `password`), {
    disableLosslessIntegers: true,
    maxTransactionRetryTime: maxRetryTimeMs,
  });
  session = driver.session();
}

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

export async function run(
  query: string,
  params: any = {},
  slice = 60,
): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- run`);
  console.log(`"""${query.slice(0, slice).replace(/\s+/g, ` `).trim()}"""`);

  const start_time = performance.now();

  let result;

  result = await session.run(query, params);

  const end_time = performance.now();

  console.log(`run`, end_time - start_time);
  console.log();

  return result;
}

export async function createData({
  nodesNum = 100,
  edgesNum = 7,
  deleteData = false,
}): Promise<void> {
  console.log(``);
  console.log(`--- createData`);
  const full_start_time = performance.now();
  let start_time = full_start_time;

  if (deleteData) {
    console.log(`deleting data`);
    await session.run(`
    MATCH (n)
    CALL {
      WITH n
      DETACH DELETE n
    } IN TRANSACTIONS OF 10 ROWS
    `);
    console.log(`Deletion time:`, performance.now() - start_time);
  }

  const nodes = [];
  const edges = [];

  for (var i = 0; i < nodesNum; i++) {
    const person = getPerson(`${i}`);
    // console.log(`person.type`, person.type.valueOf());
    nodes.push(person);
  }

  edgesNum = nodesNum * edgesNum;
  for (var i = 0; i < edgesNum; i++) {
    const a = i % nodesNum;
    let b = Math.floor(Math.random() * nodesNum);
    while (a === b) {
      b = Math.floor(Math.random() * nodesNum);
    }
    edges.push({ a: nodes[a], b: nodes[b] });
  }

  start_time = performance.now();
  // await async.eachLimit(nodes, limit, async (node, callback) => {
  //   await node.createNode();
  //   callback();
  // });
  for (const node of nodes) {
    await node.createNode();
  }

  console.log(
    `create nodes num:${nodes.length} time:`,
    performance.now() - start_time,
  );

  start_time = performance.now();
  // await async.eachLimit(edges, limit, async (edge, callback) => {
  //   await edge.a.createFeedback(edge.b);
  //   await edge.b.createFeedback(edge.a);
  //   callback();
  // });

  for (const edge of edges) {
    await edge.a.createFeedback(edge.b);
    await edge.b.createFeedback(edge.a);
  }

  console.log(
    `create edges num:${edges.length} time:`,
    performance.now() - start_time,
  );

  const end_time = performance.now();

  console.log(`createData`, performance.now() - full_start_time);
}

export async function getUsers(): Promise<neo4j.QueryResult> {
  console.log();
  console.log(`running getUsers`);

  const start_time = performance.now();

  let result;

  result = await session.run(
    `
    MATCH (a:Person)-[rel2:USER_ATTRIBUTES_CONSTANT]->(b:MetaData)
    RETURN a.community, a.priority, a.type, a.embedding, a.typeIndex
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

  const community_data: {
    x: number;
    y: number;
    dotColor?: string;
  }[] = [];

  result.records.forEach((record) => {
    const x = parseFloat(record.get(`a.typeIndex`));
    const y = parseFloat(record.get(`a.community`));
    const dotColor = indexToColor[x];
    community_data.push({ x, y, dotColor });
  });

  createDotGraph(community_data, `community`);

  const priority_data: {
    x: number;
    y: number;
    dotColor?: string;
  }[] = [];

  result.records.forEach((record) => {
    const x = parseFloat(record.get(`a.typeIndex`));
    const y = parseFloat(record.get(`a.priority`));
    const dotColor = indexToColor[x];
    priority_data.push({ x, y, dotColor });
  });

  createDotGraph(priority_data, `priority`);

  return result;
}

export async function compareTypes(
  type1: string = ``,
  type2: string = ``,
  md1: string = ``,
  md2: string = ``,
): Promise<neo4j.QueryResult> {
  const limit = 50;
  console.log();
  console.log(`Running compareTypes type1="${type1}" type2="${type2}"`);

  if (type1) {
    type1 = `{type:'${type1}'}`;
  }

  if (type2) {
    type2 = `{type:'${type2}'}`;
  }

  const start_time = performance.now();

  let result;

  result = await session.run(
    `
    MATCH (n1:Person${type1})-[:USER_ATTRIBUTES_CONSTANT]->(md1:MetaData${md1})
    MATCH (n2:Person${type2})-[:USER_ATTRIBUTES_CONSTANT]->(md2:MetaData${md2})
    OPTIONAL MATCH (n1)-[prel:PREDICTION]->(n2)
    OPTIONAL MATCH (n1)-[srel:SIMILAR]->(n2)
    OPTIONAL MATCH (n1)-[drel:DISTANCE]->(n2)
    OPTIONAL MATCH (n1)-[:FRIENDS]-()-[:FRIENDS]-()-[:FRIENDS]-(n2)
    WITH n1, n2, prel, srel, drel,md1,md2, count(*) as num_friends
    where n1 <> n2 //coalesce(prel.probability,0) > 0.4
    return 
    num_friends,
    coalesce(md1.gender, n1.type) as t1, 
    coalesce(md2.gender, n2.type) as t2,
    coalesce(prel.probability,0) as prob, 
    EXISTS((n1)-[:FRIENDS]->(n2)) as friends, 
    round(coalesce(srel.score,0),3) as sim, 
    round(n2.priority,3) as p2
    ORDER BY num_friends DESC, prob DESC, p2 DESC
    LIMIT ${limit}
  `,
  );

  const end_time = performance.now();

  console.log(`compareTypes`, end_time - start_time);

  const predictLine: {
    [key: string]: {
      values: number[];
      colour?: string;
    };
  } = {};

  const length = result.records.length;

  result.records.slice(0, -1).forEach((record, index) => {
    const value = length - index;
    const type1 = record.get(`t1`);
    const type2 = record.get(`t2`);
    let key = type1 > type2 ? `${type1}-${type2}` : `${type2}-${type1}`;
    key = `${type1}-${type2}`;

    if (!predictLine[key]) {
      predictLine[key] = {
        values: [],
        colour: key == `3` ? `blue` : `red`,
      };
    }
    const values = predictLine[key];
    values.values.push(value);
  });

  await createRidgeLineChart(predictLine, `predict-line-all`);

  return result;
}

export async function getVarience(): Promise<neo4j.QueryResult> {
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

export async function readGraph(
  graphName: string = `myGraph`,
  value: string = `values`,
): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- readGraph`);

  const start_time = performance.now();

  let result;

  result = await session.run(
    `
    CALL gds.graph.nodeProperty.stream('${graphName}', '${value}')
      YIELD nodeId, propertyValue
      WITH propertyValue, gds.util.asNode(nodeId) as p
      MATCH (p)-[rel2:USER_ATTRIBUTES_CONSTANT]->(b:MetaData)
      return propertyValue as ${value}, p.type
  `,
  );

  const end_time = performance.now();

  console.log(`readGraph`, end_time - start_time);

  return result;
}

export async function createFriends(
  deleteFriends: boolean = true,
): Promise<neo4j.QueryResult> {
  let start_time = performance.now();
  let result;
  // delete friends
  if (deleteFriends) {
    console.log(``);
    console.log(`--- deleteFriends`);
    result = await session.run(
      `
      MATCH (:Person)-[f:FRIENDS]-(:Person)
      CALL {
        WITH f
        DELETE f
      } IN TRANSACTIONS
      return f
    `,
    );

    console.log(`deleted friends: ${result.records.length}`);
    console.log(`deleteFriends`, performance.now() - start_time);
    start_time = performance.now();
  }

  console.log(``);
  console.log(`--- createFriends`);

  // create friends
  result = await session.run(
    `
      MATCH (a)-[r1:FEEDBACK]->(b), (a)<-[r2:FEEDBACK]-(b)
      WHERE r1.score > 0 AND r2.score > 0 AND id(a) > id(b)
      MERGE (a)-[f1:FRIENDS]-(b)
      MERGE (b)-[f2:FRIENDS]-(a)
      RETURN f1, f2
  `,
  );
  console.log(`created friends: ${result.records.length}`);
  console.log(`createFriends`, performance.now() - start_time);
  start_time = performance.now();
  result = await session.run(
    `
      MATCH (a)-[r1:FEEDBACK]->(b), (a)<-[r2:FEEDBACK]-(b)
      WHERE r1.score < 0 OR r2.score < 0 AND id(a) > id(b)
      MERGE (a)-[n1:NEGATIVE]-(b)
      MERGE (b)-[n2:NEGATIVE]-(a)
      RETURN n1, n2
  `,
  );
  console.log(`created negative: ${result.records.length}`);
  console.log(`createNegative`, performance.now() - start_time);

  return result;
}

const collapseFriends = async () => {
  let results = await run(
    `
    CALL apoc.periodic.iterate(
      "
        MATCH(a:Person)-[:FRIENDS]-(b:Person)-[:FRIENDS]-(c:Person)
        OPTIONAL MATCH (c)-[:FRIENDS]-(d:Person)
        WHERE a.userId <> b.userId AND a.userId <> c.userId AND a.userId <> d.userId
        AND b.userId <> c.userId AND b.userId <> d.userId
        AND c.userId <> d.userId
        return a, b, c, d
      ",
      "
        MERGE(a)-[:CLOSE_FRIENDS{degree:1}]-(c)
        WITH a,d
        CALL apoc.do.when(
          d IS NOT NULL,
          'MERGE (a)-[r:CLOSE_FRIENDS{degree:2}]-(d) return 1 as r',
          'return 1 as r',
          {d:d}
        ) YIELD value
        return 1
      ",
        {batchSize:10, parallel:false}
      )
    `,
    {},
  );

  return results;
};

export async function createAttributeFloat(): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- createAttributeFloat`);
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

export async function getAttributeKeys(userList: string[] = []) {
  console.log(``);
  console.log(`--- getAttributeKeys`);
  let start_time = performance.now();
  let result;

  let whereString = ``;
  if (userList.length > 0) {
    whereString = `WHERE p.userId IN 
    ${JSON.stringify(userList)}`;

    console.log(`whereString  for ${userList.length}`);
  }

  result = await session.run(
    `MATCH (p:Person)-[rel:USER_ATTRIBUTES_CONSTANT]->(n:MetaData)
    ${whereString}
    WITH DISTINCT keys(n) as keyList
    UNWIND keyList as individualKeys
    WITH DISTINCT individualKeys as uniqueKeys
    RETURN collect(uniqueKeys) as attributes
    `,
  );

  console.log(`getAttributeKeys`, performance.now() - start_time);

  return result.records[0].get(`attributes`);
}

export async function getFriends(): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- getFriends`);
  let start_time = performance.now();
  let result;

  result = await session.run(
    `
      MATCH (a:Person)-[r:FRIENDS]->(b:Person)
      return a.userId, b.userId
  `,
  );

  console.log(`getFriends`, performance.now() - start_time);

  return result;
}

export async function createGraph(
  graphName: string = `myGraph`,
  node_attributes: string[] = [],
  userList: string[] = [],
  strictWhere = false,
): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(
    `--- createGraph ${graphName} node_attributes = ${node_attributes}`,
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
        node_attributes,
      )} |
        [key,
        CASE
            WHEN ${node}_md[key] IS NULL THEN 0.0
            WHEN toString(${node}_md[key]) = ${node}_md[key]
            THEN reduce(total = 0.0, value IN apoc.text.bytes(${node}_md[key]) | total + value)
            ELSE toFloat(${node}_md[key])
        END
        ]
      ]), ${JSON.stringify(node_attributes)})
    `;
  };

  const getExtraNodeProperties = (node: string) => {
    let extra_node_properties = ``;
    // extra_node_properties += `, priority: coalesce(${node}.priority, -1)`;
    // extra_node_properties += `, typeIndex: coalesce(${node}.typeIndex, -1)`;

    return extra_node_properties;
  };

  let whereString = ``;
  if (userList.length > 0) {
    whereString = `WHERE source.userId IN 
      ${JSON.stringify(userList)} ${strictWhere ? `AND` : `OR`}
      target.userId IN ${JSON.stringify(userList)}
    `;

    console.log(`whereString  for ${userList.length}`);
  }
  const q_select = `
    MATCH (source:Person),
      (source:Person)-[r:FRIENDS|FEEDBACK|NEGATIVE]->(target:Person)
    OPTIONAL MATCH (source)-[:USER_ATTRIBUTES_CONSTANT]->(source_md:MetaData),
      (target)-[:USER_ATTRIBUTES_CONSTANT]->(target_md:MetaData)
    WITH source, target, r,
      ${createValues(`source`)} AS source_values,
      ${createValues(`target`)} AS target_values
    ${whereString}
  `;

  const q_graph = `
    ${q_select}
    WITH gds.alpha.graph.project(
    '${graphName}',
    source,
    target,
    {
      sourceNodeLabels: 'Person',
      targetNodeLabels: 'Person',
      sourceNodeProperties: source {
          // priority: coalesce(source.priority, 0),
          // community: coalesce(source.community, 0),
          values: source_values 
          ${getExtraNodeProperties(`source`)}
        },
      targetNodeProperties: target {
          // priority: coalesce(target.priority, 0),
          // community: coalesce(target.community, 0),
          values: target_values 
          ${getExtraNodeProperties(`target`)}
        }
    },
    {
      relationshipType: type(r),
      properties: r { .score }
    },
    {undirectedRelationshipTypes: ['FRIENDS','NEGATIVE']}
  ) as g
  RETURN g.graphName AS graph, g.nodeCount AS nodes, g.relationshipCount AS rels`;

  // console.log(q);

  result = await session.run(q_graph);

  if (result.records.length < 1 || result.records[0].get(`graph`) == null) {
    throw Error(`graph not created`);
  }

  // result = await run(
  //   `${q_select} return source.userId, target.userId`,
  //   {},
  //   9999,
  // );

  const end_time = performance.now();
  console.log(`createGraph`, end_time - start_time);

  return result;
}

export async function callAlgo(): Promise<neo4j.QueryResult> {
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

export async function callShortestPath(): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- callShortestPath`);

  let start_time = performance.now();

  let result = await session.run(
    `
    CALL gds.alpha.allShortestPaths.stream('myGraph', {
      relationshipTypes: ['FRIENDS']
    })
      YIELD sourceNodeId, targetNodeId, distance
      WITH sourceNodeId, targetNodeId, distance
      WHERE gds.util.isFinite(distance) = true
      
      MATCH (source) WHERE id(source) = sourceNodeId
      MATCH (target) WHERE id(target) = targetNodeId
      WITH source, target, distance WHERE source <> target

      MERGE (source)-[:DISTANCE{distance:distance}]->(target)
      
      RETURN source.type AS source, target.type AS target, distance
      ORDER BY distance DESC
  `,
  );

  const end_time = performance.now();

  console.log(`callShortestPath`, end_time - start_time);

  return result;
}

export async function callWriteSimilar(): Promise<neo4j.QueryResult> {
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

export async function callPriority(): Promise<neo4j.QueryResult> {
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

  console.log(`callPriority`, end_time - start_time);

  return result;
}

export async function callCommunities(): Promise<neo4j.QueryResult> {
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

  console.log(`callCommunities`, end_time - start_time);

  return result;
}

export async function callNodeEmbeddings(): Promise<neo4j.QueryResult> {
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

  console.log(`callNodeEmbeddings`, end_time - start_time);

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

export async function test(): Promise<neo4j.QueryResult> {
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

export async function getFirstN(): Promise<neo4j.QueryResult> {
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

export async function getSimilar(
  names: Array<string>,
): Promise<neo4j.QueryResult> {
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

export async function getSimilarTarget(
  target: string,
  names: Array<string>,
): Promise<neo4j.QueryResult> {
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

export async function mergePerson(): Promise<neo4j.QueryResult> {
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
