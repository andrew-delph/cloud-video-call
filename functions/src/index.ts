import { connect, ConsumeMessage } from "amqplib";
import { readyEvent } from "./functions";
import * as common from "react-video-call-common";

async function worker() {
  const connection = await connect("amqp://rabbitmq");

  const channel = await connection.createChannel();

  await channel.assertQueue(common.readyQueueName, {
    durable: true,
  });

  channel.prefetch(1);
  console.log(" [x] Awaiting RPC requests");

  channel.consume(
    common.readyQueueName,
    async (msg: ConsumeMessage | null) => {
      if (msg == null) {
        console.log("msg is null");
        return;
      }

      try {
        await readyEvent(msg, channel);
        channel.ack(msg);
      } catch (e) {
        console.log("readyEvent error=" + e);
        channel.nack(msg, false, false);
      }
    },
    {
      noAck: false,
    }
  );
}

worker();
