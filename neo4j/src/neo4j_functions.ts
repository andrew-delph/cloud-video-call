import * as neo4j from 'neo4j-driver';
import { v4 as uuid } from 'uuid';
import { printResults } from './neo4j_index';

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

  nodes.push(`andrew1`);
  nodes.push(`andrew2`);
  nodes.push(`andrew3`);
  nodes.push(`andrew4`);
  nodes.push(`andrew5`);
  nodes.push(`andrew6`);

  for (var i = 0; i < edgesNum; i++) {
    const a = nodes[Math.floor(Math.random() * nodesNum)];
    let b = nodes[Math.floor(Math.random() * nodesNum)];
    while (a === b) {
      b = nodes[Math.floor(Math.random() * nodesNum)];
    }
    edges.push({ a, b });
  }

  edges.push({ a: `andrew1`, b: `andrew2` });
  edges.push({ a: `andrew2`, b: `andrew3` });
  edges.push({ a: `andrew3`, b: `andrew4` });
  edges.push({ a: `andrew4`, b: `andrew2` });
  edges.push({ a: `andrew4`, b: `andrew5` });
  edges.push({ a: `andrew3`, b: `andrew6` });
  edges.push({ a: `andrew2`, b: `andrew3` });

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

  console.log(`create nodes ${nodesNum}`);

  await session.run(
    `UNWIND $nodes as node MERGE (:Person {name: toString(node)})`,
    { nodes: nodes },
  );

  console.log(`create edges ${edgesNum}`);

  await session.run(
    `UNWIND $edges as edge MATCH (a:Person), (b:Person) WHERE a.name = toString(edge.a) AND b.name = toString(edge.b) MERGE (a)-[:KNOWS {value: 'test'}]->(b)`,
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
  result = await session.run(
    `CALL gds.graph.project( 'myGraph', 'Person', 'FEEDBACK' ,{ relationshipProperties: ['score'] } );`,
  );
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
            writeRelationshipType: 'SIMILAR',
            writeProperty: 'score'
        })
        YIELD nodesCompared, relationshipsWritten`;

  let start_time = performance.now();

  let result = await session.run(query7);

  const end_time = performance.now();

  console.log(`query`, end_time - start_time);

  return result;
}

export async function callPriority() {
  console.log(``);
  console.log(`--- callPriority`);

  let start_time = performance.now();

  let result = await session.run(
    `
    CALL gds.pageRank.write('myGraph', {  scaler: "MinMax", writeProperty: 'priority' })
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
    CALL gds.louvain.write('myGraph', { writeProperty: 'community' })
      YIELD communityCount, modularity, modularities
  `,
  );

  const end_time = performance.now();

  console.log(`query`, end_time - start_time);

  return result;
}

export async function linkPredictionML() {
  console.log(``);
  console.log(`--- linkPredictionML`);
  let result;

  // delete pipline if it exists
  result = await session.run(
    `CALL gds.beta.pipeline.drop('lp-pipeline', False);`,
  );
  console.log(`pipeline delete successfully`);

  let start_time = performance.now();

  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.create('lp-pipeline')
  `,
  );

  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
      mutateProperty: 'embedding1',
      embeddingDimension: 256,
      randomSeed: 42,
      contextNodeLabels: ['Person','MetaData'],
      contextRelationshipTypes: ['USER_DEFINED_MD']
    })
  `,
  );
  printResults(result, 400);

  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
      mutateProperty: 'embedding2',
      embeddingDimension: 256,
      randomSeed: 42,
      contextNodeLabels: ['Person'],
      contextRelationshipTypes: ['FEEDBACK']
    })
  `,
  );
  printResults(result, 400);

  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.addFeature('lp-pipeline', 'hadamard', {
      nodeProperties: ['embedding1','embedding2']
    }) YIELD featureSteps
  `,
  );
  printResults(result, 400);

  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.configureSplit('lp-pipeline', {
      testFraction: 0.2,
      trainFraction: 0.2,
      validationFolds: 2
    })
    YIELD splitConfig
  `,
  );
  printResults(result, 400);

  // result = await session.run(
  //   `
  //   CALL gds.alpha.pipeline.linkPrediction.configureAutoTuning('lp-pipeline', {
  //     maxTrials: 10
  //   }) YIELD autoTuningConfig
  // `,
  // );

  result = await session.run(
    `
    CALL gds.alpha.pipeline.linkPrediction.addRandomForest('lp-pipeline', {})
      YIELD parameterSpace
  `,
  );

  // result = await session.run(
  //   `
  //   CALL gds.beta.pipeline.linkPrediction.addLogisticRegression('lp-pipeline')
  //     YIELD parameterSpace
  // `,
  // );

  // result = await session.run(
  //   `
  //   CALL gds.alpha.pipeline.linkPrediction.addMLP('lp-pipeline',
  //     {hiddenLayerSizes: [4, 2], penalty: 0.5, patience: 2, classWeights: [0.55, 0.45], focusWeight: {range: [0.0, 0.1]}})
  //     YIELD parameterSpace
  // `,
  // );

  // result = await session.run(
  //   `
  //   CALL gds.beta.pipeline.linkPrediction.addLogisticRegression('lp-pipeline', {maxEpochs: 500, penalty: {range: [1e-4, 1e2]}})
  //     YIELD parameterSpace
  //     RETURN parameterSpace.RandomForest AS randomForestSpace, parameterSpace.LogisticRegression AS logisticRegressionSpace, parameterSpace.MultilayerPerceptron AS MultilayerPerceptronSpace
  // `,
  // );

  result = await session.run(
    `
    MATCH (a)-[r1:FEEDBACK]->(b), (a)<-[r2:FEEDBACK]-(b)
    WHERE r1.score > 4 AND r2.score > 4
    MERGE (a)-[:FRIENDS]-(b)
`,
  );

  try {
    result = await session.run(`CALL gds.graph.drop('myGraph');`);
    console.log(`graph delete successfully`);
  } catch (e) {
    console.log(`graph doesn't exist`);
  }

  result = await session.run(
    `CALL gds.graph.project( 'myGraph', {Person:{}, MetaData:{}}, {FRIENDS:{orientation:'UNDIRECTED'}, FEEDBACK:{}, USER_DEFINED_MD: {}}, {relationshipProperties: ['score'] });`,
  );

  result = await session.run(
    `CALL gds.beta.model.drop('lp-pipeline-model', False)
    YIELD modelInfo, loaded, shared, stored
    RETURN modelInfo.modelName AS modelName, loaded, shared, stored`,
  );

  console.log(`Training`);
  const training_result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.train('myGraph', {
      pipeline: 'lp-pipeline',
      modelName: 'lp-pipeline-model',
      metrics: ['AUCPR'],
      targetRelationshipType: 'FRIENDS'
    }) YIELD modelInfo, modelSelectionStats
    RETURN
      modelInfo.bestParameters AS winningModel,
      modelInfo.metrics.AUCPR.train.avg AS avgTrainScore,
      modelInfo.metrics.AUCPR.outerTrain AS outerTrainScore,
      modelInfo.metrics.AUCPR.test AS testScore,
      [cand IN modelSelectionStats.modelCandidates | cand.metrics.AUCPR.validation.avg] AS validationScores
  `,
  );

  console.log(`predicting`);
  result = await session.run(
    `
    CALL gds.beta.pipeline.linkPrediction.predict.stream('myGraph', {
      modelName: 'lp-pipeline-model',
      topN: 100,
      threshold: 0
    })
     YIELD node1, node2, probability
     WITH gds.util.asNode(node1) AS person1, gds.util.asNode(node2) AS person2, probability
     MATCH (person1)-[r1:USER_DEFINED_MD]-(md1:MetaData), (person2)-[r2:USER_DEFINED_MD]-(md2:MetaData) OPTIONAL MATCH (person1)-[f:FRIENDS]-(person2)
     RETURN person1.userId,  person2.userId, probability, md1.gender as gender1, md2.gender as gender2, md1.hot as other
     ORDER BY probability DESC
    `,
  );

  const end_time = performance.now();

  console.log(`query took:`, end_time - start_time);

  printResults(result, 10);
  printResults(training_result);

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
  // create myGraph
  let result;
  console.log(`running getAllReady`);
  result = await session.run(`
    MATCH (n:Person) return n.priority as priority
  `);
  const end_time = performance.now();
  console.log(`it took: `, end_time - start_time);
  return result;
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
