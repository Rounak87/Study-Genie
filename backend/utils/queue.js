import './env.js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('⚠️ Missing REDIS_URL in environment. Background queues will fail to initialize.');
}

// ioredis client configuration
export const redisConnection = redisUrl 
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null, // MANDATORY requirement for BullMQ
      // Automatically enforce TLS for secure cloud hosting (Upstash/Redislabs)
      tls: (redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io')) ? { rejectUnauthorized: false } : undefined,
    })
  : null;

if (redisConnection) {
  redisConnection.on('connect', () => {
    console.log('✅ Connected to Upstash Redis for BullMQ');
  });
  redisConnection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });
}

// Create Queue named 'document-processing'
export const documentQueue = redisConnection 
  ? new Queue('document-processing', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3, // Automatically retry up to 3 times on failures (e.g. Gemini timeout)
        backoff: {
          type: 'exponential',
          delay: 5000 // Wait 5s, 10s, 20s before retrying
        },
        removeOnComplete: { count: 100 }, // Avoid memory bloat in Upstash Redis
        removeOnFail: { count: 100 }
      }
    })
  : null;

/**
 * Add a job to the queue to parse and index a document
 * 
 * @param {string} documentId - Document database ID
 * @param {string} r2Key - Cloudflare R2 file key
 * @param {string} userId - User ID
 * @param {string} mimeType - MIME type of the file
 */
export const addDocumentJob = async (documentId, r2Key, userId, mimeType) => {
  if (!documentQueue) {
    console.error(`❌ Queue is not initialized. Cannot process document ${documentId}`);
    throw new Error('Task queue is not initialized. Please verify your Redis configuration.');
  }

  console.log(`📡 Adding document processing job for docId: ${documentId} (r2Key: ${r2Key})`);
  
  return await documentQueue.add(
    'process-document', 
    { documentId, r2Key, userId, mimeType },
    { jobId: documentId.toString() } // Deduplicate jobs for the same document
  );
};
