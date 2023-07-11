import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';

const logger = common.getLogger();

const address = `192.168.49.2:30033`;

// connect to milvus
const milvusClient = new MilvusClient({ address });

const collection_name = `hello_milvus_${Array.from(
  { length: 10 },
  () => Math.random().toString(36)[2],
).join(``)}`;
const dim = 128;
const METRIC_TYPE = `IP`;
const schema = [
  {
    name: `age`,
    description: `ID field`,
    data_type: DataType.Int64,
    is_primary_key: true,
    autoID: true,
  },
  {
    name: `vector`,
    description: `Vector field`,
    data_type: DataType.FloatVector,
    dim: 8,
  },
  { name: `height`, description: `int64 field`, data_type: DataType.Int64 },
  {
    name: `name`,
    description: `VarChar field`,
    data_type: DataType.VarChar,
    max_length: 128,
  },
];

const fields_data = Array.from({ length: 20 }, () => {
  return {
    vector: Array.from({ length: 8 }, () => Math.random()),
    height: Math.floor(Math.random() * 1001),
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
    collection_name,
    fields: schema,
    metric_type: METRIC_TYPE,
  });

  console.log(`INSERT`);

  await milvusClient.insert({
    collection_name,
    fields_data,
  });

  console.log(`INDEX`);
  // create index
  await milvusClient.createIndex({
    // required
    collection_name,
    field_name: `vector`, // optional if you are using milvus v2.2.9+
    index_name: `myindex`, // optional
    index_type: `HNSW`, // optional if you are using milvus v2.2.9+
    params: { efConstruction: 10, M: 4 }, // optional if you are using milvus v2.2.9+
    metric_type: METRIC_TYPE, // optional if you are using milvus v2.2.9+
  });

  console.log(`LOAD`);

  // load collection
  await milvusClient.loadCollectionSync({
    collection_name,
  });

  // get the search vector
  const searchVector = fields_data[0].vector;

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
  const res = (await milvusClient.search({
    // required
    collection_name, // required, the collection name
    vector: searchVector, // required, vector used to compare other vectors in milvus
    // optionals
    filter: `height > 0`, // optional, filter
    params: { nprobe: 64 }, // optional, specify the search parameters
    // limit: 10, // optional, specify the number of nearest neighbors to return
    metric_type: `L2`, // optional, metric to calculate similarity of two vectors
    output_fields: [`height`, `name`], // optional, specify the fields to return in the search results
  })) as SearchResultsTemp;

  //   const names = ["name1", "name2", "name3"]; // the list of names you're searching for

  // const res = await milvusClient.query({
  //   collection_name,
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

milvusTest()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    console.log(`DONE`);
    process.exit(0);
  });
