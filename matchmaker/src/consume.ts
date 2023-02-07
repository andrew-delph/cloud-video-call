import { Kafka } from "kafkajs";
import amqp from "amqplib";
import * as common from "react-video-call-common";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka-service:9092"],
});

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

const connectRabbit = async () => {
  rabbitConnection = await amqp.connect("amqp://rabbitmq");
  rabbitChannel = await rabbitConnection.createChannel();
  console.log("rabbit connected");
};

const queueReadyEvent = async (socket1: string, socket2: string) => {
  // console.log("sending", socket1, socket2);
  try {
    await rabbitChannel.assertQueue(common.readyQueueName, { durable: true });
    rabbitChannel.sendToQueue(
      common.readyQueueName,
      Buffer.from(JSON.stringify([socket1, socket2]))
    );
  } catch (error) {
    console.error(error);
  }
};

const consumeListen = async () => {
  const consumer = kafka.consumer({
    groupId: "test-group",
    maxWaitTimeInMs: 1000 * 10,
    minBytes: 10000,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      isRunning,
      isStale,
    }) => {
      //   console.log("here", batch);
      console.log("");
      console.log(
        "new batch",
        batch.messages.length,
        new Date().toTimeString()
      );

      const messagesList = batch.messages;

      if (messagesList.length % 2 !== 0) {
        messagesList.pop();
      }

      for (let i = 0; i < messagesList.length; i += 2) {
        if (!isRunning() || isStale()) break;
        const slice = messagesList.slice(i, i + 2);
        const socket1 = slice[0];
        const socket2 = slice[1];

        // TODO dont assume value exists
        queueReadyEvent(socket1.value!.toString(), socket2.value!.toString());

        // TODO possibly only resolve on socket2 offset
        resolveOffset(socket1.offset);
        await heartbeat();
        resolveOffset(socket2.offset);
        await heartbeat();
      }
    },
  });
};

export const consume = () => {
  connectRabbit().then(() => consumeListen());
};
