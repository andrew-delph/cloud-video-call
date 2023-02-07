import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});

(async () => {
  const producer = kafka.producer();
  const admin = kafka.admin();

  //   await admin.connect();

  //   await admin.createTopics({
  //     waitForLeaders: true,
  //     timeout: 1000,
  //     topics: [{ topic: "test-topic" }],
  //   });

  //   await admin.disconnect();

  await producer.connect();

  for (var i = 1; i <= 22222; i++) {
    await producer.send({
      topic: "test-topic",
      messages: [{ value: "sending msg: " + i }],
    });
  }

  await producer.disconnect();
})();
