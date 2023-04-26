import { run } from './neo4j_index';

export * from './neo4j_functions';
export * from './lp_pipeling';

if (require.main === module) {
  run();
} else {
  console.log(`not running script...`);
}
