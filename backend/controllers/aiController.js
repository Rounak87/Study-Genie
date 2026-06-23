import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let primaryModel = null;
let fallbackModel = null;

// Initialize Google Generative AI using the server API key
const initGemini = () => {
  if (primaryModel && fallbackModel) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing GEMINI_API_KEY environment variable on the server!');
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    
    const config = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    primaryModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: config,
    });

    fallbackModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: config,
    });

    console.log('✅ Server-side Gemini initialized (Primary: 2.5-flash, Fallback: 2.5-flash-lite)');
  } catch (error) {
    console.error('❌ Failed to initialize Google Generative AI:', error);
  }
};

// Check if error is a rate limit or quota error
const isQuotaExceeded = (error) => {
  const message = error?.message?.toLowerCase() || '';
  return (
    error?.status === 429 ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('exhausted')
  );
};

/**
 * @desc    Get general AI Tutor assistance
 * @route   POST /api/ai/ask
 * @access  Private
 */
export const askTutor = async (req, res) => {
  const { question, subject = 'general', complexity = 'intermediate', conversationHistory = [] } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Please provide a question' });
  }

  initGemini();

  if (!primaryModel) {
    return res.status(500).json({ success: false, error: 'Gemini AI service is not initialized on the server.' });
  }

  // Build the tutor-behavior educational prompt
  let prompt = `You are an expert educational AI tutor specialized in ${subject}.
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

  try {
    console.log('🚀 Calling Gemini API (Primary: 2.5-flash) for Tutor Chat...');
    const result = await primaryModel.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    return res.json({
      success: true,
      answer,
      source: 'gemini-flash',
    });
  } catch (error) {
    console.warn('⚠️ Primary Gemini model failed/exhausted:', error.message);

    if (fallbackModel) {
      console.log('🔄 Switching to backup model (Gemini 2.5 Flash-Lite)...');
      try {
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const answer = response.text().trim();

        return res.json({
          success: true,
          answer,
          source: 'gemini-flash-lite',
        });
      } catch (fallbackError) {
        console.error('❌ Gemini fallback model also failed:', fallbackError);
        return res.status(500).json({ success: false, error: 'All AI models failed to respond' });
      }
    }

    return res.status(500).json({ success: false, error: error.message || 'AI request failed' });
  }
};

/**
 * @desc    Get RAG Tutor answers based on document context
 * @route   POST /api/ai/rag-ask
 * @access  Private
 */
export const askRAG = async (req, res) => {
  const { question, excerpts = [], documentText = '', conversationHistory = [] } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Please provide a question' });
  }

  initGemini();

  if (!primaryModel) {
    return res.status(500).json({ success: false, error: 'Gemini AI service is not initialized on the server.' });
  }

  // Build the RAG system prompt
  let prompt = `You are a friendly, expert AI Study Tutor. A student has uploaded a document and is asking you questions about it. Your job is to provide **clear, detailed, and educational** answers based on the document content.

## Your Guidelines
- Answer using information from the document excerpts provided below
- Give thorough explanations with examples where helpful
- Use **markdown formatting**: headings, bold, bullet points, numbered lists
- If the excerpts don't contain the answer, say so honestly and share what you do know from the provided context
- Keep a warm, encouraging tone — you're a tutor, not a textbook
- For complex topics, break them down step-by-step

`;

  // Add document excerpts context (from IndexedDB match)
  if (excerpts && excerpts.length > 0) {
    prompt += `## Relevant Document Excerpts\n\n`;
    excerpts.forEach((excerpt, i) => {
      // Handle either string array or object array with .text key
      const excerptText = typeof excerpt === 'string' ? excerpt : (excerpt.text || excerpt.pageContent);
      if (excerptText) {
        prompt += `### Excerpt ${i + 1}\n${excerptText}\n\n`;
      }
    });
  } else if (documentText && documentText.length > 0) {
    // Fallback context: first 3000 characters
    const preview = documentText.substring(0, 3000);
    prompt += `## Document Overview\n${preview}\n\n`;
  }

  // Add RAG conversation history context
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-4);
    prompt += `## Recent Conversation\n`;
    recent.forEach((msg) => {
      // Supports both frontend-style formats {sender, text} or RAG tutor style {question, answer}
      if (msg.question && msg.answer) {
        prompt += `**Student:** ${msg.question}\n**Tutor:** ${msg.answer}\n\n`;
      } else if (msg.sender && msg.text) {
        prompt += `**${msg.sender}:** ${msg.text}\n\n`;
      }
    });
  }

  prompt += `## Student's Question\n${question}\n\n`;
  prompt += `## Your Answer (use markdown formatting)\n`;

  try {
    console.log('🚀 Calling Gemini API (Primary: 2.5-flash) for RAG Tutor...');
    const result = await primaryModel.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    return res.json({
      success: true,
      answer,
      source: 'gemini-flash',
    });
  } catch (error) {
    console.warn('⚠️ Primary Gemini model failed/exceeded quota in RAG mode:', error.message);

    if (fallbackModel) {
      console.log('🔄 Switching to backup model (Gemini 2.5 Flash-Lite) for RAG...');
      try {
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        const answer = response.text().trim();

        return res.json({
          success: true,
          answer,
          source: 'gemini-flash-lite',
        });
      } catch (fallbackError) {
        console.error('❌ Gemini fallback model failed for RAG:', fallbackError);
        return res.status(500).json({ success: false, error: 'All AI models failed to respond' });
      }
    }

    return res.status(500).json({ success: false, error: error.message || 'AI request failed' });
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

  initGemini();

  if (!genAI) {
    return res.status(500).json({ success: false, error: 'Gemini AI service is not initialized on the server.' });
  }

  try {
    const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    if (text) {
      console.log('🚀 Generating single query embedding server-side...');
      const result = await embedModel.embedContent(text);
      return res.json({
        success: true,
        embedding: result.embedding.values,
      });
    }

    console.log(`🚀 Batch generating ${texts.length} embeddings server-side...`);
    const result = await embedModel.batchEmbedContents({
      requests: texts.map((t) => ({
        content: { parts: [{ text: t }] },
        model: 'models/text-embedding-004',
      })),
    });

    const embeddings = result.embeddings.map((e) => e.values);

    return res.json({
      success: true,
      embeddings,
    });
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'Embedding generation failed' });
  }
};
