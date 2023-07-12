import * as neo4j from 'neo4j-driver';
import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';
export const DIM: number = 150;

export const OUTPUT_FIELDS = [`name`];

export const METRIC_TYPE = `IP`;
export const SCHEMA = [
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
    dim: DIM,
  },
  {
    name: `name`,
    description: `VarChar field`,
    data_type: DataType.VarChar,
    max_length: 128,
  },
];
let TOP_K = Infinity;
TOP_K = 5;

let START_TIME = performance.now();
const logger = common.getLogger();

const address = `192.168.49.2:30033`;

// connect to milvus
export const milvusClient = new MilvusClient({ address });

export interface UserSearchResultData extends SearchResultData {
  name: string;
}

export interface UserSearchResults {
  status: ResStatus;
  results: UserSearchResultData[];
}

export interface FieldData {
  name: string;
  vector: number[];
}

export async function initCollection(collection_name: string) {
  console.log(`COLLECTION`);

  await milvusClient.createCollection({
    collection_name,
    fields: SCHEMA,
    metric_type: METRIC_TYPE,
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
}

export async function insertData(
  collection_name: string,
  fields_data: FieldData[],
) {
  await milvusClient.insert({
    collection_name,
    fields_data,
  });
}

export async function queryVector(
  collection_name: string,
  searchVector: number[],
  excludeName: string,
  includeNamesList: string[] = [],
) {
  let expression = `name != "${excludeName}" `;
  if (includeNamesList) {
    expression + `&& name in ${JSON.stringify(includeNamesList)}`;
  }
  return (await milvusClient.search({
    collection_name: collection_name,
    vector: searchVector,
    expr: expression,
    output_fields: OUTPUT_FIELDS,
    metric_type: METRIC_TYPE,
  })) as UserSearchResults;
}
