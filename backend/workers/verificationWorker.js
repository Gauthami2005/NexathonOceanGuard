const { Worker } = require('bullmq');
const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path'); // Using path module for robustness
const Hazard = require('../models/hazard'); 

// ✅ CORRECTED PATH: This now correctly points to the .env file in your backend folder
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- Database & Redis Connection ---
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Use a combined variable for flexibility
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('FATAL ERROR: MONGODB_URI (or MONGO_URI) is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Worker connected to MongoDB Atlas.'))
  .catch((err) => console.error('Worker MongoDB connection error:', err));


// --- The Worker Logic ---
const worker = new Worker('ai-verification', async (job) => {
  const { reportIds, description, location } = job.data;
  console.log(`[WORKER] Processing job ${job.id}: Verifying ${reportIds.length} reports.`);

  try {
    const aiResponse = await axios.post('http://localhost:8000/verify-hazard', { 
      description,
      location
    });
    
    const { isHazard, confidence } = aiResponse.data;
    const finalStatus = isHazard ? 'verified' : 'rejected';

    await Hazard.updateMany(
      { _id: { $in: reportIds } },
      { $set: { status: finalStatus } }
    );
    console.log(`[WORKER] Job ${job.id} complete. Status: ${finalStatus}, Confidence: ${confidence}`);
  } catch (error) {
    console.error(`[WORKER] Job ${job.id} failed:`, error.message);
    throw error;
  }
}, { connection: redisConnection });

console.log("✅ Verification worker is running and waiting for jobs...");

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

