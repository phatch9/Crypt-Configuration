const Price = require('../models/Price');
const { redisClient } = require('../config/redis');

const getHistoricalPrices = async (req, res) => {
    const { symbol, limit = 100 } = req.query;

    if (!symbol) {
        return res.status(400).json({ message: 'Symbol is required' });
    }

    const cacheKey = `history:${symbol}:${limit}`;

    try {
        // 1. Check Redis Cache
        if (redisClient.isOpen) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('Serving from Redis Cache');
                return res.json(JSON.parse(cachedData));
            }
        }

        // 2. Fetch from MongoDB (TimeSeries)
        const prices = await Price.find({ symbol })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        // Sort back to ascending for display
        const sortedPrices = prices.reverse();

        // 3. Set Redis Cache (TTL 60 seconds)
        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 60, JSON.stringify(sortedPrices));
        }

        res.json(sortedPrices);
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getHistoricalPrices };
