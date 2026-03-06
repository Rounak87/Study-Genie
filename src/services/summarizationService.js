// Text summarization service with AI enhancement
import aiService from "./aiService";

class SummarizationService {
  constructor() {
    // Initialize with your HuggingFace API token
    this.API_TOKEN = "hf_xxx"; // Replace with your actual token
    this.API_URL =
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
  }

  async summarizeText(text, style = "detailed") {
    if (!text || text.length < 10) {
      return {
        success: false,
        error: "Text is too short to summarize",
      };
    }

    try {
      console.log(
        `📝 Starting AI-enhanced text summarization (${style} style)...`,
      );

      // Check text length and determine if chunking is needed
      const charCount = text.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      console.log(
        `📊 Document size: ${charCount} chars, ~${tokenEstimate} tokens`,
      );

      if (tokenEstimate > 125000) {
        // ~500k chars
        // Large document: use chunking
        console.log("📦 Large document detected, using chunked processing");
        return await this.summarizeLargeDocument(text, style);
      }

      // Small document: direct AI call
      console.log("✨ Processing with Gemini AI...");

      const detailedPrompt = `You are an expert professor distilling this document into exhaustive, highly detailed "Cornell-Style Study Notes".
Format the output in clean, beautiful Markdown. DO NOT BE CONCISE. Be exceptionally thorough. Extract all major definitions, formulas, theories, historical facts, or key arguments. 

=== DOCUMENT TO ANALYZE ===
${text.substring(0, 500000)}

=== REQUIRED STRUCTURE ===
# 📝 Detailed Study Notes

## 🎯 Executive Overview
[3-4 detailed paragraphs explaining the overarching theme, context, and purpose of the text. Do not skip details.]

## 📚 Comprehensive Chapter / Section Breakdown
[For each major section or theme in the document, provide a detailed breakdown:]
### [Section/Theme Name]
- **[Concept/Term 1]:** [Thorough 3-4 sentence explanation detailing how it works, why it matters, and examples]
- **[Concept/Term 2]:** [Thorough 3-4 sentence explanation detailing how it works, why it matters, and examples]
(Extract at least 10-15 concepts across all sections)

## 📌 Critical Facts, Dates & Data
- [Bullet point with exact data, statistic, equation, or important fact]
- [Bullet point with exact data, statistic, equation, or important fact]
(Extract all critical factual details)

## 💡 Practical Application / Synthesis
[2 detailed paragraphs explaining real-world applications, significance, or synthesizing the grand takeaway.]

Make these notes incredibly valuable for a university student preparing for a final exam. Do not miss any crucial information.`;

      const concisePrompt = `You are an expert tutor creating highly polished, concise "High-Yield Study Notes" from the following text.
Format the output in clean, beautiful Markdown. Use bullet points, bold text for emphasis, and clear hierarchical headings. Focus strictly on extracting high-yield, straight-to-the-point information.

=== DOCUMENT TO ANALYZE ===
${text.substring(0, 500000)}

=== REQUIRED STRUCTURE ===
# 📝 Concise Study Notes

## 🎯 High-Yield Summary
[1-2 short, punchy paragraphs explaining the core essence of the document]

## 🔑 Core Concepts
- **[Concept 1]:** [Clear, concise 1-sentence definition]
- **[Concept 2]:** [Clear, concise 1-sentence definition]
(Extract 5-8 crucial concepts)

## 📌 Critical Details
- [Bullet point with important fact, date, or statistic]
- [Bullet point with important fact, date, or statistic]
(Extract 5-8 critical details)

Ensure the formatting consists of short sentences and extremely high readability. Build it like a premium cheat sheet.`;

      const prompt = style === "concise" ? concisePrompt : detailedPrompt;

      const response = await aiService.generateResponse(prompt, {
        subject: "general",
        complexity: "intermediate",
      });

      console.log("✅ AI summarization completed");

      return {
        success: true,
        summary: response.answer,
        method: "ai",
        confidence: response.confidence,
        source: response.source,
      };
    } catch (error) {
      console.error("📝 Summarization error:", error);
      return {
        success: false,
        error: `AI summarization failed: ${error.message}. Please check your Gemini API key and try again.`,
      };
    }
  }

  // For large documents: chunk and summarize
  async summarizeLargeDocument(text, style = "detailed") {
    const chunkSize = 25000; // ~6,250 tokens per chunk
    const chunks = this.splitIntoChunks(text, chunkSize);

    console.log(`📄 Processing large document in ${chunks.length} chunks`);

    const chunkSummaries = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📝 Processing chunk ${i + 1}/${chunks.length}...`);

      const prompt = `You are analyzing section ${i + 1} of ${chunks.length} from a larger educational document.

=== SECTION CONTENT ===
${chunks[i]}

=== TASK ===
Provide a structured summary of this section:

**Main Ideas:**
[List 2-4 key points from this section]

**Important Details:**
[Brief overview of crucial information]

**Key Terms:**
[Any important terminology or concepts]

Be concise but thorough.`;

      const response = await aiService.generateResponse(prompt);
      chunkSummaries.push(response.answer);

      // Rate limiting: wait between chunks (15 req/min = 4 seconds apart)
      if (i < chunks.length - 1) {
        console.log("⏳ Waiting 4 seconds (rate limiting)...");
        await this.delay(4000);
      }
    }

    console.log("🔗 Combining chunk summaries...");

    // Now create a final summary from all chunk summaries
    let finalPrompt = `You are combining ${chunks.length} section summaries into one comprehensive document summary.`;

    if (style === "concise") {
      finalPrompt += `

=== SECTION SUMMARIES ===
${chunkSummaries.map((s, i) => `**Section ${i + 1}:**\n${s}`).join("\n\n")}

=== CREATE FINAL SUMMARY ===
Combine these sections into a highly polished, concise "High-Yield" summary:

# 📝 Concise Study Notes

## 🎯 High-Yield Summary
[1-2 short, punchy paragraphs explaining the core essence of the document]

## 🔑 Core Concepts
- **[Concept 1]:** [Clear, concise 1-sentence definition]
- **[Concept 2]:** [Clear, concise 1-sentence definition]
(Extract 5-8 crucial concepts)

## 📌 Critical Details
- [Bullet point with important fact, date, or statistic]
(Extract 5-8 critical details)

Ensure the formatting consists of short sentences and extremely high readability.`;
    } else {
      finalPrompt += `

=== SECTION SUMMARIES ===
${chunkSummaries.map((s, i) => `**Section ${i + 1}:**\n${s}`).join("\n\n")}

=== CREATE FINAL SUMMARY ===
Combine these sections into a highly detailed, exhaustive "Cornell-Style" summary:

# 📝 Detailed Study Notes

## 🎯 Executive Overview
[3-4 detailed paragraphs explaining the overarching theme, context, and purpose of the text. Do not skip details.]

## 📚 Comprehensive Chapter / Section Breakdown
[For each major section or theme, provide a detailed breakdown:]
### [Section/Theme Name]
- **[Concept/Term]:** [Thorough explanation detailing how it works, why it matters, and examples]
(Extract at least 10-15 concepts across all sections)

## 📌 Critical Facts, Dates & Data
- [Bullet point with exact data, statistic, equation, or important fact]
(Extract all critical factual details)

## 💡 Practical Application / Synthesis
[2 detailed paragraphs explaining real-world applications or synthesizing the grand takeaway.]

Make these notes incredibly valuable for a university student. Do not miss crucial information.`;
    }

    const finalResponse = await aiService.generateResponse(finalPrompt, {
      subject: "general",
      complexity: "intermediate",
    });

    console.log("✅ Large document summarization completed");

    return {
      success: true,
      summary: finalResponse.answer,
      method: "ai_chunked",
      chunksProcessed: chunks.length,
      source: finalResponse.source,
    };
  }

  // Split text into chunks
  splitIntoChunks(text, chunkSize) {
    const chunks = [];

    // Try to split at paragraph boundaries for better context
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // If the paragraph itself is larger than the chunkSize, split it by characters
      if (paragraph.length > chunkSize) {
        // Push the current chunk if it exists
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        for (let i = 0; i < paragraph.length; i += chunkSize) {
          chunks.push(paragraph.substring(i, i + chunkSize));
        }
        continue;
      }

      if ((currentChunk + paragraph).length <= chunkSize) {
        currentChunk += paragraph + "\n\n";
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph + "\n\n";
      }
    }

    // Add the last chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // If no paragraph-based chunking worked, fall back to character splitting
    if (chunks.length === 0) {
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
      }
    }

    return chunks;
  }

  // Helper to add delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Estimate if AI summarization is feasible
  canUseAI(text) {
    const charCount = text.length;
    const tokenEstimate = Math.ceil(charCount / 4);

    return {
      feasible: true, // Always feasible with chunking
      tokenEstimate,
      requiresChunking: tokenEstimate > 30000,
      estimatedChunks: Math.ceil(tokenEstimate / 6250),
      estimatedTime:
        tokenEstimate > 30000 ? Math.ceil(tokenEstimate / 6250) * 4 : 5,
    };
  }
}

export const summarizationService = new SummarizationService();
export default summarizationService;
