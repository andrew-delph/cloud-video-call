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

      for (let message of messagesList) {
        if (!isRunning() || isStale()) break;
        console.log("recvd", message.value?.toString());
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
