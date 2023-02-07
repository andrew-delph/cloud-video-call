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
  await producer.send({
    topic: "test-topic",
    messages: [{ value: "Hello KafkaJS user!" }],
  });

  await producer.disconnect();
})();
