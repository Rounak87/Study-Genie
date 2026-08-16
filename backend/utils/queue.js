import './env.js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('⚠️ Missing REDIS_URL in environment. Background queues will fail to initialize.');
}

// Helper to create a new Redis connection instance
const createRedisConnection = () => {
  return redisUrl 
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: null, // MANDATORY requirement for BullMQ
        // Enforce TLS only if explicitly requested using secure rediss:// protocol
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
        keepAlive: 10000, // Send TCP keep-alive packets every 10s to prevent Upstash from closing idle sockets
      })
    : null;
};

// Dedicated connection for Queue operations
export const redisConnection = createRedisConnection();

if (redisConnection) {
  redisConnection.on('error', (err) => {
    if (err.message && err.message.includes('ECONNRESET')) {
      // Silent ignore transient connection resets from Upstash idle timeouts
    } else {
      console.error('❌ Redis connection error:', err.message);
    }
  });
}

// Dedicated connection builder for Worker operations (preventing socket sharing)
export const createWorkerConnection = () => {
  const conn = createRedisConnection();
  if (conn) {
    conn.on('error', (err) => {
      if (err.message && err.message.includes('ECONNRESET')) {
        // Silent ignore transient connection resets from Upstash idle timeouts
      } else {
        console.error('❌ Worker connection error:', err.message);
      }
    });
  }
  return conn;
};

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

if (documentQueue) {
  documentQueue.on('error', (err) => {
    if (err.message && err.message.includes('ECONNRESET')) {
      // Silent ignore transient connection resets from Upstash idle timeouts
    } else {
      console.error('❌ DocumentQueue error:', err.message || err);
    }
  });
}

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
