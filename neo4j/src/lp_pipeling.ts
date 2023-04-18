import { session } from './neo4j_functions';
import { printResults } from './neo4j_index';
import * as funcs from './neo4j_functions';

export async function createPipeline() {
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
        contextRelationshipTypes: ['USER_ATTRIBUTES_CONSTANT']
      })
    `,
  );
  // printResults(result, 400);

  // result = await session.run(
  //   `
  //     CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
  //       mutateProperty: 'embedding2',
  //       embeddingDimension: 256,
  //       randomSeed: 42,
  //       contextNodeLabels: ['Person'],
  //       contextRelationshipTypes: ['FEEDBACK']
  //     })
  //   `,
  // );

  // result = await session.run(
  //   `
  //     CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
  //       mutateProperty: 'embedding2',
  //       embeddingDimension: 256,
  //       randomSeed: 42,
  //       contextNodeLabels: ['Person'],
  //       contextRelationshipTypes: ['FEEDBACK']
  //     })
  //   `,
  // );

  // result = await session.run(
  //   `
  //     CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
  //       mutateProperty: 'embedding3',
  //       embeddingDimension: 256,
  //       randomSeed: 42,
  //       contextNodeLabels: ['Person','MetaData'],
  //       contextRelationshipTypes: ['FEEDBACK', 'FRIENDS','USER_ATTRIBUTES_CONSTANT']
  //     })
  //   `,
  // );

  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.addFeature('lp-pipeline', 'COSINE', {
        nodeProperties: ['hot']
      }) YIELD featureSteps
    `,
  );

  // console.log(`configureSplit disabled.`);
  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.configureSplit('lp-pipeline', {
        testFraction: 0.25,
        trainFraction: 0.6,
        validationFolds: 3
      })
      YIELD splitConfig
    `,
  );
  // printResults(result, 400);

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

  // result = await session.run(
  //   `
  //   CALL gds.alpha.pipeline.linkPrediction.configureAutoTuning('lp-pipeline', {
  //     maxTrials: 20
  //   }) YIELD autoTuningConfig
  // `,
  // );

  return result;
}

export async function createMLGraph() {
  console.log(``);
  console.log(`--- createMLGraph`);
  let start_time = performance.now();
  let result;

  try {
    result = await session.run(`CALL gds.graph.drop('mlGraph');`);
    console.log(`graph delete successfully`);
  } catch (e) {
    console.log(`graph doesn't exist`);
  }

  result = await session.run(
    `CALL gds.graph.project( 
        'mlGraph', 
        {
          Person:{
            properties: {hot: {defaultValue: 0}, priority: {priority: 0.0}, community: {defaultValue: 0.0}}
          }, 
          MetaData:{
            properties: {hot: {defaultValue: 0}}
          }
        }, 
        {
          FRIENDS:{orientation:'UNDIRECTED'}, FEEDBACK:{}, USER_ATTRIBUTES_CONSTANT: {}
        },
        {
          relationshipProperties: ['score'] 
        }
    );`,
  );

  return result;
}

export async function train() {
  console.log(``);
  console.log(`--- train`);
  let start_time = performance.now();
  let result;
  result = await session.run(
    `CALL gds.beta.model.drop('lp-pipeline-model', False)
      YIELD modelInfo, loaded, shared, stored
      RETURN modelInfo.modelName AS modelName, loaded, shared, stored`,
  );

  console.log(`Training`);
  const training_result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.train('mlGraph', {
        pipeline: 'lp-pipeline',
        modelName: 'lp-pipeline-model',
        metrics: ['AUCPR'],
        sourceNodeLabel: 'Person',
        targetNodeLabel: 'Person',
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

  return result;
}

export async function predict() {
  console.log(``);
  console.log(`--- predict`);
  let start_time = performance.now();
  let result;
  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.predict.stream('mlGraph', {
        modelName: 'lp-pipeline-model',
        topN: 5000,
        threshold: 0.5
      })
        YIELD node1, node2, probability
        WITH gds.util.asNode(node1) AS person1, gds.util.asNode(node2) AS person2, probability
        MATCH (person1:Person)-[r1:USER_ATTRIBUTES_CONSTANT]->(md1:MetaData), 
          (person2:Person)-[r2:USER_ATTRIBUTES_CONSTANT]->(md2:MetaData) 
        OPTIONAL MATCH (person1)-[f:FRIENDS]-(person2)
        RETURN person1.userId,  person2.userId, probability, md1.hot, md2.hot,
            abs(toInteger(md1.hot) - toInteger(md2.hot)) as abs 
        ORDER BY probability DESC
      `,
  );

  const end_time = performance.now();

  const data: {
    x: number;
    y: number;
  }[] = [];

  const records = result.records;
  records.slice(0, -1).forEach((record) => {
    const x = parseFloat(record.get(`probability`));
    const y = parseFloat(record.get(`abs`));
    data.push({ x, y });
  });

  funcs.createDotGraph(data, `link-prediction`);

  console.log(`predict:`, end_time - start_time);

  printResults(result, 50);

  return result;
}
