import { session } from './neo4j_functions';
import { printResults } from './neo4j_index';
import * as funcs from './neo4j_functions';
import { createDotGraph, createRidgeLineChart } from './chart';
import { QueryResult } from 'neo4j-driver-core/types/result';

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
        contextNodeLabels: ['Person','MetaDataGraph'],
        contextRelationshipTypes: ['USER_ATTRIBUTES_GRAPH']
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
        nodeProperties: ['priority']
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
  const end_time = performance.now();
  console.log(`createPipeline:`, end_time - start_time);

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
  const end_time = performance.now();
  console.log(`train:`, end_time - start_time);

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
        threshold: 0
      })
        YIELD node1, node2, probability
        WITH gds.util.asNode(node1) AS person1, gds.util.asNode(node2) AS person2, probability
        MATCH (person1:Person)-[r1:USER_ATTRIBUTES_CONSTANT]->(md1:MetaData), 
          (person2:Person)-[r2:USER_ATTRIBUTES_CONSTANT]->(md2:MetaData) 
        MATCH (person1:Person)-[]->(g1:MetaDataGraph), 
          (person2:Person)-[]->(g2:MetaDataGraph) 
        OPTIONAL MATCH (person1)-[f:FRIENDS]-(person2)
        RETURN (person1.userId+"-"+person2.userId) as nodes, probability,
        md1.type, md2.type
        ORDER BY probability DESC
      `,
  );

  const end_time = performance.now();
  console.log(`predict:`, end_time - start_time);

  const predictLine: {
    [key: string]: {
      values: number[];
      colour?: string;
    };
  } = {};

  result.records.slice(0, -1).forEach((record) => {
    const probability = parseFloat(record.get(`probability`));
    const type1 = record.get(`md1.type`);
    const type2 = record.get(`md2.type`);
    let key = type1 > type2 ? `${type1}-${type2}` : `${type2}-${type1}`;

    if (!predictLine[key]) {
      predictLine[key] = {
        values: [1],
        colour: key == `3` ? `blue` : `red`,
      };
    }
    const values = predictLine[key];
    values.values.push(probability);
  });

  printResults(result, 100);

  await createRidgeLineChart(predictLine, `predict-line`);

  const predictDot: {
    x: number;
    y: number;
  }[] = [];

  result.records.forEach((record) => {
    const type1 = parseInt(record.get(`md1.type`));
    const type2 = parseInt(record.get(`md2.type`));
    const y = Math.abs(type1 - type2);
    const x = parseFloat(record.get(`probability`));
    predictDot.push({ x, y });
  });

  createDotGraph(predictDot, `predict-dot`);

  return result;
}
