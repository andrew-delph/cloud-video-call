import { milvusTest } from './milvus_test';

// import { run } from './run_neo4j';
// export * from './neo4j_functions';
// export * from './lp_pipeling';
// export { printResults } from './run_neo4j';

if (require.main === module) {
  milvusTest();
} else {
  console.log(`not running script...`);
}
