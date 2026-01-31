// Text summarization service with AI enhancement
import aiService from './aiService';

class SummarizationService {
  constructor() {
    // Initialize with your HuggingFace API token
    this.API_TOKEN = "hf_xxx"; // Replace with your actual token
    this.API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
  }

  async summarizeText(text) {
    if (!text || text.length < 10) {
      return {
        success: false,
        error: 'Text is too short to summarize'
      };
    }

    try {
      console.log('📝 Starting AI-enhanced text summarization...');
      
      // Check text length and determine if chunking is needed
      const charCount = text.length;
      const tokenEstimate = Math.ceil(charCount / 4);
      
      console.log(`📊 Document size: ${charCount} chars, ~${tokenEstimate} tokens`);
      
      if (tokenEstimate > 30000) {
        // Large document: use chunking
        console.log('📦 Large document detected, using chunked processing');
        return await this.summarizeLargeDocument(text);
      }
      
      // Small document: direct AI call
      console.log('✨ Processing with Gemini AI...');
      const prompt = `You are an expert educational content analyzer. Analyze this document and create a COMPREHENSIVE, DETAILED, LONG summary.

=== DOCUMENT TO ANALYZE ===
${text.substring(0, 30000)}

=== REQUIRED OUTPUT FORMAT ===
Provide a DETAILED and COMPREHENSIVE summary. DO NOT make it short. Include as much relevant information as possible.

# 📚 Document Summary

## 🎯 Main Topic
[Write 3-5 detailed paragraphs explaining what this document is about, its context, background, and primary purpose. Be thorough and comprehensive.]

## 🔑 Key Concepts
[List and explain 8-12 most important concepts or ideas. For EACH concept, provide:
- **Concept Name:** [2-3 paragraphs of detailed explanation, examples, and significance]

Be thorough - this should be substantial.]

## 📖 Important Details
[Write 4-6 comprehensive paragraphs covering:
- Crucial information and data
- Definitions and terminology
- Processes and methodologies  
- Findings and results
- Supporting evidence

Provide extensive detail here.]

## 💡 Practical Applications
[Write 3-4 detailed paragraphs explaining:
- How this knowledge can be applied in real scenarios
- Industry applications
- Use cases and examples
- Implementation strategies]

## ✅ Key Takeaways
[List 10-15 detailed bullet points of the most important things to remember. Each point should be a complete sentence or two.]

## 🔬 Additional Insights
[Write 2-3 more paragraphs covering:
- Interesting observations
- Connections to other topics
- Future implications
- Expert perspectives]

Make this summary COMPREHENSIVE and DETAILED. The longer and more thorough, the better. Use proper markdown formatting.`;

      const response = await aiService.generateResponse(prompt, {
        subject: 'general',
        complexity: 'intermediate'
      });
      
      console.log('✅ AI summarization completed');
      
      return {
        success: true,
        summary: response.answer,
        method: 'ai',
        confidence: response.confidence,
        source: response.source
      };

    } catch (error) {
      console.error('📝 Summarization error:', error);
      return {
        success: false,
        error: `AI summarization failed: ${error.message}. Please check your Gemini API key and try again.`,
      };
    }
  }



  // For large documents: chunk and summarize
  async summarizeLargeDocument(text) {
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
        console.log('⏳ Waiting 4 seconds (rate limiting)...');
        await this.delay(4000);
      }
    }
    
    console.log('🔗 Combining chunk summaries...');
    
    // Now create a final summary from all chunk summaries
    const finalPrompt = `You are combining ${chunks.length} section summaries into one comprehensive document summary.

=== SECTION SUMMARIES ===
${chunkSummaries.map((s, i) => `**Section ${i + 1}:**
${s}`).join('\n\n')}

=== CREATE FINAL SUMMARY ===
Combine these sections into a well-structured overall summary:

# 📚 Complete Document Summary

## 🎯 Overall Topic & Purpose
[What this entire document covers]

## 🔑 Key Concepts Across All Sections
[Main ideas from all sections combined]

## 📖 Important Details & Findings
[Crucial information from the document]

## 🔗 Connections & Flow
[How sections relate to each other]

## ✅ Main Takeaways
[Most important points to remember]

Make it cohesive, comprehensive, and well-formatted.`;

    const finalResponse = await aiService.generateResponse(finalPrompt);
    
    console.log('✅ Large document summarization completed');
    
    return {
      success: true,
      summary: finalResponse.answer,
      method: 'ai_chunked',
      chunksProcessed: chunks.length,
      source: finalResponse.source
    };
  }

  // Split text into chunks
  splitIntoChunks(text, chunkSize) {
    const chunks = [];
    
    // Try to split at paragraph boundaries for better context
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= chunkSize) {
        currentChunk += paragraph + '\n\n';
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph + '\n\n';
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
    return new Promise(resolve => setTimeout(resolve, ms));
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
      estimatedTime: tokenEstimate > 30000 
        ? Math.ceil(tokenEstimate / 6250) * 4 
        : 5
    };
  }
}

export const summarizationService = new SummarizationService();
export default summarizationService;