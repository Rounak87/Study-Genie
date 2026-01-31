// Enhanced AI-powered Question and Answer service for document summaries

class QnAService {
  constructor() {
    this.conversationHistory = [];
    this.keyTerms = new Set();
    this.documentContext = {};
  }
  
  async generateAnswer(question, summary) {
    if (!question || !summary) {
      throw new Error('Question and summary are required');
    }

    try {
      // Simulate API delay with more realistic timing
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      // Build context from summary
      this.buildDocumentContext(summary);
      
      // Process the question with enhanced understanding
      const answer = this.processQuestion(question, summary);
      
      // Store in conversation history for context
      this.conversationHistory.push({ question, answer });
      
      return answer;
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }

  buildDocumentContext(summary) {
    // Extract summary text from object if needed
    const summaryText = typeof summary === 'string' ? summary : summary?.summary || '';
    const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Extract key terms and entities
    this.keyTerms.clear();
    const words = summaryText.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (!this.isStopWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
        if (wordFreq[word] >= 2) {
          this.keyTerms.add(word);
        }
      }
    });
    
    // Build semantic clusters
    this.documentContext = {
      sentences: sentences.map(s => s.trim()),
      keyTerms: Array.from(this.keyTerms),
      mainTopics: this.extractMainTopics(sentences),
      entities: this.extractEntities(summaryText),
      concepts: this.extractConcepts(sentences)
    };
  }

  isStopWord(word) {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall']);
    return stopWords.has(word);
  }

  extractMainTopics(sentences) {
    // Extract potential main topics from first few sentences
    const topicSentences = sentences.slice(0, Math.min(3, sentences.length));
    return topicSentences.map(s => {
      // Extract noun phrases and key concepts
      const words = s.split(' ').filter(w => w.length > 3);
      return words.slice(0, 5).join(' ');
    });
  }

  extractEntities(text) {
    const entities = {
      people: [],
      places: [],
      organizations: [],
      dates: [],
      numbers: []
    };

    // Simple entity extraction patterns
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const datePattern = /\b(19|20)\d{2}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi;
    const numberPattern = /\b\d+(?:\.\d+)?(?:%|percent|million|billion|thousand)?\b/g;

    entities.people = (text.match(namePattern) || []).slice(0, 5);
    entities.dates = (text.match(datePattern) || []).slice(0, 3);
    entities.numbers = (text.match(numberPattern) || []).slice(0, 5);

    return entities;
  }

  extractConcepts(sentences) {
    const concepts = [];
    const conceptPatterns = [
      /\b\w+(?:tion|sion|ment|ness|ity|ence|ance)\b/g, // Abstract nouns
      /\b(?:concept|theory|principle|method|approach|system|process)\s+\w+/gi,
      /\b\w+(?:\s+\w+){0,2}\s+(?:is|are|means|refers to|defined as)/gi
    ];

    sentences.forEach(sentence => {
      conceptPatterns.forEach(pattern => {
        const matches = sentence.match(pattern) || [];
        concepts.push(...matches.slice(0, 2));
      });
    });

    return [...new Set(concepts)].slice(0, 10);
  }

  processQuestion(question, summary) {
    const questionLower = question.toLowerCase().trim();
    const context = this.documentContext;
    
    // Enhanced question analysis
    const questionType = this.analyzeQuestionType(questionLower);
    const questionIntent = this.analyzeQuestionIntent(questionLower);
    const relevanceScore = this.calculateRelevanceScore(questionLower, summary);
    
    // Generate contextually aware answer
    switch (questionType) {
      case 'definition':
        return this.generateDefinitionAnswer(question, questionLower, context);
      case 'explanation':
        return this.generateExplanationAnswer(question, questionLower, context);
      case 'comparison':
        return this.generateComparisonAnswer(question, questionLower, context);
      case 'example':
        return this.generateExampleAnswer(question, questionLower, context);
      case 'process':
        return this.generateProcessAnswer(question, questionLower, context);
      case 'factual':
        return this.generateFactualAnswer(question, questionLower, context, questionIntent);
      case 'analytical':
        return this.generateAnalyticalAnswer(question, questionLower, context);
      default:
        return this.generateContextualAnswer(question, questionLower, context, relevanceScore);
    }
  }

  analyzeQuestionType(question) {
    if (question.includes('what is') || question.includes('define') || question.includes('meaning')) {
      return 'definition';
    }
    if (question.includes('how') || question.includes('explain') || question.includes('why')) {
      return 'explanation';
    }
    if (question.includes('difference') || question.includes('compare') || question.includes('versus')) {
      return 'comparison';
    }
    if (question.includes('example') || question.includes('instance') || question.includes('such as')) {
      return 'example';
    }
    if (question.includes('process') || question.includes('steps') || question.includes('procedure')) {
      return 'process';
    }
    if (question.startsWith('what') || question.startsWith('when') || question.startsWith('where') || question.startsWith('who')) {
      return 'factual';
    }
    return 'analytical';
  }

  analyzeQuestionIntent(question) {
    if (question.includes('main') || question.includes('primary') || question.includes('key')) {
      return 'summary';
    }
    if (question.includes('detail') || question.includes('specific') || question.includes('particular')) {
      return 'detail';
    }
    if (question.includes('understand') || question.includes('clarify') || question.includes('explain')) {
      return 'clarification';
    }
    return 'general';
  }

  calculateRelevanceScore(question, summary) {
    const questionWords = question.split(' ').filter(w => w.length > 3 && !this.isStopWord(w));
    const summaryText = typeof summary === 'string' ? summary : summary?.summary || '';
    const summaryLower = summaryText.toLowerCase();
    
    let relevanceScore = 0;
    questionWords.forEach(word => {
      if (summaryLower.includes(word)) {
        relevanceScore += 1;
      }
    });
    
    return Math.min(relevanceScore / questionWords.length, 1);
  }

  generateDefinitionAnswer(question, questionLower, context) {
    const term = this.extractTargetTerm(question);
    
    if (term && context.keyTerms.includes(term.toLowerCase())) {
      const relevantSentences = context.sentences.filter(s => 
        s.toLowerCase().includes(term.toLowerCase())
      );
      
      if (relevantSentences.length > 0) {
        return `Great question! **${term}** is explained in the document as: ${relevantSentences[0]}. 

This definition helps understand the core concept within the context of the document. ${relevantSentences[1] ? `Additionally, ${relevantSentences[1]}` : 'Would you like me to elaborate on any specific aspect?'}`;
      }
    }
    
    // Fallback to general definition approach
    const conceptSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('is') || s.toLowerCase().includes('means') || 
      s.toLowerCase().includes('refers to') || s.toLowerCase().includes('defined as')
    );
    
    if (conceptSentences.length > 0) {
      return `Based on the document content: ${conceptSentences[0]}. This provides the key definition you're looking for. Let me know if you'd like more details about this concept!`;
    }
    
    return `The document explains: ${context.sentences[0]}. While this might not be a direct definition, it provides important context about the topic. Feel free to ask for more specific information!`;
  }

  generateExplanationAnswer(question, questionLower, context) {
    if (questionLower.includes('how')) {
      return this.generateHowAnswer(question, context);
    }
    if (questionLower.includes('why')) {
      return this.generateWhyAnswer(question, context);
    }
    
    // General explanation
    const explanatorySentences = context.sentences.filter(s => 
      s.toLowerCase().includes('because') || s.toLowerCase().includes('due to') || 
      s.toLowerCase().includes('result') || s.toLowerCase().includes('therefore')
    );
    
    if (explanatorySentences.length > 0) {
      return `Here's the explanation: ${explanatorySentences[0]}. 

This helps clarify the underlying reasoning. ${explanatorySentences[1] ? `Furthermore, ${explanatorySentences[1]}` : 'Does this answer your question, or would you like me to explain any specific part in more detail?'}`;
    }
    
    return `Let me explain based on the document: ${context.sentences.slice(0, 2).join('. ')}. This provides the key explanation for your question. Any particular aspect you'd like me to dive deeper into?`;
  }

  generateHowAnswer(question, context) {
    const processSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('process') || s.toLowerCase().includes('method') || 
      s.toLowerCase().includes('steps') || s.toLowerCase().includes('approach') ||
      s.toLowerCase().includes('procedure') || s.toLowerCase().includes('way')
    );
    
    if (processSentences.length > 0) {
      return `Here's how it works: ${processSentences[0]}. 

${processSentences[1] ? `The process continues: ${processSentences[1]}` : 'This outlines the key methodology.'} Would you like me to break down any specific step in more detail?`;
    }
    
    return `Based on the document: ${context.sentences.slice(0, 2).join('. ')}. This explains the approach or methodology. Let me know if you need clarification on any particular aspect!`;
  }

  generateWhyAnswer(question, context) {
    const reasonSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('because') || s.toLowerCase().includes('due to') || 
      s.toLowerCase().includes('reason') || s.toLowerCase().includes('purpose') ||
      s.toLowerCase().includes('objective') || s.toLowerCase().includes('goal')
    );
    
    if (reasonSentences.length > 0) {
      return `The reasoning behind this is: ${reasonSentences[0]}. 

This explains the fundamental purpose or cause. ${reasonSentences[1] ? `Additionally, ${reasonSentences[1]}` : 'Does this help clarify the underlying reasons?'}`;
    }
    
    return `The document suggests: ${context.sentences[0]}. While the specific reasoning might not be explicitly stated, this provides important context. Would you like me to infer more about the potential reasons?`;
  }

  generateComparisonAnswer(question, questionLower, context) {
    const comparisonSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('different') || s.toLowerCase().includes('similar') || 
      s.toLowerCase().includes('compare') || s.toLowerCase().includes('contrast') ||
      s.toLowerCase().includes('versus') || s.toLowerCase().includes('while') ||
      s.toLowerCase().includes('however') || s.toLowerCase().includes('although')
    );
    
    if (comparisonSentences.length > 0) {
      return `Great comparison question! ${comparisonSentences[0]}. 

${comparisonSentences[1] ? `Additionally, ${comparisonSentences[1]}` : 'This highlights the key differences and similarities.'} Would you like me to elaborate on any specific aspect of this comparison?`;
    }
    
    return `While direct comparisons aren't explicitly made in the summary, I can infer from the content: ${context.sentences.slice(0, 2).join('. ')}. This provides context for understanding the distinctions. Would you like me to analyze this further?`;
  }

  generateExampleAnswer(question, questionLower, context) {
    const exampleSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('example') || s.toLowerCase().includes('instance') || 
      s.toLowerCase().includes('such as') || s.toLowerCase().includes('for example') ||
      s.toLowerCase().includes('including') || s.toLowerCase().includes('like')
    );
    
    if (exampleSentences.length > 0) {
      return `Here's a relevant example: ${exampleSentences[0]}. 

This illustrates the concept in practical terms. ${exampleSentences[1] ? `Another example: ${exampleSentences[1]}` : 'Would you like more examples or clarification on this one?'}`;
    }
    
    return `While specific examples aren't listed, the document provides this context: ${context.sentences[Math.floor(context.sentences.length / 2)] || context.sentences[0]}. This can serve as an illustration of the main concepts. Would you like me to provide more practical applications?`;
  }

  generateProcessAnswer(question, questionLower, context) {
    const processSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('first') || s.toLowerCase().includes('then') || 
      s.toLowerCase().includes('next') || s.toLowerCase().includes('finally') ||
      s.toLowerCase().includes('step') || s.toLowerCase().includes('stage')
    );
    
    if (processSentences.length > 0) {
      return `Here's the process described: ${processSentences[0]}. 

${processSentences[1] ? `Following that: ${processSentences[1]}` : 'This outlines the key steps involved.'} Would you like me to break down any particular stage in more detail?`;
    }
    
    return `The document outlines: ${context.sentences.slice(0, 2).join('. ')}. While specific steps might not be enumerated, this provides the overall process framework. Need more details on any aspect?`;
  }

  generateFactualAnswer(question, questionLower, context, intent) {
    const questionWord = questionLower.split(' ')[0]; // what, when, where, who
    
    switch (questionWord) {
      case 'what':
        return this.generateWhatAnswer(question, context, intent);
      case 'when':
        return this.generateWhenAnswer(question, context);
      case 'where':
        return this.generateWhereAnswer(question, context);
      case 'who':
        return this.generateWhoAnswer(question, context);
      default:
        return this.generateGeneralFactualAnswer(question, context);
    }
  }

  generateWhatAnswer(question, context, intent) {
    if (intent === 'summary') {
      return `The main topic is: ${context.sentences[0]}. 

This covers the primary subject matter discussed in the document. ${context.sentences[1] ? `Additionally, ${context.sentences[1]}` : 'Would you like me to elaborate on any specific aspect?'}`;
    }
    
    // Find most relevant content
    const questionTerms = question.toLowerCase().split(' ').filter(w => 
      w.length > 3 && !this.isStopWord(w) && w !== 'what'
    );
    
    const relevantSentences = context.sentences.map(sentence => {
      const relevanceScore = questionTerms.filter(term => 
        sentence.toLowerCase().includes(term)
      ).length;
      return { sentence, score: relevanceScore };
    }).sort((a, b) => b.score - a.score);
    
    if (relevantSentences[0].score > 0) {
      return `Regarding your question: ${relevantSentences[0].sentence}. 

${relevantSentences[1]?.sentence ? `Also relevant: ${relevantSentences[1].sentence}` : 'This directly addresses what you\'re asking about.'} Any specific details you'd like me to expand on?`;
    }
    
    return `Based on the document: ${context.sentences[0]}. This provides the key information relevant to your question. Would you like me to focus on any particular aspect?`;
  }

  generateWhenAnswer(question, context) {
    if (context.entities.dates.length > 0) {
      return `According to the document, the timing is: ${context.entities.dates[0]}. 

${context.entities.dates[1] ? `Also mentioned: ${context.entities.dates[1]}` : 'This provides the temporal context.'} Would you like more specific timing information?`;
    }
    
    const timeSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('time') || s.toLowerCase().includes('period') ||
      s.toLowerCase().includes('during') || s.toLowerCase().includes('when')
    );
    
    if (timeSentences.length > 0) {
      return `The document indicates: ${timeSentences[0]}. This provides the temporal framework. Need more specific timing details?`;
    }
    
    return `While specific timing information isn't prominently featured, the document context suggests: ${context.sentences[0]}. For precise dates and timelines, the full document might have more details. What specific timeframe are you curious about?`;
  }

  generateWhereAnswer(question, context) {
    const locationSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('location') || s.toLowerCase().includes('place') || 
      s.toLowerCase().includes('country') || s.toLowerCase().includes('city') ||
      s.toLowerCase().includes('region') || s.toLowerCase().includes('area') ||
      s.toLowerCase().includes('where') || s.toLowerCase().includes('at')
    );
    
    if (locationSentences.length > 0) {
      return `The location context is: ${locationSentences[0]}. 

${locationSentences[1] ? `Additionally: ${locationSentences[1]}` : 'This describes the geographical or contextual setting.'} Need more specific location details?`;
    }
    
    return `The document discusses: ${context.sentences[0]}. While specific location details might be covered in the full content, this provides the general context. What particular location aspect interests you?`;
  }

  generateWhoAnswer(question, context) {
    if (context.entities.people.length > 0) {
      return `The document mentions: ${context.entities.people.slice(0, 2).join(', ')}. 

These are the key individuals identified in the content. ${context.entities.people.length > 2 ? `And ${context.entities.people.length - 2} others are also mentioned.` : 'Would you like to know more about any of them?'}`;
    }
    
    const peopleSentences = context.sentences.filter(s => 
      s.toLowerCase().includes('person') || s.toLowerCase().includes('people') ||
      s.toLowerCase().includes('individual') || s.toLowerCase().includes('team') ||
      s.toLowerCase().includes('author') || s.toLowerCase().includes('researcher')
    );
    
    if (peopleSentences.length > 0) {
      return `The document mentions: ${peopleSentences[0]}. This identifies the key individuals or groups. Want to know more about specific people involved?`;
    }
    
    return `The document focuses on: ${context.sentences[0]}. While specific individuals might not be prominently featured in the summary, this provides the main context. Are you looking for information about particular people?`;
  }

  generateGeneralFactualAnswer(question, context) {
    return `Based on the document: ${context.sentences[0]}. 

${context.sentences[1] ? `Additionally: ${context.sentences[1]}` : 'This provides the key factual information.'} Would you like me to elaborate on any specific aspect?`;
  }

  generateAnalyticalAnswer(question, questionLower, context) {
    // More sophisticated analysis for complex questions
    const questionTerms = questionLower.split(' ').filter(w => 
      w.length > 3 && !this.isStopWord(w)
    );
    
    // Find most relevant sentences based on term matching
    const scoredSentences = context.sentences.map(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const matchCount = questionTerms.filter(term => 
        sentenceLower.includes(term)
      ).length;
      const relevanceScore = matchCount / questionTerms.length;
      return { sentence, score: relevanceScore };
    }).sort((a, b) => b.score - a.score);
    
    const topSentences = scoredSentences.slice(0, 2);
    
    if (topSentences[0].score > 0.2) {
      return `Based on your analytical question: ${topSentences[0].sentence}. 

${topSentences[1] && topSentences[1].score > 0.1 ? `Further analysis shows: ${topSentences[1].sentence}` : 'This provides the key analytical insight.'} Would you like me to dive deeper into any particular aspect of this analysis?`;
    }
    
    return `This is an interesting analytical question. From the document: ${context.sentences.slice(0, 2).join('. ')}. 

While this might not directly answer your specific question, it provides relevant context for analysis. Could you help me understand what specific aspect you'd like me to focus on?`;
  }

  generateContextualAnswer(question, questionLower, context, relevanceScore) {
    // Enhanced contextual understanding
    if (relevanceScore > 0.5) {
      // High relevance - direct answer
      const questionTerms = questionLower.split(' ').filter(w => 
        w.length > 3 && !this.isStopWord(w)
      );
      
      const bestMatch = context.sentences.find(sentence => {
        const sentenceLower = sentence.toLowerCase();
        return questionTerms.some(term => sentenceLower.includes(term));
      });
      
      if (bestMatch) {
        return `Perfect! Based on your question: ${bestMatch}. 

This directly relates to what you're asking about. ${context.sentences[1] && context.sentences[1] !== bestMatch ? `Additionally: ${context.sentences[1]}` : 'Would you like me to elaborate on any specific part?'}`;
      }
    }
    
    // Medium/low relevance - provide context and ask for clarification
    return `I understand you're asking about aspects related to the document. Here's what I can tell you: ${context.sentences[0]}. 

${context.sentences[1] ? `Also relevant: ${context.sentences[1]}` : 'This provides the general context.'} 

Could you help me understand more specifically what you'd like to know? I'm here to help clarify any particular aspect of the content!`;
  }

  extractTargetTerm(question) {
    // Extract the main term from definition questions
    const patterns = [
      /what is (?:a |an |the )?([^?]+)/i,
      /define (?:a |an |the )?([^?]+)/i,
      /meaning of (?:a |an |the )?([^?]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }
    
    return null;
  }

  // Utility method to get conversation context
  getConversationContext() {
    return {
      history: this.conversationHistory,
      keyTerms: Array.from(this.keyTerms),
      documentContext: this.documentContext
    };
  }

  // Reset conversation for new document
  resetConversation() {
    this.conversationHistory = [];
    this.keyTerms.clear();
    this.documentContext = {};
  }
}

export default new QnAService();
