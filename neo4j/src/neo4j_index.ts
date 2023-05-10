import * as neo4j from 'neo4j-driver';
import * as lp from './lp_pipeling';
import * as funcs from './neo4j_functions';

console.log(`starting neo4j_index`);
let results: neo4j.QueryResult;

export function printResults(result: neo4j.QueryResult, limit: number = 10) {
  console.log(``);
  //   console.log("Results:");
  //   console.log(result.records);
  // console.log(`Summary:`);
  // console.log(result.summary);
  const records = result.records;
  console.log(`print records. limit is ${limit}`);
  console.log(`>>`);
  records.slice(0, limit).forEach((record) => {
    try {
      // console.log(record.get(`r`));
      // console.log(`value`, Object.keys(record.get(`r`)));
      console.log(
        record.get(`person1.userId`),
        record.get(`person2.userId`),
        record.get(`probability`),
        record.get(`gender1`),
        record.get(`gender2`),
        record.get(`other`),
      );
    } catch (e) {
      let line = ``;
      record.keys.forEach((key) => {
        line =
          line +
          ` ` +
          `${key.toString()}: ${JSON.stringify(record.get(key))}` +
          `\t`;
      });
      console.log(line);

      // record.keys.forEach((key) => {
      // console.log(`${key.toString()}: ${JSON.stringify(record.get(key))}`);
      // });
    }
  });
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
      edgesNum: 10,
    });
    results = await funcs.createFriends();
    const test_attributes: string[] = await funcs.getAttributeKeys();
    results = await funcs.createGraph(`myGraph`, test_attributes);

    results = await funcs.run(
      `
      CALL gds.fastRP.write('myGraph',
      {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS', 'NEGATIVE'],
        featureProperties: ['values'],
        embeddingDimension: 256,
        writeProperty: 'embedding'
      }
      )
    `,
    );

    // SIMILAR0 write
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.write('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS','NEGATIVE'],
        writeRelationshipType: 'SIMILAR0',
        writeProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

    // SIMILAR1 write
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.write('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS'],
        writeRelationshipType: 'SIMILAR1',
        writeProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

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

    // SIMILAR2 write
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.write('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['FRIENDS', 'SIMILAR1'],
        writeRelationshipType: 'SIMILAR2',
        writeProperty: 'score'
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

    // SIMILAR3 write
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.write('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['NEGATIVE'],
        writeRelationshipType: 'SIMILAR3',
        writeProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

    // SIMILAR4 write
    results = await funcs.run(
      `
      CALL gds.nodeSimilarity.write('myGraph', {
        nodeLabels: ['Person'],
        relationshipTypes: ['NEGATIVE','SIMILAR3'],
        writeRelationshipType: 'SIMILAR4',
        writeProperty: 'score'
      })
      YIELD nodesCompared, relationshipsWritten
    `,
    );

    results = await funcs.run(
      `
      MATCH (n1:Person)-[:USER_ATTRIBUTES_CONSTANT]->(md1:MetaData)
      MATCH (n2:Person)-[:USER_ATTRIBUTES_CONSTANT]->(md2:MetaData)
      OPTIONAL MATCH (n1)-[srel0:SIMILAR0]->(n2)
      OPTIONAL MATCH (n1)-[srel1:SIMILAR1]->(n2)
      OPTIONAL MATCH (n1)-[srel2:SIMILAR2]->(n2)
      OPTIONAL MATCH (n1)-[srel3:SIMILAR3]->(n2)
      OPTIONAL MATCH (n1)-[srel4:SIMILAR4]->(n2)
      WITH n1, n2, md1, md2,
      gds.similarity.cosine(
        n1.embedding,
        n2.embedding
      ) AS cosineSimilarity,
      gds.alpha.linkprediction.adamicAdar(n1, n2, {
        relationshipQuery: 'NEGATIVE'
      }) AS negative,
      gds.alpha.linkprediction.adamicAdar(n1, n2, {
        relationshipQuery: 'FRIENDS'
      }) AS friends,
      coalesce(md1.gender, n1.type) as t1, 
      coalesce(md2.gender, n2.type) as t2,
      coalesce(srel0.score, 0) as sim0,
      coalesce(srel1.score, 0) as sim1,
      coalesce(srel2.score, 0) as sim2,
      coalesce(srel3.score, 0) as sim3,
      coalesce(srel4.score, 0) as sim4
      WHERE n1 <> n2
      RETURN 
      // n1.userId as u1,
      // n2.userId as u2,
      t1,
      t2,
      // t1 <> t2 as diff,
      // cosineSimilarity as c,
      round(sim0,3) as sim0,
      round(sim1,3) as sim1,
      round(sim2,3) as sim2,
      round(sim3,3) as sim3,
      round(sim4,3) as sim4,
      // ,
      // negative as n,
      // friends as f,
      sim2 - sim4 as score
      ORDER BY score DESC
    `,
    );

    printResults(results, 100);

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
