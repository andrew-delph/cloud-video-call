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

let TOP_K = Infinity;
TOP_K = 1;

let START_TIME = performance.now();
const logger = common.getLogger();

const address = `192.168.49.2:30033`;

// connect to milvus
export const milvusClient = new MilvusClient({ address });

const METRIC_TYPE = `IP`;
const OUTPUT_FIELDS = [`type`];

interface SearchResultDataExtended extends SearchResultData {
  type: string;
}

interface SearchResultsExtended {
  status: ResStatus;
  results: SearchResultDataExtended[];
}

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
    dim: DIM,
  },
  {
    name: `type`,
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

async function queryVector(collection_name: string, searchVector: number[]) {
  return (await milvusClient.search({
    collection_name,
    vector: searchVector,
    limit: 20,
    output_fields: OUTPUT_FIELDS,
    metric_type: METRIC_TYPE,
  })) as SearchResultsExtended;
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
      type: record.get(`n.userId`) as string,
      vector: record.get(`n.embedding`) as number[],
    };
  });

  await insertData(collection_name, items);

  // INSERT EACH VECTOR

  let length = 0;
  let total = 0;

  // SEACH AND VALIDATE TOP N
  for (let item of items) {
    const searchType = item.type;
    const searchVector = item.vector;

    const queryResults = await queryVector(collection_name, searchVector);

    for (let i = 0; i < Math.min(queryResults.results.length, TOP_K); i++) {
      const result = queryResults.results[i];
      const otherName = result.type;
      if (validFriends(searchType, otherName)) total += 1;
      continue;
    }

    length += 1;
  }

  console.log(`total`, total, `length`, length);
  console.log(`--- calcAvg`);
  console.log(`run`, performance.now() - start_time);

  return { avg: total / length, length, valid: total };
}
