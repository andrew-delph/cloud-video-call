import { printResults } from './neo4j_index';
import {
  userFunctions,
  createFemale,
  createMale,
  createGroupA,
  createGroupB,
} from './person';

import * as funcs from './neo4j_functions';
import * as neo4j from 'neo4j-driver';

let results: neo4j.QueryResult;

const calcAvg = (result: neo4j.QueryResult, topLimit: number = 10) => {
  const records = result.records;

  const length = records.slice(0, topLimit).length;

  let total = 0;

  records.slice(0, topLimit).forEach((record, index) => {
    const diff = record.get(`diff`);

    if (diff) total += 1;
  });

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

export const nodeembeddings = async () => {
  let gender = true;
  //   gender = false;

  userFunctions.length = 0;
  if (gender) {
    userFunctions.push(createFemale);
    userFunctions.push(createMale);
  } else {
    userFunctions.push(createGroupA);
    userFunctions.push(createGroupB);
  }

  //   await funcs.createData({
  //     deleteData: true,
  //     nodesNum: 100,
  //     edgesNum: 20,
  //   });
  //   results = await funcs.createFriends();
  const test_attributes: string[] = await funcs.getAttributeKeys();
  results = await funcs.createGraph(`myGraph`, test_attributes);

  const permutations = generatePermutations([0, 1, 0.5], 3);
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
    if (gender) {
      return item1.avg - item2.avg;
    } else {
      return item2.avg - item1.avg;
    }
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
      WHERE n <> m
      with n, m, 
      gds.similarity.cosine(
          n.embedding,
          m.embedding
        ) AS cosineSimilarity,
      n.type <> m.type as diff
      return 
      cosineSimilarity,
      n.typeIndex as n, m.typeIndex as m,
      diff
      // , n.embedding as ne, m.embedding as me
      ORDER by cosineSimilarity DESC
    `,
  );

  printResults(results, 30, 20);

  const avg = calcAvg(results, 30);

  console.log(`the avg is : ${avg}`);

  return { avg, perm };
};
