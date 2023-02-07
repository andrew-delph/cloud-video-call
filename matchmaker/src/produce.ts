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

  for (var i = 0; i < 2000; i++) {
    await producer.send({
      topic: "test-topic",
      messages: [{ value: "Hello KafkaJS user!" + new Date().toTimeString() }],
    });
  }
  //   await producer.send({
  //     topic: "test-topic",
  //     messages: [{ value: new Date().toTimeString() }],
  //   });
  //   await producer.send({
  //     topic: "test-topic",
  //     messages: [{ value: "ANDREW DELPH" }],
  //   });

  await producer.disconnect();
})();
