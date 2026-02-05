require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const connectBinance = require('./services/binanceService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database & Redis
connectDB();
connectRedis().then(() => {
    // Start Binance Stream only after Redis is ready
    connectBinance();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Setup WebSocket for Frontend
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to local WS');

    // Subscribe to Redis updates and forward to frontend
    const subscriber = redisClient.duplicate();
    subscriber.connect().then(() => {
        subscriber.subscribe('price_updates', (message) => {
            ws.send(message);
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        subscriber.quit();
    });
});

app.get('/', (req, res) => {
    res.send('Dr.Crypt API is running');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
