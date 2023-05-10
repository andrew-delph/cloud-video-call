import * as common from 'common';
import * as funcs from 'neo4jscripts';

common.listenGlobalExceptions();

const logger = common.getLogger();

funcs.setDriver(`bolt://neo4j:7687`); // `bolt://127.0.0.1:7687`

const job = process.env.JOB;

// funcs.createData();
let node_attributes: string[];

const print_num = 5;

const redisClient = common.createRedisClient();

let results;
const start_time = performance.now();
logger.info(`Value of JOB: ${job}`);
(async () => {
  switch (job) {
    case `SHORT_PREDICT`:
      const activeUsers = await common.getRecentlyActiveUsers(redisClient, 5);

      if (activeUsers.length < 5) {
        logger.info(`activeUsers.length is too small : ${activeUsers.length}`);
        break;
      } else {
        logger.info(`Recently Active Users: ${activeUsers.length}`);
      }

      results = await funcs.createGraph(
        `shortPredictGraph`,
        await funcs.getAttributeKeys(),
      );
      funcs.printResults(results, print_num);

      // SIMILAR2 mutate
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

      // SIMILAR4 mutate
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

      // results = await funcs.predict(false, `shortPredictGraph`);

      // for (let record of results.records) {
      //   const userId1: string = record.get(`person1.userId`);
      //   const userId2: string = record.get(`person2.userId`);
      //   const probability: number = record.get(`probability`);
      //   await common.writeRedisRelationshipProbability(
      //     redisClient,
      //     userId1,
      //     userId2,
      //     probability,
      //     60 * 30,
      //   );
      // }

      // logger.info(
      //   `writeRedisRelationshipProbability: ${results.records.length}`,
      // );

      // // log the lowest probability found
      // if (results.records.length > 1) {
      //   logger.info(
      //     `probability found: highest ${results.records[0].get(
      //       `probability`,
      //     )} lowest : ${results.records[results.records.length - 1].get(
      //       `probability`,
      //     )} of ${results.records.length} records.`,
      //   );
      // }

      // funcs.printResults(results, print_num);
      break;
    case `TRAIN`:
    case `COMPUTE`:
      // await funcs.createFriends();
      node_attributes = await funcs.getAttributeKeys();
      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results, print_num);

      // results = await funcs.callShortestPath();
      // funcs.printResults(results, print_num);

      results = await funcs.callPriority();
      funcs.printResults(results, print_num);

      results = await funcs.callCommunities();
      funcs.printResults(results, print_num);

      results = await funcs.callWriteSimilar();
      funcs.printResults(results, print_num);

      results = await funcs.createPipeline();
      funcs.printResults(results, print_num);

      results = await funcs.createGraph(`myGraph`, node_attributes);
      funcs.printResults(results, print_num);
      break;
  }
  switch (job) {
    case `TRAIN`:
      results = await funcs.train();
      funcs.printResults(results, print_num);

    case `COMPUTE`:
      results = await funcs.predict(true, `myGraph`);
      funcs.printResults(results, print_num);

      // results = await funcs.compareTypes();
      // funcs.printResults(results, print_num);
      break;
  }

  const end_time = performance.now();
  logger.info(
    `complted ${job} in ${((end_time - start_time) / 1000).toFixed(1)}secs ${(
      (end_time - start_time) /
      1000 /
      60
    ).toFixed(1)}mins`,
  );
  process.exit(0);
})();
