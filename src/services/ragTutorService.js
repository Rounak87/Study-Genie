

import { GoogleGenerativeAI } from "@google/generative-ai";

class RagTutorService {
  constructor() {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      
      const config = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      };

      // Primary Model
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: config,
      });

      // Fallback Model (used when quota is exceeded)
      this.fallbackModel = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: config,
      });

      console.log("✅ RAG Tutor Service initialized (Primary: 2.5 Flash, Fallback: 2.5 Flash-Lite)");
    } else {
      this.model = null;
      this.fallbackModel = null;
      console.warn("⚠️ No Gemini API key found for RAG Tutor");
    }

    this.conversationHistory = [];
  }

  // ──────────────────────────────────────────────
  //  LOCAL TEXT CHUNKING (no API call)
  // ──────────────────────────────────────────────

  /**
   * Split text into overlapping chunks locally.
   */
  chunkText(text, chunkSize = 800, overlap = 150) {
    if (!text || text.length === 0) return [];

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);

      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf(". ", end);
        const lastNewline = text.lastIndexOf("\n", end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > start + chunkSize * 0.5) {
          end = breakPoint + 1;
        }
      }

      chunks.push({
        text: text.slice(start, end).trim(),
        startIndex: start,
        endIndex: end,
      });

      // Ensure start always moves forward to prevent infinite loop
      const nextStart = end - overlap;
      start = nextStart > start ? nextStart : end;
      if (start >= text.length) break;
    }

    return chunks;
  }

  // ──────────────────────────────────────────────
  //  LOCAL KEYWORD SIMILARITY (no API call)
  // ──────────────────────────────────────────────

  /**
   * Tokenize text and remove stopwords.
   */
  tokenize(text) {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "is", "are", "was", "were", "been", "be",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "can", "shall", "this", "that", "these",
      "those", "it", "its", "i", "you", "he", "she", "we", "they", "my",
      "your", "his", "her", "our", "their", "what", "which", "who", "whom",
      "how", "when", "where", "why", "not", "no", "nor", "so", "very",
      "just", "about", "also", "if", "then", "than", "more", "most",
      "some", "any", "all", "each", "every", "both", "few", "many",
      "much", "such", "own", "same", "other", "new", "old",
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Score a chunk's relevance to the question using TF-IDF-style matching.
   * Completely local — zero API calls.
   */
  scoreChunk(questionTokens, chunk) {
    const chunkText = chunk.text.toLowerCase();
    const chunkTokens = this.tokenize(chunk.text);

    // Build term frequency map for chunk
    const chunkTF = {};
    chunkTokens.forEach((t) => {
      chunkTF[t] = (chunkTF[t] || 0) + 1;
    });

    let score = 0;

    for (const qToken of questionTokens) {
      // Exact match bonus
      if (chunkTF[qToken]) {
        score += chunkTF[qToken] * 2;
      }

      // Partial / substring match (catch "photosynthesis" when query has "photo")
      for (const cToken of Object.keys(chunkTF)) {
        if (cToken !== qToken && (cToken.includes(qToken) || qToken.includes(cToken))) {
          score += chunkTF[cToken] * 0.5;
        }
      }

      // Phrase proximity: bonus for question words near each other in the chunk
      const idx = chunkText.indexOf(qToken);
      if (idx !== -1) {
        score += 1; // presence bonus
      }
    }

    // Normalize by chunk length to avoid long-chunk bias
    if (chunkTokens.length > 0) {
      score = score / Math.sqrt(chunkTokens.length);
    }

    return score;
  }

  /**
   * Find the most relevant chunks for a question. All local.
   */
  findRelevantChunks(question, documentText, topK = 4) {
    const chunks = this.chunkText(documentText);
    if (chunks.length === 0) return [];

    const questionTokens = this.tokenize(question);
    if (questionTokens.length === 0) return chunks.slice(0, topK);

    const scored = chunks.map((chunk) => ({
      ...chunk,
      score: this.scoreChunk(questionTokens, chunk),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Return top K chunks that actually have some relevance
    return scored.slice(0, topK).filter((c) => c.score > 0);
  }

  // ──────────────────────────────────────────────
  //  MAIN ANSWER GENERATION (single Gemini call)
  // ──────────────────────────────────────────────

  /**
   * Generate a RAG-powered answer for the user's question.
   * Makes exactly ONE Gemini API call.
   *
   * @param {string} question - The user's question
   * @param {string} documentText - Full text of the uploaded document
   * @param {Array} conversationHistory - Previous Q&A pairs [{question, answer}]
   * @returns {Promise<string>} - Markdown-formatted answer
   */
  async generateAnswer(question, documentText, conversationHistory = []) {
    if (!question || !question.trim()) {
      throw new Error("Question is required.");
    }

    if (!this.model) {
      throw new Error("Gemini AI is not available. Please check your API key.");
    }

    // Step 1: Local chunk retrieval (zero API calls)
    const relevantChunks = this.findRelevantChunks(question, documentText, 4);

    // Step 2: Build the prompt
    let prompt = `You are a friendly, expert AI Study Tutor. A student has uploaded a document and is asking you questions about it. Your job is to provide **clear, detailed, and educational** answers based on the document content.

## Your Guidelines
- Answer using information from the document excerpts provided below
- Give thorough explanations with examples where helpful
- Use **markdown formatting**: headings, bold, bullet points, numbered lists
- If the excerpts don't contain the answer, say so honestly and share what you do know from the provided context
- Keep a warm, encouraging tone — you're a tutor, not a textbook
- For complex topics, break them down step-by-step

`;

    // Add document context
    if (relevantChunks.length > 0) {
      prompt += `## Relevant Document Excerpts\n\n`;
      relevantChunks.forEach((chunk, i) => {
        prompt += `### Excerpt ${i + 1}\n${chunk.text}\n\n`;
      });
    } else if (documentText && documentText.length > 0) {
      // Fallback: use first portion of document as context
      const preview = documentText.substring(0, 3000);
      prompt += `## Document Overview\n${preview}\n\n`;
    }

    // Add conversation history (last 4 exchanges for follow-ups)
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-4);
      prompt += `## Recent Conversation\n`;
      recent.forEach((msg) => {
        prompt += `**Student:** ${msg.question}\n**Tutor:** ${msg.answer}\n\n`;
      });
    }

    // Add the question
    prompt += `## Student's Question\n${question}\n\n`;
    prompt += `## Your Answer (use markdown formatting)\n`;

    // Step 3: Single Gemini API call with Fallback logic
    try {
      console.log(`🎓 RAG Tutor [Primary]: Answering query with ${relevantChunks.length} chunks...`);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text().trim();

      // Store in conversation history
      this.conversationHistory.push({ question, answer });
      return answer;

    } catch (error) {
      // Check if it's a quota / rate limit error (usually 429 Too Many Requests)
      const isQuotaError = 
        error?.status === 429 || 
        error?.message?.toLowerCase().includes("quota") || 
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("exhausted");

      if (isQuotaError && this.fallbackModel) {
        console.warn("⚠️ Primary model quota exceeded! Switching to backup model (Gemini 2.5 Flash-Lite)...");
        try {
          const fallbackResult = await this.fallbackModel.generateContent(prompt);
          const fallbackResponse = await fallbackResult.response;
          const fallbackAnswer = fallbackResponse.text().trim();
          
          this.conversationHistory.push({ question, answer: fallbackAnswer });
          return fallbackAnswer;
        } catch (fallbackError) {
          console.error("❌ RAG Tutor Fallback Error:", fallbackError);
          throw new Error(`Failed to generate answer even with backup model: ${fallbackError.message}`);
        }
      }

      console.error("❌ RAG Tutor Primary Error:", error);
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  /**
   * Reset conversation history (e.g., when switching documents).
   */
  resetConversation() {
    this.conversationHistory = [];
  }

  /**
   * Get smart question suggestions based on the document text.
   * All local — no API call.
   */
  getSmartSuggestions(documentText) {
    if (!documentText || documentText.length === 0) {
      return [
        "What are the main topics covered?",
        "Can you explain the key concepts?",
        "What are the most important definitions?",
        "How can I apply this knowledge?",
      ];
    }

    // Extract key terms from the first portion of the document
    const preview = documentText.substring(0, 2000);
    const tokens = this.tokenize(preview);
    const freq = {};
    tokens.forEach((t) => {
      freq[t] = (freq[t] || 0) + 1;
    });

    // Get top terms
    const topTerms = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    const suggestions = [
      "What are the main topics covered in this document?",
      `Can you explain what "${topTerms[0] || "the key concept"}" means in simple terms?`,
      "Summarize the most important points I should remember",
      `How does "${topTerms[1] || "this topic"}" relate to ${topTerms[2] || "the other concepts"} in the document?`,
    ];

    return suggestions;
  }
}

export default new RagTutorService();
