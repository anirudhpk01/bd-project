const { kafka } = require('./client');
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

async function initConsumerAndProducer() {
    const consumer = kafka.consumer({ groupId: 'group-2' });
    await consumer.connect();

    const producer = kafka.producer();
    await producer.connect();

    // Subscribe to the "emoji-counts-topic" instead of "emoji"
    await consumer.subscribe({ topic: 'emoji-counts', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const messageValue = message.value.toString();  // Parse the message value
                const parsedMessage = JSON.parse(messageValue);  // Convert JSON string back to object

                // Extract relevant fields based on Spark output
                const { window, emojiType, frequency } = parsedMessage;

                // Format the window start and end timestamps if needed
                const windowStart = new Date(window.start).toLocaleString();
                const windowEnd = new Date(window.end).toLocaleString();

                console.log(`Received message from topic "${topic}":`);
                console.log(`Window: ${windowStart} - ${windowEnd}`);
                console.log(`Emoji Type: ${emojiType}, Frequency: ${frequency}`);

                // Send the received message to the new Kafka topic "publisher-emojis"
                await producer.send({
                    topic: 'publisher-emojis',
                    messages: [
                        { value: messageValue }  // Forward the exact same message
                    ]
                });

                console.log(`Message forwarded to topic "publisher-emojis"`);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        }
    });
}

initConsumerAndProducer().catch(console.error);

// Start Express server if needed for future routes or other purposes
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Publisher app listening on port ${PORT}`);
});
