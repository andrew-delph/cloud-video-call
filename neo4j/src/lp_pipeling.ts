import { session } from './neo4j_functions';
import { printResults } from './neo4j_index';
import * as funcs from './neo4j_functions';

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
        contextRelationshipTypes: ['USER_ATTRIBUTES_CONSTANT']
      })
    `,
  );
  // printResults(result, 400);

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
  // printResults(result, 400);

  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.addNodeProperty('lp-pipeline', 'fastRP', {
        mutateProperty: 'embedding3',
        embeddingDimension: 256,
        randomSeed: 42,
        contextNodeLabels: ['Person','MetaData'],
        contextRelationshipTypes: ['FEEDBACK', 'FRIENDS','USER_ATTRIBUTES_CONSTANT']
      })
    `,
  );

  // result = await session.run(
  //   `
  //     CALL gds.beta.pipeline.linkPrediction.addFeature('lp-pipeline', 'hadamard', {
  //       nodeProperties: ['embedding1','embedding2']
  //     }) YIELD featureSteps
  //   `,
  // );

  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.addFeature('lp-pipeline', 'hadamard', {
        nodeProperties: ['embedding1','embedding2','embedding3']
      }) YIELD featureSteps
    `,
  );

  // console.log(`configureSplit disabled.`);
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
            properties: ['priority', 'community']
          }, 
          MetaData:{
            properties: ['hot']
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

  result = await session.run(
    `
    CALL gds.alpha.pipeline.linkPrediction.configureAutoTuning('lp-pipeline', {
      maxTrials: 20
    }) YIELD autoTuningConfig
  `,
  );

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
      CALL gds.beta.pipeline.linkPrediction.predict.stream('mlGraph', {
        modelName: 'lp-pipeline-model',
        topN: 1000,
        threshold: 0
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

  console.log(`query took:`, end_time - start_time);

  printResults(result, 10);
  printResults(training_result);

  return result;
}
