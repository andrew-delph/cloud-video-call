import * as neo4j from 'neo4j-driver';
import {
  MilvusClient,
  DataType,
  SearchResults,
  ResStatus,
  SearchResultData,
} from '@zilliz/milvus2-sdk-node';
import * as common from 'common';
import { validFriends } from './person';
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

export interface SearchResultDataExtended extends SearchResultData {
  name: string;
}

export interface SearchResultsExtended {
  status: ResStatus;
  results: SearchResultDataExtended[];
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

async function insertData(collection_name: string, fields_data: any[]) {
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
  })) as SearchResultsExtended;
}

export async function retrieveVector(
  collection_name: string,
  queryName: string,
) {
  let expression = `name == "${queryName}"`;

  return await milvusClient.query({
    collection_name: collection_name,
    expr: expression,
    output_fields: [`*`],
    partition_names: [],
  });
}

export async function calcAvgMulvis(result: neo4j.QueryResult) {
  // create a new pool. inset all embddings
  // check the top

  console.log(`calculating average`);

  const collection_name = `hello_milvus_${Array.from(
    { length: 10 },
    () => Math.random().toString(36)[2],
  ).join(``)}`;

  await initCollection(collection_name);

  const start_time = performance.now();
  let records = result.records;

  const items = records.map((record) => {
    return {
      name: record.get(`n.userId`) as string,
      vector: record.get(`n.embedding`) as number[],
    };
  });

  await insertData(collection_name, items);

  // INSERT EACH VECTOR

  let length = 0;
  let total = 0;

  // SEACH AND VALIDATE TOP K
  for (let item of items) {
    const searchType = item.name;
    const searchVector = item.vector;

    const queryResults = await queryVector(
      collection_name,
      searchVector,
      searchType,
    );

    for (let i = 0; i < Math.min(queryResults.results.length, TOP_K); i++) {
      const result = queryResults.results[i];
      const otherName = result.name;
      if (validFriends(searchType, otherName)) total += 1;
    }

    length += Math.min(queryResults.results.length, TOP_K);
  }

  console.log(`total`, total, `length`, length);
  console.log(`--- calcAvg`);
  console.log(`run`, performance.now() - start_time);

  return { avg: total / length, length, valid: total };
}
