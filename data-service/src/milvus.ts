import * as neo4j from 'neo4j-driver';
import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';
export const collection_name = `user_data`;

export const DIM: number = 300;

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

const milvusAddress = `milvus.default:19530`;

// connect to milvus
export const milvusClient = new MilvusClient({ address: milvusAddress });

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

export async function initCollection() {
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
  return await milvusClient.insert({
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
  let expression = `name != "${excludeName}"`;
  if (includeNamesList) {
    expression =
      expression +
      ` && ` +
      `name in [${includeNamesList.map((name) => `"${name}"`).join(`, `)}]`;
  }

  const result = (await milvusClient.search({
    collection_name: collection_name,
    vector: searchVector,
    expr: expression,
    output_fields: OUTPUT_FIELDS,
    metric_type: METRIC_TYPE,
  })) as UserSearchResults;
  if (result.status.error_code != `Success`) {
    throw `retrieveVector ERROR: ${JSON.stringify(result.status)}`;
  }
  return result;
}

export async function retrieveVector(
  collection_name: string,
  queryName: string,
) {
  let expression = `name == "${queryName}"`;

  const result = await milvusClient.query({
    collection_name: collection_name,
    expr: expression,
    output_fields: [`vector`],
    partition_names: [],
  });

  if (result.status.error_code != `Success`) {
    logger.error(`retrieveVector ERROR: ${JSON.stringify(result.status)}`);
  }

  return result;
}
