import mongoose from 'mongoose';
import Document from '../models/Document.js';
import DocumentChunk from '../models/DocumentChunk.js';
import * as aiService from '../services/aiService.js';
import * as embeddingService from '../services/embeddingService.js';
import * as dktService from '../services/dktService.js';

/**
 * @desc    Get general AI Tutor assistance
 * @route   POST /api/ai/ask
 * @access  Private
 */
export const askTutor = async (req, res) => {
  const { question, subject = 'general', complexity = 'intermediate', conversationHistory = [], raw = false, json = false } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Please provide a question' });
  }

  // 1. Prepare Prompt
  let prompt = '';
  if (raw) {
    prompt = question;
  } else {
    // Build the tutor-behavior educational prompt
    prompt = `You are an expert educational AI tutor specialized in ${subject}.
Student's question: "${question}"
Complexity level: ${complexity}

`;

    // Add conversation history context
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory
        .slice(-3)
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join('\n');
      prompt += `\nRecent conversation:\n${recentHistory}\n`;
    }

    prompt += `\nProvide a clear, educational response suitable for a student. Use examples and step-by-step explanations when helpful. Keep the response concise (under 200 words).`;
  }

  try {
    const result = await aiService.generateContent(prompt, { json });
    return res.json({
      success: true,
      answer: result.answer,
      source: result.source,
    });
  } catch (error) {
    console.error('❌ askTutor failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'AI request failed' });
  }
};

/**
 * @desc    Get RAG Tutor answers based on document context
 * @route   POST /api/ai/rag-ask
 * @access  Private
 */
export const askRAG = async (req, res) => {
  const { question, documentId, conversationHistory = [] } = req.body;

  if (!question || !documentId) {
    return res.status(400).json({ success: false, error: 'Please provide question and documentId' });
  }

  // 1. Fetch document name for prompt personalization
  let docName = 'Document';
  try {
    const document = await Document.findById(documentId).select('name');
    if (document) {
      docName = document.name;
    }
  } catch (err) {
    console.warn('Could not retrieve document name:', err.message);
  }

  // 2. Generate vector embedding for the query using embeddingService
  let relevantChunks = [];
  try {
    const queryVector = await embeddingService.generateEmbedding(question);

    // 3. Query MongoDB Atlas Vector Search
    console.log(`🔍 Querying MongoDB Atlas Vector Search for docId: ${documentId}`);
    const results = await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index', // Atlas Vector Search index name
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 40,
          limit: 4,
          filter: {
            documentId: new mongoose.Types.ObjectId(documentId)
          }
        }
      }
    ]);

    console.log(`✅ Atlas Vector Search retrieved ${results.length} relevant chunks.`);
    relevantChunks = results.map(r => r.text);

  } catch (error) {
    console.error('❌ MongoDB Atlas Vector Search query failed:', error);
    // Graceful fallback to document's textContent if index doesn't exist yet
    console.log('🔄 Vector Search failed or index not ready. Falling back to document text overview...');
    try {
      const doc = await Document.findById(documentId).select('textContent');
      if (doc && doc.textContent) {
        relevantChunks = [doc.textContent.substring(0, 3000)];
      }
    } catch (fallbackErr) {
      console.error('Fallback failed:', fallbackErr);
    }
  }

  // 4. Build prompt
  let prompt = `You are a friendly, expert AI Study Tutor. A student has uploaded a document named "${docName}" and is asking you questions about it. Your job is to provide **clear, detailed, and educational** answers based on the document content.

## Your Guidelines
- Answer using information from the document excerpts provided below
- Give thorough explanations with examples where helpful
- Use **markdown formatting**: headings, bold, bullet points, numbered lists
- If the excerpts don't contain the answer, say so honestly and share what you do know from the provided context
- Keep a warm, encouraging tone — you're a tutor, not a textbook
- For complex topics, break them down step-by-step

`;

  if (relevantChunks && relevantChunks.length > 0) {
    prompt += `## Relevant Document Excerpts\n\n`;
    relevantChunks.forEach((excerpt, i) => {
      prompt += `### Excerpt ${i + 1}\n${excerpt}\n\n`;
    });
  }

  // Add RAG conversation history context
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-4);
    prompt += `## Recent Conversation\n`;
    recent.forEach((msg) => {
      if (msg.question && msg.answer) {
        prompt += `**Student:** ${msg.question}\n**Tutor:** ${msg.answer}\n\n`;
      } else if (msg.sender && msg.text) {
        prompt += `**${msg.sender}:** ${msg.text}\n\n`;
      }
    });
  }

  prompt += `## Student's Question\n${question}\n\n`;
  prompt += `## Your Answer (use markdown formatting)\n`;

  // 5. Delegate streaming to aiService
  try {
    await aiService.streamContent(res, prompt);
  } catch (streamError) {
    console.error('❌ Streaming RAG failed:', streamError);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to stream response' });
    }
  }
};

/**
 * @desc    Generate text embeddings (supports both single string or array of strings)
 * @route   POST /api/ai/embed
 * @access  Private
 */
export const generateEmbeddings = async (req, res) => {
  const { texts, text } = req.body;

  if (!texts && !text) {
    return res.status(400).json({ success: false, error: 'Please provide texts array or text string' });
  }

  try {
    if (text) {
      const embedding = await embeddingService.generateEmbedding(text);
      return res.json({
        success: true,
        embedding,
      });
    }

    const embeddings = await embeddingService.generateEmbeddingsBatch(texts);
    return res.json({
      success: true,
      embeddings,
    });
  } catch (error) {
    console.error('❌ generateEmbeddings failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'AI request failed' });
  }
};

/**
 * @desc    Get Deep Knowledge Tracing mastery prediction
 * @route   POST /api/ai/dkt-predict
 * @access  Private
 */
export const getDKTPrediction = async (req, res) => {
  const { interactions } = req.body;

  if (!interactions || !Array.isArray(interactions)) {
    return res.status(400).json({ success: false, error: 'Please provide interactions array' });
  }

  try {
    const prediction = await dktService.getPrediction(interactions);
    return res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('❌ getDKTPrediction failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'DKT prediction failed' });
  }
};

