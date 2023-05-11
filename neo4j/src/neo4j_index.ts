import * as neo4j from 'neo4j-driver';
import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';

console.log(`starting neo4j_index`);
let results: neo4j.QueryResult;

export function printResults(
  result: neo4j.QueryResult,
  topLimit: number = 10,
  bottomLimit: number = 0,
) {
  console.log(``);
  //   console.log("Results:");
  //   console.log(result.records);
  // console.log(`Summary:`);
  // console.log(result.summary);
  const records = result.records;
  console.log(
    `print records. topLimit: ${topLimit}  bottomLimit: ${bottomLimit}`,
  );
  console.log(`>>`);
  records.slice(0, topLimit).forEach((record, index) => {
    let line = `#: ${index} `;
    record.keys.forEach((key) => {
      line =
        line +
        ` ` +
        `${key.toString()}: ${JSON.stringify(record.get(key))}` +
        `\t`;
    });
    console.log(line);
  });
  if (bottomLimit > 0) {
    console.log(`---`);
    records.slice(-bottomLimit).forEach((record, index) => {
      let line = `#: ${records.length - index} `;
      record.keys.forEach((key) => {
        line =
          line +
          ` ` +
          `${key.toString()}: ${JSON.stringify(record.get(key))}` +
          `\t`;
      });
      console.log(line);
    });
  }

  console.log(`<<`);

  console.log(`records.length:`, records.length);
}
const start_time = performance.now();

export const run = async () => {
  try {
    funcs.setDriver(`bolt://localhost:7687`);

    await funcs.createData({
      deleteData: true,
      nodesNum: 100,
      edgesNum: 20,
    });
    results = await funcs.createFriends();
    const test_attributes: string[] = await funcs.getAttributeKeys();
    results = await funcs.createGraph(`myGraph`, test_attributes);

    results = await funcs.run(
      `
      CALL gds.fastRP.write('myGraph',
      {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS'],
        featureProperties: ['values'],
        embeddingDimension: 3,
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
      //, n.embedding as ne, m.embedding as me
      ORDER by cosineSimilarity DESC
    `,
    );

    // results = await funcs.getFriends();

    printResults(results, 200, 10);

    return;

    // SIMILAR1 mutate
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.mutate('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS'],
        mutateRelationshipType: 'SIMILAR1',
        mutateProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

    // SIMILAR2 mutate
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.mutate('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS', 'SIMILAR1'],
        mutateRelationshipType: 'SIMILAR2',
        mutateProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

    // SIMILAR3 mutate
    results = await funcs.run(
      `
          CALL gds.nodeSimilarity.mutate('myGraph', {
            nodeLabels: ['Person'],
            relationshipTypes: ['NEGATIVE'],
            mutateRelationshipType: 'SIMILAR3',
            mutateProperty: 'score'
          })
          YIELD nodesCompared, relationshipsWritten
        `,
    );

    // SIMILAR4 mutate
    results = await funcs.run(
      `
          CALL gds.nodeSimilarity.mutate('myGraph', {
            nodeLabels: ['Person'],
            relationshipTypes: ['NEGATIVE', 'SIMILAR3'],
            mutateRelationshipType: 'SIMILAR4',
            mutateProperty: 'score'
          })
          YIELD nodesCompared, relationshipsWritten
        `,
    );

    results = await funcs.run(
      `
      CALL gds.graph.relationshipProperty.stream(
        'myGraph',                  
        'score',
        ['SIMILAR2','SIMILAR4']                              
      )
      YIELD
        sourceNodeId, targetNodeId, relationshipType, propertyValue
      RETURN
        gds.util.asNode(sourceNodeId).userId as source, gds.util.asNode(targetNodeId).userId as target, relationshipType, propertyValue
      ORDER BY source ASC, target ASC
    `,
    );

    const getKey = (user1: string, user2: string) => {
      return `key-${user1}-${user2}`;
    };

    const convertScore = (relationshipType: string, score: number): number => {
      if (relationshipType == `SIMILAR2`) {
        return score;
      } else if ((relationshipType = `SIMILAR4`)) {
        return -score;
      } else {
        throw `relationshipType ${relationshipType} does not exist`;
      }
    };

    const data: Map<String, number> = new Map();

    for (let record of results.records) {
      const user1 = record.get(`source`);
      const user2 = record.get(`target`);
      const relationshipType = record.get(`relationshipType`);
      const propertyValue = record.get(`propertyValue`);

      const score = convertScore(relationshipType, propertyValue);
      const key = getKey(user1, user2);

      data.set(key, (data.get(key) || 0) + score);
    }

    let entries = [...data.entries()];

    entries.sort((a, b) => {
      return b[1] - a[1];
    });

    for (const entry of entries.slice(0, 50)) {
      console.log(entry[0] + ` : ` + entry[1]);
    }

    return;

    await funcs.createData({ deleteData: true, nodesNum: 100, edgesNum: 50 });

    // await funcs.createAttributeFloat();

    const node_attributes: string[] = await funcs.getAttributeKeys();

    results = await funcs.createFriends();

    results = await funcs.createGraph(`myGraph`, node_attributes);

    results = await funcs.callPriority();
    results = await funcs.callCommunities();
    results = await funcs.callWriteSimilar();
    // results = await funcs.callNodeEmbeddings();
    results = await funcs.getUsers();
    // printResults(results, 50);

    results = await funcs.readGraph(`myGraph`, `values`);
    // printResults(results, 50);

    results = await lp.createPipeline();
    results = await funcs.createGraph(`myGraph`, node_attributes);

    const train_results = await lp.train(`myGraph`);
    results = await lp.predict(true, `myGraph`);
    printResults(results, 200);

    results = await funcs.compareTypes();
    printResults(results, 200);

    console.log(`graph_attributes`, node_attributes);
  } finally {
    const end_time = performance.now();
    console.log(
      `neo4j_index closing. ${((end_time - start_time) / 1000).toFixed(
        1,
      )}secs ${((end_time - start_time) / 1000 / 60).toFixed(1)}mins`,
    );
    await funcs.session.close();
    await funcs.driver.close();
  }

  // on application exit:
};
