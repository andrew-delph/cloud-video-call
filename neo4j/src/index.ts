import { run } from './neo4j_index';

export * from './neo4j_functions';
export * from './lp_pipeling';
export { printResults } from './neo4j_index';

if (require.main === module) {
  run();
} else {
  console.log(`not running script...`);
}
