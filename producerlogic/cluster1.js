const { kafka } = require('./client');
const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config();
app.use(cors());
app.use(express.json());
const { Pool } = require('pg');
// Buffer to hold messages from the topic
let messageBuffer = [];

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    user: PGUSER, // Use 'user' instead of 'username' for Pool config
    password: PGPASSWORD,
    port: 5432,
    ssl: {
      require: true,
    },
  });

// Kafka Consumer
async function initClusterConsumer() {
    const consumer = kafka.consumer({ groupId: 'group-cluster-1' });
    await consumer.connect();
    
    // Subscribe to the "publisher-emojis" topic
    await consumer.subscribe({ topic: 'publisher-emojis', fromBeginning: true });

    // Run the consumer to store messages in the buffer
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const messageValue = message.value.toString();  // Parse the message value as string
                messageBuffer.push(JSON.parse(messageValue));    // Store parsed message in buffer
            } catch (error) {
                console.error("Error processing message:", error);
            }
        }
    });
}


setInterval(() => {
    messageBuffer = [];
}, 3000);



// API endpoint to return all messages in the buffer
app.get('/messages', async (req, res) => {
    const { name, password } = req.body;
    try {
        const client = await pool.connect();

        // Increment the `connected` count for the user
        await client.query(
            'UPDATE emoji_users SET connected = connected + 1 WHERE u_name = $1 AND pwd = $2',
            [name, password]
        );

        // Fetch the updated `connected` and `tier` values for this user
        const result = await client.query(
            'SELECT connected, tier FROM emoji_users WHERE u_name = $1 AND pwd = $2',
            [name, password]
        );

        // Release client after fetching data
        client.release();

        // Check if the user exists
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found or incorrect credentials" });
        }

        // Extract `connected` and `tier` values
        const { connected, tier } = result.rows[0];

        // Validate the connected count based on tier
        if ((tier === 1 && connected > 3) || (tier === 2 && connected > 2) || (tier === 3 && connected > 1)) {
            return res.status(403).json({ error: "Too many devices connected for this tier" });
        }

        // All checks passed, return the message buffer
        res.json(messageBuffer);

        // Optional: Clear buffer after sending to only show new messages on next request
        messageBuffer = [];

    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});


// Initialize the Kafka consumer
initClusterConsumer().catch(console.error);

app.post('/register', async (req,res)=>{
    const { name , tier , password }= req.body
    try{
    const client = await pool.connect();
    const result = await client.query('insert into emoji_users values ($1,$2,$3,0);',[name,tier,password]);
    console.log(result.rows)

    client.release();
    res.status(201).json({ message: "User registered successfully", result: result.rows });

    }
    catch(error){
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to fetch data" });

    }



})


app.post('/logout', async (req, res) => {
    const { name, password } = req.body;
    try {
        const client = await pool.connect();
        // Fetch the current `connected` count for the user
        const result = await client.query(
            'SELECT connected FROM emoji_users WHERE u_name = $1 AND pwd = $2',
            [name, password]
        );
        // Check if the user exists
        if (result.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: "User not found or incorrect credentials" });
        }
        // Extract `connected` value
        const { connected } = result.rows[0];
        // Check if `connected` is already zero
        if (connected <= 0) {
            client.release();
            return res.status(400).json({ error: "User is not connected to any device" });
        }

        // Decrement the `connected` count
        await client.query(
            'UPDATE emoji_users SET connected = connected - 1 WHERE u_name = $1 AND pwd = $2',
            [name, password]
        );
        // Release the client and send a success response
        client.release();
        res.json({ message: "User successfully logged out" });

    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Failed to log out user" });
    }
});


// Start Express server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Cluster consumer app listening on port ${PORT}`);
});
