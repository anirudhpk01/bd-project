const { kafka } = require('./client');  // Kafka client configuration
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const producer = kafka.producer();
let messageQueue = [];

//we have a post endpoint ready AND by default we also have a script here which produces vast scale of messages




// Initialize the producer and connect
async function initProducer() {
    await producer.connect();
    console.log("Producer connected");

    // Set an interval to send messages from the queue every 0.5 seconds
    setInterval(async () => {
        if (messageQueue.length > 0) {
            const messagesToSend = messageQueue.splice(0, messageQueue.length);  // Grab all messages in the queue
            await producer.send({
                topic: 'emoji',
                messages: messagesToSend
            });
            console.log(`Sent ${messagesToSend.length} messages:`, messagesToSend);
        }
    }, 500);  // 0.5-second interval
}

initProducer().catch(console.error);

// Function to automatically produce messages every 2 seconds
function produceEmojisAutomatically() {
    setInterval(() => {
        // Send 2 happy emojis and 1 sad emoji every 2 seconds
        const timestamp = Date.now();
        const messages = [
            { key: 'user1', value: JSON.stringify({ userId: 'user1', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'happy', timestamp }) },
            { key: 'user2', value: JSON.stringify({ userId: 'user2', emojiType: 'sad', timestamp }) },
            { key: 'user3', value: JSON.stringify({ userId: 'user3', emojiType: 'sad', timestamp }) }
        ];
        messageQueue.push(...messages);
        console.log("Queued messages:", messages);
    }, 2000);  // 2-second interval
}

produceEmojisAutomatically();

// POST endpoint to receive messages (remains unchanged)
app.post('/api/emojisend', async (req, res) => {
    const { userId, emojiType } = req.body;

    if (!userId || !emojiType) {
        return res.status(400).json({ error: "User ID and Emoji type are required" });
    }

    // Generate the timestamp on the server side
    const timestamp = Date.now();

    // Add the message to the queue
    messageQueue.push({
        key: userId.toString(),  // Converting User ID to a string for Kafka key
        value: JSON.stringify({ userId, emojiType, timestamp })  // Stringify the object for Kafka
    });
    console.log(`Queued message: userId=${userId}, emojiType=${emojiType}, timestamp=${timestamp}`);

    res.status(200).json({ message: "Message queued for sending" });
});

// Start the Express server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
