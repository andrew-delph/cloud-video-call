import { run } from './run_index';

export * from './neo4j_functions';
export * from './lp_pipeling';
export { printResults } from './run_index';

if (require.main === module) {
  run();
} else {
  console.log(`not running script...`);
}
