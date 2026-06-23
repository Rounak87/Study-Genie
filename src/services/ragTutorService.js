import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class RagTutorService {
  constructor() {
    console.log("✅ Client RAG Tutor Service initialized (routing queries securely to backend)");
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

    // Step 1: Local chunk retrieval (zero API calls in the browser)
    const relevantChunks = this.findRelevantChunks(question, documentText, 4);

    // Step 2: Send payloads securely to the server
    try {
      const token = localStorage.getItem("studygenie_token");
      console.log(`🎓 RAG Tutor: Proxying query with ${relevantChunks.length} chunks to server...`);
      
      const response = await axios.post(`${API_URL}/ai/rag-ask`, {
        question,
        excerpts: relevantChunks,
        documentText: documentText ? documentText.substring(0, 3000) : '',
        conversationHistory
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      if (response.data && response.data.success) {
        const answer = response.data.answer.trim();
        // Store in local conversation history for follow-ups
        this.conversationHistory.push({ question, answer });
        return answer;
      } else {
        throw new Error(response.data.error || "Failed to generate answer from server");
      }
    } catch (error) {
      console.error("RAG Tutor Server Error:", error);
      throw new Error(error.response?.data?.error || error.message || "Failed to generate answer");
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
