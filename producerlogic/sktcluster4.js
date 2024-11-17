const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
//const cors = require("cors");
const { Pool } = require("pg");
const { kafka } = require('./client'); // Assuming you have kafka setup in 'client.js'
require('dotenv').config();
const PORT = 3011;
const app = express();
const cors = require("cors");

app.use(cors({
    origin: function (origin, callback) {
        // Allow any origin, including null (e.g., non-browser tools like Postman or curl)
        callback(null, true);
    },
    methods: ["GET", "POST"],
}));
app.use(express.json());


const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
    },
});

const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


let messageBuffer = [];

// Kafka Consumer
async function initClusterConsumer() {
    const consumer = kafka.consumer({ groupId: 'group_cluster_4' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'publisher-emojis', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const messageValue = message.value.toString();
                messageBuffer.push(JSON.parse(messageValue));
            } catch (error) {
                console.error("Error processing message:", error);
            }
        }
    });
}


// Clear buffer every 3 seconds
setInterval(() => {
    messageBuffer = [];
}, 3000);

// Register endpoint
app.post('/register', async (req, res) => {
    const { name, tier, password } = req.body;
    try {
        const client = await pool.connect();
        await client.query('INSERT INTO emoji_users (u_name, tier, pwd, connected) VALUES ($1, $2, $3, 0)', [name, tier, password]);
        client.release();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// New endpoint to provide connection details
app.post('/connect', async (req, res) => {
    const { name, password } = req.body;
    const currentPort = 3011;

    try {
        const client = await pool.connect();

        // Check capacity for the current cluster
        const capacityResult = await client.query(
            'SELECT capacity FROM cluster_info WHERE port = $1',
            [currentPort]
        );

        if (capacityResult.rows.length > 0 && capacityResult.rows[0].capacity > 28) {
            // Reduce capacity as we will connect to this cluster
            await client.query(
                `UPDATE cluster_info SET capacity = capacity - 1 WHERE port=${currentPort}`
            );
            console.log("Capacity available on current port.");
            res.json({ port: currentPort });
        } else {
            // Find an alternative cluster with available capacity
            const alternativeCluster = await client.query(
                'SELECT port, capacity FROM cluster_info WHERE capacity > 28 ORDER BY capacity ASC LIMIT 1'
            );

            if (alternativeCluster.rows.length > 0) {
                const { port: newPort } = alternativeCluster.rows[0];
                // Update capacity for the selected alternative cluster
                await client.query(
                    `UPDATE cluster_info SET capacity = capacity - 1 WHERE port=${newPort}`
                );
                res.json({ port: newPort });
            } else {
                res.status(503).json({ error: "All clusters are at full capacity." });
            }
        }

        client.release();

    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Failed to check cluster capacity" });
    }
});


// Socket connection for `/messages`
// Socket connection for `/messages`
io.on("connection", async (socket) => {
    console.log("New client connected");

    // Authenticate user
    socket.on("authenticate", async ({ name, password }) => {
        try {
            const client = await pool.connect();

            // Increase the connected count for this user
            await client.query(
                'UPDATE emoji_users SET connected = connected + 1 WHERE u_name = $1 AND pwd = $2',
                [name, password]
            );

            const result = await client.query(
                'SELECT connected, tier FROM emoji_users WHERE u_name = $1 AND pwd = $2',
                [name, password]
            );

            client.release();
            
            if (result.rows.length === 0) {
                socket.emit("error", { error: "User not found or incorrect credentials" });
                return;
            }

            const { connected, tier } = result.rows[0];

            // Check if the user has exceeded allowed connections for their tier
            if ((tier === 1 && connected > 5) || (tier === 2 && connected > 2) || (tier === 3 && connected > 1)) {
                socket.emit("error", { error: "Too many devices connected for this tier" });
                return;
            }

            // Authentication successful, proceed with message buffer handling
            socket.emit("authenticated", { message: "Authenticated successfully" });

            // Send the current message buffer and clear it after sending
            socket.emit("messageBuffer", messageBuffer);
            messageBuffer = [];

            // Push new messages to the client in real-time
            const interval = setInterval(() => {
                if (messageBuffer.length > 0) {
                    socket.emit("newMessages", messageBuffer);
                    messageBuffer = [];
                }
            }, 1000);

            // Handle client disconnect
            socket.on("disconnect", async () => {
                clearInterval(interval);
                const client = await pool.connect();
                await client.query(
                    'UPDATE emoji_users SET connected = connected - 1 WHERE u_name = $1 AND pwd = $2',
                    [name, password]
                );
                await client.query(
                    `UPDATE cluster_info SET capacity = capacity + 1 WHERE port=${PORT}`
                );
                client.release();
                console.log("Client disconnected and connection count updated");
            });

        } catch (error) {
            console.error("Database query error:", error);
            socket.emit("error", { error: "Failed to authenticate user" });
        }
    });
});


// Initialize Kafka consumer
initClusterConsumer().catch(console.error);

// Start the server

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
