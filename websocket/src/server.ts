import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
// import { RedisAdapter } from "@socket.io/redis-adapter";
import * as common from "react-video-call-common";

import { initializeApp } from "firebase-admin/app";

import { throttle } from "lodash";

import amqp from "amqplib";

import { Kafka, Producer } from "kafkajs";

let kafka: Kafka;
let kafkaProducer: Producer;

let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

// const connectRabbit = async () => {
//   rabbitConnection = await amqp.connect("amqp://rabbitmq");
//   rabbitChannel = await rabbitConnection.createChannel();
//   console.log("rabbit connected");
// };

const connectKafkaProducer = async () => {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["my-cluster-kafka-bootstrap:9092"],
  });
  kafkaProducer = kafka.producer();
  await kafkaProducer.connect();
  console.log("kafka producer connected");
};

// const queueReadyEvent = async (message: string) => {
//   try {
//     await rabbitChannel.assertQueue(common.readyQueueName, { durable: true });
//     rabbitChannel.sendToQueue(common.readyQueueName, Buffer.from(message));

//     // console.log(` [x] Sent message: ${message}`);
//   } catch (error) {
//     console.error(error);
//   }
// };

dotenv.config();

initializeApp();

const serverID = uuid();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const pubClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  name: "websocket",
});

pubClient.on("error", function (error) {
  console.error(error);
});

const subClient = pubClient.duplicate();

app.get("*", (req, res) => {
  res.send("This is the API server :)");
});

io.on("error", (err)=>{
  console.log("io err", err)
})

io.on("connection", async (socket) => {

  socket.on("error", (err) => {
    console.log("socket err", err)
  });

  console.log(`connection on ${serverID}`)
  // console.log("connected");

  pubClient.sAdd(common.activeSetName, socket.id);

  socket.on("myping", (arg, callback) => {
    // console.log("myping", arg, callback);
    try {
      if (callback != undefined) callback("ping ding dong");
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("message", (msg) => {
    console.log("message:", msg);
  });

  socket.on("ready", async (data, callback) => {
    pubClient.sAdd(common.readySetName, socket.id);

    await kafkaProducer.send({
      topic: "test-topic",
      messages: [{ value: socket.id }],
    });

    if (callback != undefined) {
      callback();
    }
  });

  // let updateCount = 0;
  // const myInterval = setInterval(async () => {
  //   updateCount = updateCount + 1;
  //   socket.emit("message", `updateCount: ${updateCount}`);
  // }, 5000);

  socket.on("disconnect", async () => {
    // console.log("disconnected");
    // clearInterval(myInterval);
    pubClient.sRem(common.activeSetName, socket.id);
    pubClient.sRem(common.readySetName, socket.id);
    pubClient.publish(common.activeCountChannel, `change`);
  });

  socket.on("client_host", (value) => {
    socket.to(`room-${socket.id}`).emit("client_guest", value);
  });

  socket.on("client_guest", (value) => {
    socket.to(`room-${socket.id}`).emit("client_host", value);
  });

  socket.on("icecandidate", (value) => {
    socket.to(`room-${socket.id}`).emit("icecandidate", value);
  });

  pubClient.publish(common.activeCountChannel, `change`);

  socket.emit("message", `Hey from server :) I am ${serverID}.`);

  // setTimeout(() => {
  //   socket.timeout(1000).emit("myping", "hello", (err: any, response: any) => {
  //     if (err) {
  //       console.error("err", err);
  //     } else {
  //       // console.log("response", response);
  //     }
  //   });
  // }, 1000);
});

Promise.all([pubClient.connect(), subClient.connect()])
  .then(async () => {
    await connectKafkaProducer();
  })
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    httpServer.listen(4000);
    console.log("server started");
  })
  .then(() => {
    subClient.subscribe(
      common.activeCountChannel,
      throttle(async (msg) => {
        io.emit("activeCount", await pubClient.sCard(common.activeSetName));
      }, 1000)
    );
  });
