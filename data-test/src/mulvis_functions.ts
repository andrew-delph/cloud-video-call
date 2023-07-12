import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';

let START_TIME = performance.now();
const logger = common.getLogger();

const address = `192.168.49.2:30033`;

// connect to milvus
export const milvusClient = new MilvusClient({ address });

const dim = 400;
const METRIC_TYPE = `IP`;
const OUTPUT_FIELDS = [`name`];

const schema = [
  {
    name: `vector`,
    description: `Vector field`,
    data_type: DataType.FloatVector,
    dim: dim,
  },
  {
    name: `name`,
    description: `VarChar field`,
    data_type: DataType.VarChar,
    max_length: 128,
  },
];

async function initCollection(collection_name: string) {
  await milvusClient.createCollection({
    collection_name,
    fields: schema,
    metric_type: METRIC_TYPE,
  });

  console.log(`INSERT`);

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
}

async function insertData(collection_name: string, fields_data: any[]) {
  await milvusClient.insert({
    collection_name,
    fields_data,
  });
}

async function searchVector(collection_name: string, searchVector: number[]) {
  await milvusClient.search({
    collection_name,
    vector: searchVector,
    limit: 20,
    output_fields: OUTPUT_FIELDS,
    metric_type: METRIC_TYPE,
  });
}
