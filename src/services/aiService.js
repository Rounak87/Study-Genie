// AI Service using Google Gemini for educational assistance
import { GoogleGenerativeAI } from "@google/generative-ai";

class AIService {
  constructor() {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      this.workingModelName = "gemini-2.5-flash";
      console.log('✅ Gemini 2.5 Flash initialized successfully');
    } else {
      this.model = null;
      console.log('⚠️ No Gemini API key found');
    }
  }

  async generateResponse(question, context = {}) {
    const analysis = this.analyzeQuestion(question);
    
    if (!this.model) {
      throw new Error('Gemini AI model not available. No API key or model initialization failed.');
    }
    
    try {
      return await this.generateGeminiResponse(question, analysis, context);
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error; // Don't fallback, throw the error
    }
  }

  async generateGeminiResponse(question, analysis, context = {}) {
    const { subject, complexity } = analysis;
    
    // Build educational prompt
    let prompt = `You are an expert educational AI tutor specialized in ${subject}.
Student's question: "${question}"
Complexity level: ${complexity}

`;

    // Add document context if available
    if (context.documentSummary) {
      const summaryPreview = typeof context.documentSummary === 'string' 
        ? context.documentSummary.substring(0, 1000)
        : JSON.stringify(context.documentSummary).substring(0, 1000);
      prompt += `\nRelevant document content:\n${summaryPreview}\n`;
    }

    // Add conversation history for context
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory
        .slice(-3)
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join("\n");
      prompt += `\nRecent conversation:\n${recentHistory}\n`;
    }

    prompt += `\nProvide a clear, educational response suitable for a student. Use examples and step-by-step explanations when helpful. Keep the response concise (under 200 words).`;

    try {
      console.log('🚀 Calling Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      console.log('✅ Gemini API response received');
      
      return {
        answer: answer.trim(),
        subject: subject,
        complexity: complexity,
        confidence: 0.95,
        source: 'gemini',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Gemini API Error:', error.message);
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  analyzeQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    const subjects = {
      math: ['math', 'equation', 'solve', 'calculate', 'algebra', 'geometry', 'calculus', 'derivative', 'integral', 'formula', 'theorem', 'number'],
      science: ['science', 'experiment', 'atom', 'molecule', 'cell', 'biology', 'chemistry', 'physics', 'force', 'energy', 'reaction', 'photosynthesis'],
      programming: ['code', 'program', 'function', 'variable', 'algorithm', 'javascript', 'python', 'debug', 'loop', 'array', 'object'],
      history: ['history', 'war', 'civilization', 'century', 'ancient', 'medieval', 'empire', 'revolution'],
      language: ['grammar', 'verb', 'noun', 'sentence', 'paragraph', 'essay', 'writing', 'literature'],
      general: []
    };

    let detectedSubject = 'general';
    let confidence = 0;

    for (const [subject, keywords] of Object.entries(subjects)) {
      const matches = keywords.filter(keyword => lowerQuestion.includes(keyword)).length;
      if (matches > confidence) {
        detectedSubject = subject;
        confidence = matches;
      }
    }

    const complexity = this.determineComplexity(question);

    return {
      subject: detectedSubject,
      complexity: complexity,
      confidence: confidence / 5,
      questionLength: question.length,
      hasSpecificTerms: confidence > 0
    };
  }

  determineComplexity(question) {
    const advancedTerms = ['derivative', 'integral', 'quantum', 'molecular', 'algorithm', 'recursive', 'thermodynamics', 'calculus'];
    const intermediateTerms = ['equation', 'formula', 'calculate', 'analyze', 'compare', 'evaluate', 'explain'];
    const basicTerms = ['what', 'how', 'why', 'define', 'is', 'are', 'who', 'when', 'where'];

    const lowerQuestion = question.toLowerCase();

    if (advancedTerms.some(term => lowerQuestion.includes(term))) {
      return 'advanced';
    } else if (intermediateTerms.some(term => lowerQuestion.includes(term))) {
      return 'intermediate';
    } else if (basicTerms.some(term => lowerQuestion.includes(term))) {
      return 'basic';
    } else {
      return 'intermediate';
    }
  }

  async generateEducationalResponse(question, analysis, context = {}) {
    const { subject, complexity } = analysis;
    
    console.log('ℹ️ Using fallback mode (pattern matching)');
    
    let response = {
      answer: '',
      subject: subject,
      complexity: complexity,
      confidence: 0.6,
      source: 'fallback'
    };

    if (subject === 'math') {
      response.answer = this.generateMathFallback(question, complexity);
    } else if (subject === 'science') {
      response.answer = this.generateScienceFallback(question, complexity);
    } else if (subject === 'programming') {
      response.answer = this.generateProgrammingFallback(question, complexity);
    } else {
      response.answer = this.generateGeneralFallback(question, complexity, context);
    }

    return response;
  }

  generateMathFallback(question, complexity) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('solve')) {
      return "To solve this mathematical problem:\n\n1. **Identify the equation type** (linear, quadratic, etc.)\n2. **Apply the appropriate formula or method**\n3. **Simplify step by step**\n4. **Verify your answer** by substituting back\n\nCould you provide the specific equation or problem details?";
    }
    
    if (lowerQuestion.includes('derivative')) {
      return "**Derivatives - Quick Guide:**\n\n**Basic Rules:**\n1. Power rule: d/dx(x^n) = nx^(n-1)\n2. Constant rule: d/dx(c) = 0\n3. Sum rule: d/dx(f + g) = f' + g'\n\n**Example:**\nd/dx(x²) = 2x\n\nWhat specific function would you like to differentiate?";
    }
    
    return "I can help with math problems! 📐\n\nPlease provide:\n- The specific equation or problem\n- What you've tried so far\n- Which concept you're struggling with";
  }

  generateScienceFallback(question, complexity) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('photosynthesis')) {
      return "**Photosynthesis** is the process where plants convert light energy into chemical energy:\n\n**Two Main Stages:**\n1. **Light Reactions** (in thylakoids)\n2. **Calvin Cycle** (in stroma)\n\n**Overall Equation:**\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂";
    }
    
    return "I can help explain scientific concepts! 🔬\n\nFor better assistance, please specify:\n- The topic (biology, chemistry, physics)\n- What you already understand\n- Specific questions about processes";
  }

  generateProgrammingFallback(question, complexity) {
    return "I can help with programming concepts! 💻\n\n**Common topics:**\n- Data structures (arrays, objects)\n- Control flow (loops, conditionals)\n- Functions and scope\n- Debugging strategies\n\nWhat specific concept are you working with?";
  }

  generateGeneralFallback(question, complexity, context) {
    if (context.documentSummary) {
      return `I can help answer questions about your uploaded document! 📄\n\nTo provide a specific answer, I need more context about which part of the document you're asking about.\n\nTry asking a more specific question about the content!`;
    }
    
    return `I'm here to help with your ${complexity}-level question! 🎓\n\nPlease include:\n- More specific details about the topic\n- What you've learned so far\n- Which part is confusing\n\nI can help with math, science, programming, and study topics!`;
  }

  getSuggestedTopics() {
    return [
      "📐 Help me with a math problem",
      "🔬 Explain a science concept",
      "📝 Study strategies and tips",
      "💻 Programming help"
    ];
  }

  getStatus() {
    return {
      hasApiKey: !!this.model,
      mode: this.model ? 'Gemini AI' : 'Fallback',
      ready: true
    };
  }
}

export default new AIService();
