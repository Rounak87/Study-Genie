import './utils/env.js';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import * as storageService from './services/storageService.js';
import * as embeddingService from './services/embeddingService.js';
import { parseDocumentBuffer } from './utils/documentParser.js';
import Document from './models/Document.js';
import DocumentChunk from './models/DocumentChunk.js';
import { createWorkerConnection } from './utils/queue.js';

// Helper delay sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple chunking helper - splits any document into at most 4 large overlapping chunks
// This guarantees that we only need exactly 1 Gemini API request to embed the entire document.
function chunkText(text, maxChunks = 4) {
  if (!text || text.length === 0) return [];
  
  // If the document is small (under 8k chars), return it as a single chunk
  if (text.length < 8000) {
    return [text];
  }
  
  const chunks = [];
  const chunkSize = Math.ceil(text.length / maxChunks);
  const overlap = 1500; // 1500 characters overlap for context continuity
  
  let start = 0;
  while (start < text.length && chunks.length < maxChunks) {
    let end = start + chunkSize;
    if (chunks.length < maxChunks - 1 && end + overlap < text.length) {
      end += overlap;
    } else {
      end = text.length;
    }
    
    // Adjust end to end of a sentence if possible
    if (end < text.length) {
      const nextPeriod = text.indexOf('.', end);
      if (nextPeriod !== -1 && nextPeriod < end + 500) {
        end = nextPeriod + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start += chunkSize;
  }
  
  return chunks;
}

// Worker logic wrapped in a startup check
const startWorker = () => {
  const workerConnection = createWorkerConnection();
  if (!workerConnection) {
    console.error('❌ Cannot start BullMQ Worker: Redis connection is not initialized.');
    return;
  }

  console.log('👷 BullMQ Worker starting...');

  const worker = new Worker('document-processing', async (job) => {
    const { documentId, r2Key, userId, mimeType } = job.data;
    console.log(`📥 Worker processing job ${job.id} for Document ${documentId}`);

    try {
      // 1. Update Document status to processing
      await Document.findByIdAndUpdate(documentId, { status: 'processing' });

      // 2. Fetch binary from Cloudflare R2
      const buffer = await storageService.downloadFile(r2Key);

      // 3. Extract text content using our modular parser
      console.log('📝 Extracting text from document buffer...');
      const extractedText = await parseDocumentBuffer(buffer, mimeType);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from this document.');
      }

      console.log(`✅ Text extracted successfully. Character count: ${extractedText.length}`);

      // 4. Create chunks
      console.log('📦 Chunking text for embeddings...');
      const chunks = chunkText(extractedText);
      console.log(`Generated ${chunks.length} chunks from document.`);

      // 5. Generate Vector Embeddings using embeddingService
      if (chunks.length > 0) {
        // Clean existing chunks for this document in case of retries
        await DocumentChunk.deleteMany({ documentId });

        console.log(`📡 Generating vector embeddings for ${chunks.length} chunks...`);
        const embeddings = await embeddingService.generateEmbeddingsBatch(chunks);

        const chunkDocuments = chunks.map((textItem, idx) => ({
          documentId,
          userId,
          text: textItem,
          embedding: embeddings[idx],
          chunkIndex: idx,
        }));

        console.log(`💾 Inserting ${chunkDocuments.length} chunks into MongoDB...`);
        await DocumentChunk.insertMany(chunkDocuments);
      }

      // 6. Complete Document record update
      await Document.findByIdAndUpdate(documentId, {
        textContent: extractedText,
        textExtractionMethod: 'server-pdf',
        status: 'completed'
      });

      console.log(`🎉 Job ${job.id} completed successfully for document ${documentId}`);
      return { success: true, chunksCount: chunks.length };

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      
      // Update document status to failed
      try {
        await Document.findByIdAndUpdate(documentId, { status: 'failed' });
      } catch (dbErr) {
        console.error('Failed to update document status to failed in database:', dbErr.message);
      }

      throw error; // Let BullMQ handle retry mechanism
    }
  }, { 
    connection: workerConnection,
    concurrency: 2 // Allow processing up to 2 documents concurrently
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Worker: Job ${job?.id} failed permanently:`, err.message);
  });

  worker.on('error', (err) => {
    if (err.message && err.message.includes('ECONNRESET')) {
      // Silent ignore transient connection resets from Upstash idle timeouts
    } else {
      console.error('❌ Worker connection error:', err.message || err);
    }
  });
};

// Check connection and start
if (mongoose.connection.readyState === 1) {
  startWorker();
} else {
  // If imported standalone or mongoose not ready yet
  mongoose.connection.once('open', startWorker);
  
  // If running standalone file directly from terminal: node backend/worker.js
  if (process.argv[1] && process.argv[1].endsWith('worker.js')) {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/study-genie";
    console.log(`🔌 Standalone worker connecting to MongoDB: ${mongoUri}`);
    mongoose.connect(mongoUri).catch((err) => {
      console.error('Mongoose connection failed in standalone worker:', err);
    });
  }
}
