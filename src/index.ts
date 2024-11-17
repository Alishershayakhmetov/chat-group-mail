import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Kafka } from "kafkajs";
import { emailClient } from './emailClient.js';
const app = express();
const port = process.env.APP_PORT!;

app.use(
  cors({
    origin: process.env.BASE_WEBAPP_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const kafka = new Kafka({
  clientId: process.env.BROKER_CLIENT_ID,
  brokers: [process.env.BROKER_URL!]
});

const consumer = kafka.consumer({ groupId: process.env.BROKER_GROUP_ID! });

const consumeMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.BROKER_TOPIC!, fromBeginning: true });
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      if(!message.value) return;
      const data = JSON.parse(message.value.toString());
      // Implement your email-sending logic here using `data`
      await emailClient.sendMail({
        from: `"Your App" <${process.env.EMAIL_FROM}>`,
        to: data.email,
        subject: 'Email Verification',
        text: data.text,
        html: data.HTMLText,
      });
      console.log(`Sending email to: ${data.email} with content: ${data.text}`);
    },
  });
};

consumeMessages();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

