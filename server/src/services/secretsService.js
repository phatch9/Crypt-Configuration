// Simulates fetching secrets from AWS Secrets Manager
// In a real environment, this would use @aws-sdk/client-secrets-manager

const getSecret = async (secretName) => {
    // Simulate network latency of AWS call
    if (process.env.NODE_ENV === 'production') {
        // Mocking the async nature of AWS SDK
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const secrets = {
        'MONGO_URI': process.env.MONGO_URI || 'mongodb://localhost:27017/drcrypt',
        'JWT_SECRET': process.env.JWT_SECRET || 'secret',
        'REDIS_URL': process.env.REDIS_URL || 'redis://localhost:6379'
    };

    if (secrets[secretName]) {
        return secrets[secretName];
    } else {
        throw new Error(`Secret ${secretName} not found`);
    }
};

module.exports = { getSecret };
