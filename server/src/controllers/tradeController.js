const Trade = require('../models/Trade');
const { redisClient } = require('../config/redis');

const executeTrade = async (req, res) => {
    const { symbol, type, amount, price } = req.body;
    const userId = req.user._id;

    if (!symbol || !type || !amount || !price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Simulate "Real-time" Latency Check or Balance Check
    // In a real app, we'd check DB balance here.
    // For "Crypto Pilot" demo, we just record it.

    const total = amount * price;

    try {
        const trade = await Trade.create({
            user: userId,
            symbol,
            type,
            price,
            amount,
            total
        });

        // Invalidate or update caches if necessary?
        // For now, just return success.

        res.status(201).json(trade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrades = async (req, res) => {
    try {
        const trades = await Trade.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(50);
        res.json(trades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { executeTrade, getTrades };
