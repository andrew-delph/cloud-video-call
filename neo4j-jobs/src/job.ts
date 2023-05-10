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

      results = await funcs.run(
        `
        CALL gds.nodeSimilarity.mutate('shortPredictGraph', {
          nodeLabels: ['Person'],
          relationshipTypes: ['FRIENDS'],
          mutateRelationshipType: 'SIMILAR1',
          topK: 20,
          mutateProperty: 'score'
        })
        YIELD nodesCompared, relationshipsWritten
      `,
      );

      // SIMILAR2 mutate
      results = await funcs.run(
        `
        CALL gds.nodeSimilarity.mutate('shortPredictGraph', {
          nodeLabels: ['Person'],
          relationshipTypes: ['FRIENDS', 'SIMILAR1'],
          mutateRelationshipType: 'SIMILAR2',
          topK: 20,
          mutateProperty: 'score'
        })
        YIELD nodesCompared, relationshipsWritten
      `,
      );

      // SIMILAR3 mutate
      results = await funcs.run(
        `
            CALL gds.nodeSimilarity.mutate('shortPredictGraph', {
              nodeLabels: ['Person'],
              relationshipTypes: ['NEGATIVE'],
              mutateRelationshipType: 'SIMILAR3',
              topK: 20,
              mutateProperty: 'score'
            })
            YIELD nodesCompared, relationshipsWritten
          `,
      );

      // SIMILAR4 mutate
      results = await funcs.run(
        `
            CALL gds.nodeSimilarity.mutate('shortPredictGraph', {
              nodeLabels: ['Person'],
              relationshipTypes: ['NEGATIVE', 'SIMILAR3'],
              mutateRelationshipType: 'SIMILAR4',
              topK: 20,
              mutateProperty: 'score'
            })
            YIELD nodesCompared, relationshipsWritten
          `,
      );

      results = await funcs.run(
        `
        CALL gds.graph.relationshipProperty.stream(
          'shortPredictGraph',                  
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

      const convertScore = (
        relationshipType: string,
        score: number,
      ): number => {
        if (relationshipType == `SIMILAR2`) {
          return score;
        } else if ((relationshipType = `SIMILAR4`)) {
          return -score;
        } else {
          throw `relationshipType ${relationshipType} does not exist`;
        }
      };

      const data: Map<string, number> = new Map();

      for (let record of results.records) {
        const user1 = record.get(`source`);
        const user2 = record.get(`target`);
        const relationshipType = record.get(`relationshipType`);
        const propertyValue = record.get(`propertyValue`);

        const score = convertScore(relationshipType, propertyValue);
        const key = common.relationshipProbabilityKey(user1, user2);

        data.set(key, (data.get(key) || 0) + score);
      }

      const entries = [...data.entries()];

      entries.sort((a, b) => {
        return b[1] - a[1];
      });

      for (const entry of entries) {
        logger.debug(entry[0] + ` : ` + entry[1]);
        await common.writeRedisRelationshipProbability(
          redisClient,
          entry[0],
          entry[1],
          60 * 30,
        );
      }

      logger.info(`wrote ${entries.length} relationships to redis`);

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
