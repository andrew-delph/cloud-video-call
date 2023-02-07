import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});

export const consume = async () => {
  const consumer = kafka.consumer({
    groupId: "test-group",
    maxWaitTimeInMs: 1000 * 10,
    minBytes: 10000,
  });

  await consumer.connect();
  console.log("connected!");

  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });
  console.log("subscribe!");

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
      for (let message of batch.messages) {
        if (!isRunning() || isStale()) break;
        // console.log("sent", message.value?.toString());
        // console.log("recv", new Date().toTimeString());
        // console.log(`Message size: ${message.value?.length} bytes`);
        resolveOffset(message.offset);
        await heartbeat();
      }
    },
  });

  //   await consumer.run({
  //     eachMessage: async ({ topic, partition, message }) => {
  //       console.log("msg recieved");
  //       console.log(message.value?.toString());
  //     },
  //   });
};
