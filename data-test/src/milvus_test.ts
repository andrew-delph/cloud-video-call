import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';
import {
  DIM,
  METRIC_TYPE,
  SCHEMA,
  milvusClient,
  queryVector,
} from './mulvis_functions';

const logger = common.getLogger();

// const COLLECTION_NAME = `hello_milvus_${Array.from(
//   { length: 10 },
//   () => Math.random().toString(36)[2],
// ).join(``)}`;

const COLLECTION_NAME = `hello_milvus`;

const ITEMS_NUM = 2000;

const fields_data = Array.from({ length: ITEMS_NUM }, () => {
  return {
    vector: Array.from({ length: DIM }, () => Math.random()),
    name: Array.from({ length: 10 }, () => Math.random().toString(36)[2]).join(
      ``,
    ),
  };
});

// console.log();
// console.log();

// console.log(`schema ${JSON.stringify(schema)}`);

// console.log();
// console.log();

// console.log(`fields_data ${JSON.stringify(fields_data)}`);

// console.log();
// console.log();

export async function milvusTest() {
  console.log(`STARTING2`);
  await milvusClient.createCollection({
    collection_name: COLLECTION_NAME,
    fields: SCHEMA,
    metric_type: METRIC_TYPE,
  });

  console.log(`INSERT`);

  await milvusClient.insert({
    collection_name: COLLECTION_NAME,
    fields_data,
  });

  await milvusClient.insert({
    collection_name: COLLECTION_NAME,
    fields_data,
  });

  console.log(`INDEX`);
  // create index
  await milvusClient.createIndex({
    // required
    collection_name: COLLECTION_NAME,
    field_name: `vector`, // optional if you are using milvus v2.2.9+
    index_name: `myindex`, // optional
    index_type: `HNSW`, // optional if you are using milvus v2.2.9+
    params: { efConstruction: 10, M: 4 }, // optional if you are using milvus v2.2.9+
    metric_type: METRIC_TYPE, // optional if you are using milvus v2.2.9+
  });

  console.log(`LOAD`);

  // load collection
  await milvusClient.loadCollectionSync({
    collection_name: COLLECTION_NAME,
  });

  // get the search vector
  const searchVector = fields_data[0].vector;
  const searchName = fields_data[0].name;

  interface SearchResult extends SearchResultData {
    id: string;
    score: number;
    height: number;
    name: string;
  }

  interface SearchResultsTemp {
    status: ResStatus;
    results: SearchResult[];
  }

  console.log(`SEARCH`);

  // Perform a vector search on the collection
  // const res = (await milvusClient.search({
  //   // required
  //   COLLECTION_NAME, // required, the collection name
  //   vector: searchVector, // required, vector used to compare other vectors in milvus
  //   // optionals
  //   filter: `height > 0`, // optional, filter
  //   params: { nprobe: 64 }, // optional, specify the search parameters
  //   // limit: 10, // optional, specify the number of nearest neighbors to return
  //   metric_type: `L2`, // optional, metric to calculate similarity of two vectors
  //   output_fields: OUTPUT_FIELDS, // optional, specify the fields to return in the search results
  // }));

  const includeNamesList = fields_data.map((data) => data.name);

  START_TIME = performance.now();

  const res = await queryVector(
    COLLECTION_NAME,
    searchVector,
    searchName,
    includeNamesList,
  );

  //   const names = ["name1", "name2", "name3"]; // the list of names you're searching for

  // const res = await milvusClient.query({
  //   COLLECTION_NAME,
  //   expr: `name in [${names.join(",")}]`,
  //   output_fields: ["height", "name"]
  // });

  console.log(`>>`);
  console.log(`status ${res.status.error_code} reason ${res.status.reason}`);
  console.log(`<<`);

  console.log(`search name: ${fields_data[0].name}`);

  console.table(res.results);

  // for (let r of res.results) {
  //   console.log(`r id ${r.id} score ${r.score} data ${JSON.stringify(r)}`);
  // }
}
let START_TIME = performance.now();
milvusTest()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    console.log(`DONE ${(performance.now() - START_TIME) / 1000}seconds`);
    process.exit(0);
  });
