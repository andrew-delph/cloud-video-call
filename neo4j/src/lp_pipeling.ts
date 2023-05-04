import { session } from './neo4j_functions';
import { printResults } from './neo4j_index';
import * as funcs from './neo4j_functions';
import { createDotGraph, createRidgeLineChart } from './chart';
import * as neo4j from 'neo4j-driver';

export async function createPipeline(): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- createPipeline`);
  let result;
  let start_time = performance.now();

  // delete pipline if it exists
  result = await session.run(
    `CALL gds.beta.pipeline.drop('lp-pipeline', False);`,
  );
  console.log(`pipeline delete successfully`);

  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.create('lp-pipeline')
    `,
  );

  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.addNodeProperty(
        'lp-pipeline', 
        'fastRP', 
        {
          mutateProperty: 'embedding1',
          embeddingDimension: 256,
          randomSeed: 42,
          contextNodeLabels: ['Person'],
          contextRelationshipTypes: ['FRIENDS', 'NEGATIVE']
        }
      )
    `,
  );
  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.addFeature('lp-pipeline', 'COSINE', {
        nodeProperties: [ 'embedding1', 'values', 'priority']
      }) YIELD featureSteps
    `,
  );

  // console.log(`configureSplit disabled.`);
  // result = await session.run(
  //   `
  //     CALL gds.beta.pipeline.linkPrediction.configureSplit('lp-pipeline', {
  //       testFraction: 0.25,
  //       trainFraction: 0.6,
  //       validationFolds: 3,
  //       negativeSamplingRatio: 0.1,
  //       negativeRelationshipType: 'NEGATIVE'
  //     })
  //     YIELD splitConfig
  //   `,
  // );
  // printResults(result, 400);

  result = await session.run(
    `
      CALL gds.alpha.pipeline.linkPrediction.addRandomForest('lp-pipeline', {})
        YIELD parameterSpace
    `,
  );

  // result = await session.run(
  //   `
  //   CALL gds.alpha.pipeline.linkPrediction.configureAutoTuning('lp-pipeline', {
  //     maxTrials: 20
  //   }) YIELD autoTuningConfig
  // `,
  // );

  console.log(`createPipeline:`, performance.now() - start_time);

  return result;
}

export async function train(
  graphName: string = `myGraph`,
): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- train`);
  let start_time = performance.now();
  let result;
  result = await session.run(
    `CALL gds.beta.model.drop('lp-pipeline-model', False)
      YIELD modelInfo, loaded, shared, stored
      RETURN modelInfo.modelName AS modelName, loaded, shared, stored`,
  );

  const training_result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.train('${graphName}', {
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

  return training_result;
}

export async function predict(
  merge: boolean = false,
  graphName: string = `myGraph`,
): Promise<neo4j.QueryResult> {
  console.log(``);
  console.log(`--- predict`);
  let start_time = performance.now();
  let result;
  result = await session.run(
    `
      CALL gds.beta.pipeline.linkPrediction.predict.stream('${graphName}', {
        modelName: 'lp-pipeline-model',
        topN: 5000,
        threshold: 0
      })
        YIELD node1, node2, probability
        WITH gds.util.asNode(node1) AS person1, gds.util.asNode(node2) AS person2, probability
        ${
          merge
            ? `MERGE (person1)-[:PREDICTION{probability:probability}]->(person2)`
            : ``
        }
        WITH person1, person2, probability
        OPTIONAL MATCH (person1:Person)-[r1:USER_ATTRIBUTES_CONSTANT]->(md1:MetaData), 
          (person2:Person)-[r2:USER_ATTRIBUTES_CONSTANT]->(md2:MetaData) 
        OPTIONAL MATCH (person1:Person)-[]->(g1:MetaDataGraph), 
          (person2:Person)-[]->(g2:MetaDataGraph) 
        OPTIONAL MATCH (person1)-[f:FRIENDS]-(person2)
        RETURN (person1.userId+"-"+person2.userId) as nodes, probability,
        person1.type, person2.type,
        person1.userId, person2.userId
        ORDER BY probability DESC
      `,
  );

  console.log(`predicitons made: `, result.records.length);
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
    const type1 = record.get(`person1.type`);
    const type2 = record.get(`person2.type`);
    let key = type1 > type2 ? `${type1}-${type2}` : `${type2}-${type1}`;
    key = `${type1}-${type2}`;

    if (!predictLine[key]) {
      predictLine[key] = {
        values: [],
        colour: key == `3` ? `blue` : `red`,
      };
    }
    const values = predictLine[key];
    values.values.push(probability);
  });

  // printResults(result, 100);

  await createRidgeLineChart(predictLine, `predict-line`);

  // const predictDot: {
  //   x: number;
  //   y: number;
  // }[] = [];

  // result.records.forEach((record) => {
  //   const type1 = parseInt(record.get(`md1.type`));
  //   const type2 = parseInt(record.get(`md2.type`));
  //   const y = Math.abs(type1 - type2);
  //   const x = parseFloat(record.get(`probability`));
  //   predictDot.push({ x, y });
  // });

  // createDotGraph(predictDot, `predict-dot`);

  return result;
}
