import { connect, ConsumeMessage } from "amqplib";
import { readyEvent } from "./functions";

async function worker() {
  try {
    const connection = await connect("amqp://rabbitmq");
    const channel = await connection.createChannel();
    const queue = "task_queue";

    await channel.assertQueue(queue, {
      durable: true,
    });

    channel.prefetch(1);
    console.log(" [x] Awaiting RPC requests");

    channel.consume(
      queue,
      (msg: ConsumeMessage | null) => {
        if (msg == null) {
          console.log("msg is null");
          return;
        }

        readyEvent(msg, channel);
        // const secs = msg.content.toString().split(".").length - 1;

        // console.log(" [x] Received %s", msg.content.toString());
        // setTimeout(() => {
        //   console.log(" [x] Done");
        //   channel.ack(msg);
        // }, secs * 1000);
      },
      {
        noAck: false,
      }
    );
  } catch (error) {
    console.error(error);
  }
}

worker();
