import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let primaryModel = null;
let fallbackModel = null;

const initAI = () => {
  if (primaryModel && fallbackModel) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable on the server!');
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
    
    console.log('✅ AI Service initialized (Primary: 2.5-flash, Fallback: 2.5-flash-lite)');
  } catch (error) {
    console.error('❌ Failed to initialize Google Generative AI:', error);
    throw error;
  }
};

/**
 * Generate standard text or JSON response content with fallback support
 * 
 * @param {string} prompt - The prompt to submit
 * @param {object} options - Options including json (boolean)
 * @returns {Promise<{ answer: string, source: string }>}
 */
export const generateContent = async (prompt, options = {}) => {
  initAI();
  const { json = false } = options;

  let activeModel = primaryModel;
  let activeFallback = fallbackModel;

  if (json) {
    try {
      activeModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });
      activeFallback = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });
    } catch (e) {
      console.warn('Failed to configure JSON model, using defaults:', e.message);
    }
  }

  try {
    console.log(`🚀 Calling Gemini API (json=${json}) for Prompt...`);
    const result = await activeModel.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    return {
      answer,
      source: json ? 'gemini-flash-json' : 'gemini-flash',
    };
  } catch (error) {
    console.warn('⚠️ Primary Gemini model failed/exhausted:', error.message);

    if (activeFallback) {
      console.log('🔄 Switching to backup model...');
      try {
        const result = await activeFallback.generateContent(prompt);
        const response = await result.response;
        const answer = response.text().trim();

        return {
          answer,
          source: json ? 'gemini-flash-lite-json' : 'gemini-flash-lite',
        };
      } catch (fallbackError) {
        console.error('❌ Gemini fallback model also failed:', fallbackError);
        throw new Error('All AI models failed to respond');
      }
    }

    throw error;
  }
};

/**
 * Stream text response content chunk-by-chunk using Server-Sent Events (SSE)
 * 
 * @param {object} res - Express response stream
 * @param {string} prompt - The prompt to stream
 * @returns {Promise<void>}
 */
export const streamContent = async (res, prompt) => {
  initAI();

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    console.log('🚀 Calling Gemini API (Primary: 2.5-flash) for streaming Prompt...');
    const result = await primaryModel.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (error) {
    console.warn('⚠️ Primary Gemini model failed/exceeded quota in streamContent:', error.message);

    if (fallbackModel) {
      console.log('🔄 Switching to backup model (Gemini 2.5 Flash-Lite) for streaming fallback...');
      try {
        const result = await fallbackModel.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (fallbackError) {
        console.error('❌ Gemini fallback model failed for streaming Content:', fallbackError);
        res.write(`data: ${JSON.stringify({ error: 'All AI models failed to respond' })}\n\n`);
        return res.end();
      }
    }

    res.write(`data: ${JSON.stringify({ error: error.message || 'AI request failed' })}\n\n`);
    return res.end();
  }
};
