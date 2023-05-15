import { printResults } from './neo4j_index';
import {
  userFunctions,
  createFemale,
  createMale,
  createGroupA,
  createGroupB,
  validFriends,
  createRandom,
  userdIdToType,
} from './person';

import * as funcs from './neo4j_functions';
import * as neo4j from 'neo4j-driver';

let results: neo4j.QueryResult;

const calcAvg = (
  result: neo4j.QueryResult,
  topLimit: number = 0,
  cosineSimilarityThreshhold: number = 0,
) => {
  let records = result.records;

  if (topLimit > 0) {
    records = records.slice(0, topLimit);
  }

  let length = 0;
  let total = 0;

  for (let record of records) {
    const ntype = userdIdToType(record.get(`m.userId`));
    const mtype = userdIdToType(record.get(`n.userId`));
    // const ntype = record.get(`m.type`);
    // const mtype = record.get(`n.type`);
    const cosineSimilarity = record.get(`cosineSimilarity`);

    if (cosineSimilarity <= cosineSimilarityThreshhold) {
      break;
    }

    if (validFriends(ntype, mtype)) total += 1;
    length += 1;
  }

  return total / length;
};

function cleanPerm(perm: number[]): number[] {
  if (perm.length > 1 && perm[perm.length - 1] == 0) {
    return cleanPerm(perm.slice(0, perm.length - 1));
  }
  return perm;
}
function generatePermutations(values: number[], length: number): number[][] {
  const permutationsSet = new Set<string>();

  function generateHelper(current: number[]) {
    if (current.length === length) {
      permutationsSet.add(JSON.stringify(cleanPerm(current)));
      return;
    }

    for (let i = 0; i < values.length; i++) {
      generateHelper([...current, values[i]]);
    }
  }

  generateHelper([]);

  return Array.from(permutationsSet).map((val) => JSON.parse(val));
}

export const nodeembeddings = async (
  permutations: any = false,
  createData: boolean = false,
) => {
  userFunctions.length = 0;

  userFunctions.push(createFemale);
  userFunctions.push(createMale);
  userFunctions.push(createGroupA);
  userFunctions.push(createGroupB);
  userFunctions.push(createRandom);

  if (createData) {
    await funcs.createData({
      deleteData: true,
      nodesNum: 200,
      edgesNum: 20,
    });
    results = await funcs.createFriends();
  }

  const test_attributes: string[] = await funcs.getAttributeKeys();
  results = await funcs.createGraph(`myGraph`, test_attributes);

  if (permutations == false) {
    permutations = generatePermutations([0, 1, 0.5], 3);
  }
  console.log(`permutations: ${JSON.stringify(permutations)}`);

  results = await funcs.run(
    `
    CALL gds.articleRank.mutate('myGraph', 
      {  
        scaler: "MinMax",
        nodeLabels: ['Person'],
        relationshipTypes: ['FEEDBACK'],
        relationshipWeightProperty: 'score',
        mutateProperty: 'priority' 
      }
    )
    YIELD nodePropertiesWritten, ranIterations
  `,
  );

  results = await funcs.run(
    `
    CALL gds.louvain.mutate('myGraph', 
    {  
      nodeLabels: ['Person'],
      // relationshipTypes: ['FRIENDS'],
      relationshipTypes: ['FEEDBACK'],
      relationshipWeightProperty: 'score',
      mutateProperty: 'community' 
    }
    )
  `,
  );

  const resultList: any[] = [];

  for (let nodeSelfInfluence of [0, 1, 0.5]) {
    for (let propertyRatio of [0, 1, 0.5]) {
      for (let perm of permutations) {
        resultList.push(
          await generateEmbedding(perm, propertyRatio, nodeSelfInfluence),
        );
      }
    }
  }

  resultList.sort((item1, item2) => {
    if (item1.avg != item2.avg) {
      return item1.avg - item2.avg;
    }
    return item1.avg * item1.length - item2.avg * item2.length;
  });

  const winner = resultList[resultList.length - 1].perm;

  console.log();
  console.log(`printing winner`);

  await generateEmbedding(
    winner,
    winner.propertyRatio,
    winner.nodeSelfInfluence,
  );

  console.log();
  // for (let result of resultList) {
  //   console.log(
  //     `avg=${result.avg.toFixed(2)}\t perm=${JSON.stringify(
  //       result.perm,
  //     )}\t pr=${result.propertyRatio}\t nsi=${
  //       result.nodeSelfInfluence
  //     }\t leng=${result.length}\t s=${(result.avg * result.length).toFixed(
  //       2,
  //     )} `,
  //   );
  // }
  console.table(resultList.filter((item) => item.avg >= 0.5));
  console.log(`permutations.length: ${permutations.length}`);

  return resultList;
};

const generateEmbedding = async (
  perm: number[],
  propertyRatio: number = 0,
  nodeSelfInfluence: number = 1,
) => {
  console.log(`perm: ${JSON.stringify(perm)}`);

  results = await funcs.run(
    `
        MATCH (n)
        REMOVE n.embedding
        `,
  );

  results = await funcs.run(
    `
      CALL gds.fastRP.write('myGraph',
      {
        nodeLabels: ['Person'],
        relationshipTypes: ['FEEDBACK'],
        relationshipWeightProperty: 'score',
        featureProperties: ['values','priority','community'],
        propertyRatio: ${propertyRatio},
        nodeSelfInfluence: ${nodeSelfInfluence},
        embeddingDimension: 128,
        randomSeed: 42,
        iterationWeights: ${JSON.stringify(perm)},
        writeProperty: 'embedding'
      }
      )
    `,
  );

  results = await funcs.run(
    `
      MATCH (n:Person),(m:Person)
      WHERE id(n) < id(m) AND n.embedding IS NOT NULL AND m.embedding IS NOT NULL
      CALL {
        WITH n, m
        RETURN gds.similarity.cosine(
          n.embedding,
          m.embedding
        ) AS cosineSimilarity
      } IN TRANSACTIONS
        OF 10 ROWS
      with n, m, cosineSimilarity
      where cosineSimilarity > 0.5
      return
      n.userId, m.userId,
      cosineSimilarity
      // , n.embedding as ne, m.embedding as me
      ORDER by cosineSimilarity DESC
    `,
  );

  printResults(results, 50, 0);

  const avg = calcAvg(results);

  console.log(`the avg is : ${avg}`);

  return {
    avg,
    perm,
    length: results.records.length,
    propertyRatio,
    nodeSelfInfluence,
  };
};

export const main = async () => {
  let perms: any = [[1, 0.5]];
  perms = false;
  const resultsList = await nodeembeddings(perms, false);

  // const resultsListOther = await nodeembeddings(
  //   !gender,
  //   resultsList.slice(-3).map((val) => val.perm),
  // );
  // console.log();
  // console.log();

  // console.log(`resultsList`);
  // for (let result of resultsList.slice(-3)) {
  //   console.log(`avg: ${result.avg} for ${JSON.stringify(result.perm)}`);
  // }

  // console.log(`resultsListOther`);
  // for (let result of resultsListOther) {
  //   console.log(`avg: ${result.avg} for ${JSON.stringify(result.perm)}`);
  // }
};
