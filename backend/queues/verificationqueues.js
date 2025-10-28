const { Queue } = require('bullmq');

// This code assumes your Redis server is running locally on the default port.
// You should use environment variables for a real application.
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Creates the queue named 'ai-verification'
const verificationQueue = new Queue('ai-verification', { connection: redisConnection });

console.log("AI Verification Queue is ready to accept jobs.");

module.exports = verificationQueue;

