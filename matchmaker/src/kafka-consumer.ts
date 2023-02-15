import { Kafka, logLevel } from 'kafkajs';
import amqp from 'amqplib';
import * as common from 'react-video-call-common';
import * as neo4j from 'neo4j-driver';
import { throttle } from 'lodash';

const kafka = new Kafka({
  logLevel: logLevel.WARN,
  clientId: `my-app`,
  brokers: [`my-cluster-kafka-bootstrap:9092`],
});

const readyConsumer = kafka.consumer({
  groupId: `ready-group`,
  maxWaitTimeInMs: 1000 * 10,
  minBytes: 10000,
  maxBytes: 20000,
});

const neo4jConsumer = kafka.consumer({
  groupId: `neo4j-group`,
  maxWaitTimeInMs: 1000 * 1,
});

const driver = neo4j.driver(
  `neo4j://neo4j:7687`,
  neo4j.auth.basic(`neo4j`, `password`),
);

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect(`amqp://rabbitmq`);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(common.matchQueueName, { durable: true });
  console.log(`rabbit connected`);
};

const queueReadyEvent = async (socket1: string, socket2: string) => {
  // console.log(`sending`, socket1, socket2);
  try {
    await (async () => {
      const start_time = performance.now();

      const session = driver.session();
      await session.run(
        `MATCH (a:Person), (b:Person) WHERE a.socketid = $socket1 AND b.socketid = $socket2 MERGE (a)-[:MATCHED]->(b) MERGE (b)-[:MATCHED]->(a)`,
        {
          socket1: socket1,
          socket2: socket2,
        },
      );
      await session.close();
      const duration = (performance.now() - start_time) / 1000;
      if (duration > 1) {
        console.log(
          `create relationship took:${Math.round(
            performance.now() - start_time,
          )}s  for: ${socket1} ${socket2}`,
        );
      }
    })();
    rabbitChannel.sendToQueue(
      common.matchQueueName,
      Buffer.from(JSON.stringify([socket1, socket2])),
    );
  } catch (error) {
    console.error(error);
  }
};

const readyListen = async () => {
  await readyConsumer.connect();
  await readyConsumer.subscribe({
    topic: common.readyTopicName,
    fromBeginning: true,
  });

  await readyConsumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      isRunning,
      isStale,
    }) => {
      console.log(
        `new batch size: ${batch.messages.length} partition: ${
          batch.partition
        } time: ${new Date().toLocaleTimeString()}`,
      );

      const start_time = performance.now();

      const messagesList = batch.messages;

      if (messagesList.length % 2 !== 0 && messagesList.length > 0) {
        console.log(`poped offset`, messagesList.pop()?.offset);
      }

      // console.log(`remaining messagesList.length`, messagesList.length);

      for (let i = 0; i < messagesList.length; i += 2) {
        if (!isRunning() || isStale()) {
          console.log(`!isRunning() || isStale()`);
          break;
        }
        const slice = messagesList.slice(i, i + 2);
        const socket1 = slice[0];
        const socket2 = slice[1];

        // TODO dont assume value exists
        await queueReadyEvent(
          socket1.value!.toString(),
          socket2.value!.toString(),
        );

        // TODO possibly only resolve on socket2 offset
        resolveOffset(socket1.offset);
        await heartbeat();
        resolveOffset(socket2.offset);
        await heartbeat();
      }
      console.log(
        `finished ready batch took: ${Math.round(
          (performance.now() - start_time) / 1000,
        )}s`,
      );
    },
  });
  console.log(`LISTENING ON READY`);
};

const createUserListen = async () => {
  await neo4jConsumer.connect();
  await neo4jConsumer.subscribe({
    topic: common.neo4jCreateUserTopicName,
    fromBeginning: true,
  });

  const printMessage = throttle(() => {
    console.log(`created node`);
  }, 5000);

  await neo4jConsumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      const socketid = message.value?.toString();
      if (!socketid) {
        console.error(`neo4jConsumer message is null`);
        return;
      }
      const session = driver.session();

      const start_time = performance.now();
      await session.run(
        `
      CREATE (:Person {socketid: $socketid});
      `,
        {
          socketid: message.value?.toString(),
        },
      );
      const duration = Math.round(performance.now() - start_time) / 1000;
      if (duration > 1) {
        console.warn(`created Node took: ${duration}s partition: ${partition}`);
      }
      printMessage();

      await session.close();
    },
  });
  console.log(`LISTENING ON NEO4J`);
};

const consumeListen = async () => {
  await readyListen();
  // await createUserListen();
};

export const consume = () => {
  connectRabbit().then(() => consumeListen());
};

const errorTypes = [`unhandledRejection`, `uncaughtException`];
const signalTraps = [`SIGTERM`, `SIGINT`, `SIGUSR2`];

errorTypes.forEach((type) => {
  process.on(type, async (e) => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);

      await readyConsumer.disconnect();

      await neo4jConsumer.disconnect();

      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    try {
      await readyConsumer.disconnect();

      await neo4jConsumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});
