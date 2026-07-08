import './utils/env.js';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { getR2Client, getR2BucketName } from './utils/r2.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { parseDocumentBuffer } from './utils/documentParser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Document from './models/Document.js';
import DocumentChunk from './models/DocumentChunk.js';
import { redisConnection } from './utils/queue.js';



const apiKey = process.env.GEMINI_API_KEY;

// Simple chunking helper (overlapping character chunks)
function chunkText(text, chunkSize = 800, overlap = 150) {
  if (!text || text.length === 0) return [];
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at a sentence or newline boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(". ", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());

    // Ensure start moves forward
    const nextStart = end - overlap;
    start = nextStart > start ? nextStart : end;
    if (start >= text.length) break;
  }

  return chunks.filter(c => c.length > 5);
}

// Worker logic wrapped in a startup check
const startWorker = () => {
  if (!redisConnection) {
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
      console.log(`🔗 Downloading binary from R2: ${r2Key}`);
      const r2Client = getR2Client();
      const bucketName = getR2BucketName();

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: r2Key,
      });

      const r2Response = await r2Client.send(getCommand);
      const bytes = await r2Response.Body.transformToByteArray();
      const buffer = Buffer.from(bytes);

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

      // 5. Generate Vector Embeddings using Google Gemini API
      if (chunks.length > 0) {
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is missing. Cannot generate embeddings.');
        }

        console.log('🤖 Connecting to Gemini text-embedding-004 model...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        // Clean existing chunks for this document in case of retries
        await DocumentChunk.deleteMany({ documentId });

        // Generate embeddings in batches of 30 to avoid rate limits
        const batchSize = 30;
        const chunkDocuments = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          console.log(`🔄 Embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}...`);

          const embedResult = await embedModel.batchEmbedContents({
            requests: batch.map((t) => ({
              content: { parts: [{ text: t }] },
              model: 'models/text-embedding-004',
            })),
          });

          const embeddings = embedResult.embeddings.map((e) => e.values);

          batch.forEach((textItem, idx) => {
            chunkDocuments.push({
              documentId,
              userId,
              text: textItem,
              embedding: embeddings[idx],
              chunkIndex: i + idx,
            });
          });
        }

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
    connection: redisConnection,
    concurrency: 2 // Allow processing up to 2 documents concurrently
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Worker: Job ${job?.id} failed permanently:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker connection error:', err);
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
