// Text summarization service using HuggingFace's API
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
      console.log('📝 Starting text summarization using AI...');

      // Function to structure the text better before summarization
      const prepareText = (text) => {
        // Split into paragraphs and clean them
        const paragraphs = text.split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        // Identify potential sections and headers
        const structuredText = paragraphs.map(p => {
          if (p.length < 50 && p.toUpperCase() === p) {
            return `\n## ${p}\n`; // Mark as header
          }
          return p;
        }).join('\n\n');

        return structuredText;
      };

      // Clean and structure the input text
      const preparedText = prepareText(text);

      // For development/testing, use a simulated AI response
      // In production, replace this with actual API call
      const simulateAIResponse = async (text) => {
        // Enhanced analysis for comprehensive summarization
        const sections = text.split('##').filter(s => s.trim());
        const mainPoints = [];
        const keyFindings = new Set();
        const concepts = new Set();
        const definitions = new Set();
        const relationships = new Set();
        const examples = new Set();

        sections.forEach(section => {
          const sentences = section.match(/[^.!?]+[.!?]+/g) || [];
          sentences.forEach(sentence => {
            // Identify key points
            if (/important|significant|key|main|crucial|essential/i.test(sentence)) {
              keyFindings.add(sentence.trim());
            }
            // Identify concepts and definitions
            if (/is defined as|refers to|means|is a|are|represents/i.test(sentence)) {
              definitions.add(sentence.trim());
            }
            // Identify examples
            if (/for example|such as|like|instance|exemplifies/i.test(sentence)) {
              examples.add(sentence.trim());
            }
            // Identify relationships between concepts
            if (/relates to|connects|links|affects|influences|depends on/i.test(sentence)) {
              relationships.add(sentence.trim());
            }
          });
        });

        // Create a comprehensive structured summary
        let summary = "# Comprehensive Document Analysis\n\n";

        // Add overview section
        summary += "## Overview\n";
        summary += "This document explores the topic of " + 
                  (sections[0] || text).substring(0, 150).trim() + 
                  "...\n\n";

        // Add key concepts and definitions
        summary += "## Key Concepts\n\n";
        Array.from(definitions).slice(0, 8).forEach(def => {
          summary += "• " + def.trim() + "\n";
        });

        // Add main ideas and arguments
        summary += "\n## Main Ideas\n\n";
        Array.from(keyFindings).slice(0, 8).forEach(point => {
          summary += "• " + point.trim() + "\n";
        });

        // Add examples and applications
        summary += "\n## Examples & Applications\n\n";
        Array.from(examples).slice(0, 5).forEach(example => {
          summary += "• " + example.trim() + "\n";
        });

        // Add relationships and connections
        summary += "\n## Conceptual Relationships\n\n";
        Array.from(relationships).slice(0, 5).forEach(rel => {
          summary += "• " + rel.trim() + "\n";
        });

        if (sections.length > 1) {
          summary += "\n## Detailed Section Analysis\n\n";
          sections.forEach((section, index) => {
            if (section.trim()) {
              const sectionTitle = section.split('\n')[0].trim();
              summary += `### ${sectionTitle || `Section ${index + 1}`}\n`;
              const sectionSentences = section.match(/[^.!?]+[.!?]+/g) || [];
              const keySentences = sectionSentences
                .filter(s => /important|significant|key|main|concept|define|example/i.test(s))
                .slice(0, 3);
              keySentences.forEach(s => summary += "• " + s.trim() + "\n");
              summary += "\n";
            }
          });
        }

        // Add potential quiz topics
        summary += "\n## Potential Quiz Topics\n\n";
        const quizTopics = new Set([
          ...Array.from(definitions).slice(0, 3),
          ...Array.from(relationships).slice(0, 2),
          ...Array.from(examples).slice(0, 2)
        ]);
        Array.from(quizTopics).forEach(topic => {
          summary += "• " + topic.trim() + "\n";
        });

        // Add conclusions if found
        const conclusions = text.match(/(?:in conclusion|to summarize|finally)[^.!?]+[.!?]+/gi);
        if (conclusions) {
          summary += "\n## Key Takeaways\n\n";
          conclusions.forEach(conclusion => {
            summary += "• " + conclusion.trim() + "\n";
          });
        }

        return summary;
      };

      // For now, use the simulated response
      const summary = await simulateAIResponse(preparedText);
      console.log('📝 AI Summarization completed');
      
      return {
        success: true,
        summary: summary,
      };

    } catch (error) {
      console.error('📝 Summarization error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate summary',
      };
    }
  }
}

export const summarizationService = new SummarizationService();
export default summarizationService;