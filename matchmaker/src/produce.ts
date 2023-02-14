import { Kafka } from 'kafkajs';
import * as common from 'react-video-call-common';

const kafka = new Kafka({
  clientId: `my-app`,
  brokers: [`localhost:9092`],
});

(async () => {
  const producer = kafka.producer();

  await producer.connect();

  for (let i = 1; i <= 22222; i++) {
    await producer.send({
      topic: common.readyTopicName,
      messages: [{ value: `sending msg: ` + i }],
    });
  }

  await producer.disconnect();
})();
