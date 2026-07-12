import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let embedModel = null;

const initEmbeddingModel = () => {
  if (embedModel) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable on the server!');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
};

/**
 * Generate a single 768-dimension text embedding vector
 * 
 * @param {string} text - The input text query
 * @returns {Promise<number[]>} - The embedding vector values
 */
export const generateEmbedding = async (text) => {
  initEmbeddingModel();
  console.log('🚀 Generating single query embedding via gemini-embedding-001...');
  
  const result = await embedModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });
  
  if (result && result.embedding && result.embedding.values) {
    return result.embedding.values;
  }
  throw new Error('Failed to generate valid single text embedding');
};

/**
 * Generate embeddings for a batch of text chunks, including quota retry logic
 * 
 * @param {string[]} chunks - Array of text segments
 * @param {number} retries - Number of retry attempts
 * @param {number} delayMs - Base millisecond delay for retry back-off
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export const generateEmbeddingsBatch = async (chunks, retries = 3, delayMs = 2000) => {
  initEmbeddingModel();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Calling Gemini API to batch-embed ${chunks.length} chunks (Attempt ${attempt}/${retries})...`);
      const response = await embedModel.batchEmbedContents({
        requests: chunks.map(chunk => ({
          content: { parts: [{ text: chunk }] },
          model: 'models/gemini-embedding-001',
          outputDimensionality: 768 // Match our Atlas Index settings
        }))
      });
      
      if (response && response.embeddings) {
        return response.embeddings.map(e => e.values);
      }
      throw new Error('Invalid embeddings format returned by Gemini API');
    } catch (error) {
      console.warn(`⚠️ Batch embedding attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      
      const isRateLimit = error.message.includes('429') || error.message.includes('Quota exceeded');
      const waitTime = isRateLimit ? delayMs * 3 : delayMs;
      console.log(`⏱️ Waiting ${waitTime}ms before retrying batch embedding...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};
