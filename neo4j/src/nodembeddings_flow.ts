import { printResults } from './neo4j_index';
import {
  userFunctions,
  createFemale,
  createMale,
  createGroupA,
  createGroupB,
  validFriends,
  createRandom,
} from './person';

import * as funcs from './neo4j_functions';
import * as neo4j from 'neo4j-driver';

let results: neo4j.QueryResult;

const calcAvg = (result: neo4j.QueryResult, topLimit: number = 10) => {
  let records = result.records;

  if (topLimit > 0) {
    records = records.slice(0, topLimit);
  }

  let length = 0;
  let total = 0;

  for (let record of records) {
    const ntype = record.get(`m.type`);
    const mtype = record.get(`n.type`);
    const cosineSimilarity = record.get(`cosineSimilarity`);

    if (cosineSimilarity <= 0) {
      break;
    }

    if (validFriends(ntype, mtype)) total += 1;
    length += 1;
  }

  records.slice(0, topLimit).forEach((record, index) => {});

  return total / length;
};

function generatePermutations(values: number[], length: number) {
  const permutations: number[][] = [];

  function generateHelper(current: number[]) {
    if (current.length === length) {
      permutations.push(current);
      return;
    }

    for (let i = 0; i < values.length; i++) {
      generateHelper([...current, values[i]]);
    }
  }

  generateHelper([]);

  return permutations;
}

function generateLists(elements: number[], maxSize: any) {
  const lists: number[][] = [];

  function generateHelper(currentList: number[], currentIndex: number) {
    if (currentList.length > 0) {
      lists.push(currentList);
    }

    if (currentList.length === maxSize) {
      return;
    }

    for (let i = currentIndex; i < elements.length; i++) {
      generateHelper([...currentList, elements[i]], i);
    }
  }

  generateHelper([], 0);

  return lists;
}

export const nodeembeddings = async (permutations: any = false) => {
  userFunctions.length = 0;

  userFunctions.push(createFemale);
  userFunctions.push(createMale);
  userFunctions.push(createGroupA);
  userFunctions.push(createGroupB);
  userFunctions.push(createRandom);

  await funcs.createData({
    deleteData: true,
    nodesNum: 200,
    edgesNum: 20,
  });
  results = await funcs.createFriends();
  const test_attributes: string[] = await funcs.getAttributeKeys();
  results = await funcs.createGraph(`myGraph`, []);

  if (permutations == false) {
    permutations = generatePermutations([0, 1, 0.5], 3);
  }
  console.log(`permutations: ${JSON.stringify(permutations)}`);

  results = await funcs.run(
    `
    CALL gds.articleRank.mutate('myGraph', {  
        scaler: "MinMax",
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS'],
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
      relationshipTypes: ['FRIENDS'],
      mutateProperty: 'community' 
    }
    )
  `,
  );

  const resultList: any[] = [];

  for (let perm of permutations) {
    resultList.push(await generateEmbedding(perm));
  }

  resultList.sort((item1, item2) => {
    return item1.avg - item2.avg;
  });

  const winner = resultList[resultList.length - 1].perm;

  console.log();
  console.log(`printing winner`);

  await generateEmbedding(winner);

  console.log();
  for (let result of resultList) {
    console.log(`avg: ${result.avg} for ${JSON.stringify(result.perm)}`);
  }
  console.log(`permutations.length: ${permutations.length}`);

  return resultList;
};

const generateEmbedding = async (perm: number[]) => {
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
        // relationshipTypes: ['FRIENDS', 'NEGATIVE'],
        relationshipTypes: ['FEEDBACK'],
        relationshipWeightProperty: 'score',
        featureProperties: ['values','priority','community'],
        propertyRatio: 0.0,
        nodeSelfInfluence: 1.0,
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
      WHERE id(n) < id(m) // AND (n.type = "Male" or m.type = "Male")
      CALL {
        WITH n, m
        RETURN gds.similarity.cosine(
          n.embedding,
          m.embedding
        ) AS cosineSimilarity
      } IN TRANSACTIONS
        OF 10 ROWS
      with n, m, cosineSimilarity,
      n.type <> m.type as diff
      return 
      m.type, n.type,
      cosineSimilarity,
      n.typeIndex as n, m.typeIndex as m,
      diff
      // , n.embedding as ne, m.embedding as me
      ORDER by cosineSimilarity DESC
    `,
  );

  printResults(results, 50, 20);

  const avg = calcAvg(results, 100);

  console.log(`the avg is : ${avg}`);

  return { avg, perm };
};

export const main = async () => {
  const resultsList = await nodeembeddings([[1, 0.5]]);

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
