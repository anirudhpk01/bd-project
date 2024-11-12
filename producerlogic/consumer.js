const { kafka } = require('./client');
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

async function initConsumer() {
    const consumer = kafka.consumer({ groupId: 'group-1' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'emoji', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const messageValue = message.value.toString();  // Parse the message value
            const parsedMessage = JSON.parse(messageValue);  // Convert JSON string back to object
            const { userId, emojiType, timestamp } = parsedMessage;

            console.log(`Received message from topic "${topic}":`);
            console.log(`User ID: ${userId}, Emoji Type: ${emojiType}, Timestamp: ${timestamp}`);
        }
    });
}

initConsumer().catch(console.error);
