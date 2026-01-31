// AI Service using LangChain for educational assistance
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

class AIService {
  constructor() {
    // Initialize LangChain LLM
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log('🔍 Debug - API Key check:', {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      starts_with_sk: apiKey ? apiKey.startsWith('sk-') : false,
      first_10_chars: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
    });
    
    this.hasValidApiKey = apiKey && apiKey !== "" && apiKey.startsWith('sk-');
    
    if (this.hasValidApiKey) {
      try {
        this.llm = new ChatOpenAI({
          apiKey: apiKey, // Use 'apiKey' instead of 'openAIApiKey' 
          modelName: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 800,
          timeout: 30000, // 30 second timeout
        });
        
        this.outputParser = new StringOutputParser();
        console.log('✅ LangChain initialized with OpenAI API');
      } catch (error) {
        console.error('❌ Failed to initialize LangChain:', error);
        this.hasValidApiKey = false;
      }
    } else {
      console.log('⚠️ No valid OpenAI API key found. Using fallback responses.');
    }
    
    this.initializeChains();
  }

  initializeChains() {
    // Only initialize LangChain chains if we have a valid API key
    if (!this.hasValidApiKey) {
      console.log('📚 Using intelligent fallback responses (no API key)');
      return;
    }

    try {
      // Main educational assistant prompt
      this.educationalPrompt = PromptTemplate.fromTemplate(`
You are an expert AI Teaching Assistant specializing in education and learning support. You help students understand concepts, solve problems, and develop study strategies.

Student Profile: {studentInfo}
Conversation History: {conversationHistory}
Current Question: {question}
Subject Context: {subject}
Complexity Level: {complexity}

Please provide a helpful, educational response that:
1. Directly addresses the student's question with accuracy
2. Explains concepts clearly with step-by-step examples when appropriate
3. Encourages learning and critical thinking
4. Provides actionable guidance for problem-solving
5. Uses a friendly, encouraging tone with appropriate emojis
6. Suggests related topics or follow-up questions when relevant
7. Adapts complexity to the student's level

Keep responses concise but comprehensive (under 600 words).

Response:
      `);

      // Create the main chain
      this.educationalChain = RunnableSequence.from([
        this.educationalPrompt,
        this.llm,
        this.outputParser,
      ]);

      // Math-specific chain
      this.mathChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(`
You are a Mathematics tutor with expertise in all areas of math from basic arithmetic to advanced calculus.

Student Question: {question}
Math Level: {complexity}
Previous Context: {context}

Provide a clear mathematical explanation that includes:
- Step-by-step solution if it's a problem
- Mathematical concepts and formulas involved  
- Visual descriptions or analogies when helpful
- Common mistakes to avoid
- Practice suggestions

Use proper mathematical notation and explain your reasoning clearly. Be encouraging and supportive.

Response:
        `),
        this.llm,
        this.outputParser,
      ]);

      // Science-specific chain
      this.scienceChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(`
You are a Science educator with expertise in {scienceSubject}.

Student Question: {question}
Science Level: {complexity}
Context: {context}

Provide an educational response that includes:
- Clear explanation of the scientific concept
- Real-world examples and applications
- Visual descriptions when helpful
- Related scientific principles
- Fun facts to make it memorable
- Suggestions for further exploration

Make science exciting and understandable! Use analogies and examples from everyday life.

Response:
        `),
        this.llm,
        this.outputParser,
      ]);

      console.log('🔗 LangChain chains initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing chains:', error);
      this.hasValidApiKey = false;
    }
  }

  // Analyze the question to determine the subject and complexity
  analyzeQuestion(question) {
    const questionLower = question.toLowerCase();
    
    // Subject detection
    const subjects = {
      math: ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'equation', 'solve', 'calculate', 'formula', 'graph', 'derivative', 'integral'],
      science: ['science', 'chemistry', 'biology', 'physics', 'atom', 'molecule', 'cell', 'DNA', 'force', 'energy', 'reaction', 'experiment'],
      chemistry: ['chemistry', 'chemical', 'atom', 'molecule', 'reaction', 'periodic table', 'bond', 'compound', 'element'],
      biology: ['biology', 'cell', 'DNA', 'genetics', 'evolution', 'organism', 'ecosystem', 'plant', 'animal', 'human body'],
      physics: ['physics', 'force', 'energy', 'motion', 'gravity', 'electricity', 'wave', 'light', 'magnetic', 'quantum'],
      english: ['english', 'grammar', 'writing', 'essay', 'literature', 'poem', 'story', 'sentence', 'paragraph'],
      history: ['history', 'historical', 'war', 'ancient', 'civilization', 'empire', 'revolution', 'century', 'timeline'],
      study: ['study', 'exam', 'test', 'homework', 'assignment', 'learning', 'memory', 'notes', 'schedule']
    };

    let detectedSubject = 'general';
    let confidence = 0;

    for (const [subject, keywords] of Object.entries(subjects)) {
      const matches = keywords.filter(keyword => questionLower.includes(keyword)).length;
      if (matches > confidence) {
        confidence = matches;
        detectedSubject = subject;
      }
    }

    // Determine complexity level
    const complexity = this.determineComplexity(questionLower);

    return {
      subject: detectedSubject,
      complexity: complexity,
      confidence: confidence
    };
  }

  determineComplexity(question) {
    const advancedTerms = ['derivative', 'integral', 'quantum', 'molecular', 'polynomial', 'logarithm', 'exponential'];
    const intermediateTerms = ['equation', 'formula', 'calculate', 'analyze', 'compare', 'explain'];
    const basicTerms = ['what', 'how', 'why', 'define', 'simple'];

    if (advancedTerms.some(term => question.includes(term))) {
      return 'advanced';
    } else if (intermediateTerms.some(term => question.includes(term))) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  // Generate educational response using LangChain
  async generateResponse(question, context = {}) {
    const analysis = this.analyzeQuestion(question);
    
    try {
      console.log('🎯 AI Service - generateResponse called with:', {
        question: question.substring(0, 50) + '...',
        hasValidApiKey: this.hasValidApiKey,
        contextKeys: Object.keys(context)
      });
      
      console.log('📊 Question analysis:', analysis);
      
      // Check if we have a real API key
      if (!this.hasValidApiKey) {
        console.log('⚠️ No valid API key - using intelligent fallback responses');
        return await this.generateEducationalResponse(question, analysis, context);
      }
      
      console.log('🚀 Attempting LangChain with OpenAI API');
      // Try real LangChain with OpenAI, fall back on quota errors
      return await this.generateLangChainResponse(question, analysis, context);
      
    } catch (error) {
      console.error('❌ Error in generateResponse:', error.message);
      
      // Check if it's a quota/billing error and fall back gracefully
      if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('insufficient')) {
        console.log('💳 OpenAI quota exceeded - falling back to intelligent responses');
        const fallbackResponse = await this.generateEducationalResponse(question, analysis, context);
        return "🤖 **AI Assistant** (Enhanced Mode)\n\n" + fallbackResponse + "\n\n*📝 Note: Using intelligent responses while OpenAI API quota is exceeded. Add billing at https://platform.openai.com/account/billing to enable GPT responses.*";
      }
      
      // For other API errors, also fall back but with different message
      if (error.message.includes('API') || error.message.includes('OpenAI')) {
        console.log('🔄 API issue - falling back to intelligent responses:', error.message);
        const fallbackResponse = await this.generateEducationalResponse(question, analysis, context);
        return "🤖 **AI Assistant** (Intelligent Mode)\n\n" + fallbackResponse + "\n\n*⚡ Note: Using enhanced responses due to API connectivity. Your questions are still being answered intelligently!*";
      }
      
      // Ultimate fallback for any other errors
      console.error('❌ Unexpected error - using basic fallback');
      return this.getFallbackResponse();
    }
  }

  // Real LangChain implementation
  async generateLangChainResponse(question, analysis, context) {
    try {
      const { subject, complexity } = analysis;
      const { user, conversationHistory = [] } = context;
      
      console.log(`🤖 Using LangChain for ${subject} question (${complexity} level)`);
      console.log('🔧 LangChain components check:', {
        hasLLM: !!this.llm,
        hasEducationalChain: !!this.educationalChain,
        hasMathChain: !!this.mathChain,
        hasScienceChain: !!this.scienceChain
      });
      
      // Prepare context for the prompt
      const studentInfo = user ? `Name: ${user.name}, Learning Level: Student` : "Anonymous Student";
      const recentHistory = conversationHistory
        .slice(-3)
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join("\n");

      // Choose appropriate chain based on subject
      let selectedChain = this.educationalChain;
      let promptVariables = {
        question,
        subject,
        complexity,
        studentInfo,
        conversationHistory: recentHistory || "No previous conversation"
      };

      if (subject === 'math' && this.mathChain) {
        console.log('📐 Using math-specific chain');
        selectedChain = this.mathChain;
        promptVariables = {
          question,
          complexity,
          context: recentHistory || "No previous context"
        };
      } else if (['science', 'chemistry', 'biology', 'physics'].includes(subject) && this.scienceChain) {
        console.log('🔬 Using science-specific chain');
        selectedChain = this.scienceChain;
        promptVariables = {
          question,
          scienceSubject: subject,
          complexity,
          context: recentHistory || "No previous context"
        };
      } else {
        console.log('📚 Using general educational chain');
      }

      console.log('📝 Prompt variables:', promptVariables);

      // Invoke the chain with timeout
      const startTime = Date.now();
      console.log('⏱️ Starting LangChain request...');
      
      const response = await Promise.race([
        selectedChain.invoke(promptVariables),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 25000)
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ LangChain response received in ${duration}ms`);
      console.log('📄 Response preview:', response.substring(0, 100) + '...');
      
      return response;
    } catch (error) {
      console.error('❌ LangChain error:', error.message);
      console.error('🔍 Full error:', error);
      
      // Specific error handling with detailed messages
      if (error.message.includes('timeout')) {
        console.log('⏱️ Request timed out');
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('rate_limit')) {
        console.log('🚫 Rate limit exceeded');
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('insufficient_quota') || error.message.includes('exceeded your current quota')) {
        console.log('💳 API quota exceeded - check your OpenAI billing');
        throw new Error('OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing');
      } else if (error.message.includes('invalid_api_key')) {
        console.log('🔑 Invalid API key');
        throw new Error('Invalid OpenAI API key. Please check your key at https://platform.openai.com/api-keys');
      } else if (error.message.includes('InsufficientQuotaError')) {
        console.log('💰 OpenAI quota exceeded - please check your OpenAI account billing');
        throw new Error('OpenAI billing quota exceeded. Please add credits to your account.');
      } else {
        // Unknown error - throw it up
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
    }
  }

  async generateEducationalResponse(question, analysis, context) {
    const { subject, complexity } = analysis;
    
    // Simulate LangChain processing with intelligent responses
    const responses = this.getSubjectSpecificResponses(subject, question, complexity);
    
    // Add contextual information
    let response = responses.main;
    
    if (responses.examples && responses.examples.length > 0) {
      response += "\n\n📝 **Examples:**\n" + responses.examples.join("\n");
    }
    
    if (responses.tips && responses.tips.length > 0) {
      response += "\n\n💡 **Study Tips:**\n" + responses.tips.join("\n");
    }
    
    if (responses.relatedTopics && responses.relatedTopics.length > 0) {
      response += "\n\n🔗 **Related Topics:** " + responses.relatedTopics.join(", ");
    }

    return response;
  }

  getSubjectSpecificResponses(subject, question, complexity) {
    const questionLower = question.toLowerCase();
    
    console.log('🎯 Subject routing:', {
      detectedSubject: subject,
      questionPreview: questionLower.substring(0, 50),
      complexity: complexity
    });

    switch (subject) {
      case 'math':
        console.log('📐 Using math responses');
        return this.getMathResponse(questionLower, complexity);
      case 'science':
      case 'chemistry':
      case 'biology':
      case 'physics':
        console.log('🔬 Using science responses');
        return this.getScienceResponse(questionLower, subject, complexity);
      case 'english':
        console.log('📝 Using English responses');
        return this.getEnglishResponse(questionLower, complexity);
      case 'history':
        console.log('🏛️ Using history responses');
        return this.getHistoryResponse(questionLower, complexity);
      case 'study':
        console.log('📚 Using study responses');
        return this.getStudyResponse(questionLower, complexity);
      default:
        console.log('🌟 Using general responses for subject:', subject);
        return this.getGeneralResponse(questionLower, complexity);
    }
  }

  getMathResponse(question, complexity) {
    if (question.includes('formula') || question.includes('formulas')) {
      return {
        main: "Here are some essential math formulas! 📐\n\n**Algebra:**\n• Quadratic Formula: x = (-b ± √(b²-4ac)) / 2a\n• Slope: m = (y₂-y₁)/(x₂-x₁)\n• Distance: d = √[(x₂-x₁)² + (y₂-y₁)²]\n\n**Geometry:**\n• Area of Circle: A = πr²\n• Circumference: C = 2πr\n• Pythagorean Theorem: a² + b² = c²\n• Area of Triangle: A = ½bh\n\n**Calculus:**\n• Power Rule: d/dx(xⁿ) = nxⁿ⁻¹\n• Product Rule: d/dx(uv) = u'v + uv'\n• Chain Rule: d/dx(f(g(x))) = f'(g(x))·g'(x)",
        examples: [
          "• For x² + 5x + 6 = 0: a=1, b=5, c=6 → x = (-5 ± √(25-24))/2 = (-5 ± 1)/2",
          "• Circle with radius 3: Area = π(3)² = 9π ≈ 28.27 square units"
        ],
        tips: [
          "• Write formulas on index cards for quick reference",
          "• Practice deriving formulas, don't just memorize",
          "• Understand when to use each formula",
          "• Check units in your final answers"
        ],
        relatedTopics: ["Equation Solving", "Graphing", "Word Problems", "Applications"]
      };
    }
    
    if (question.includes('algebra')) {
      return {
        main: "Algebra is about working with variables and equations! 🔢\n\n**Key Concepts:**\n• Variables (x, y, z) represent unknown values\n• Equations show relationships between variables\n• Solve by isolating the variable using inverse operations\n• Always do the same operation to both sides\n\n**Order of Operations:** PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction)",
        examples: [
          "• If 2x + 5 = 15, then 2x = 10, so x = 5",
          "• To solve 3(x - 4) = 21, first distribute: 3x - 12 = 21, then solve: 3x = 33, x = 11"
        ],
        tips: [
          "• Check your answer by substituting back into the original equation",
          "• Draw diagrams for word problems to visualize relationships",
          "• Practice with different types of equations daily"
        ],
        relatedTopics: ["Linear Equations", "Quadratic Equations", "Systems of Equations", "Graphing"]
      };
    }
    
    if (question.includes('calculus')) {
      return {
        main: "Calculus is the mathematics of change and motion! 📈\n\n**Two Main Branches:**\n• **Derivatives** - Find rates of change (like velocity from position)\n• **Integrals** - Find accumulated quantities (like distance from velocity)\n\n**Think of it like:** Derivatives = speedometer reading, Integrals = odometer reading",
        examples: [
          "• Derivative of x² is 2x (power rule)",
          "• Integral of 2x is x² + C (reverse of derivative)"
        ],
        tips: [
          "• Master basic rules before tackling complex problems",
          "• Visualize functions with graphs",
          "• Practice chain rule and integration by parts regularly"
        ],
        relatedTopics: ["Limits", "Chain Rule", "Integration Techniques", "Applications"]
      };
    }
    
    return {
      main: "Math is everywhere! 🧮 Whether you're working on arithmetic, algebra, geometry, or calculus, I'm here to help break down concepts step by step. What specific math topic or problem would you like to work on?",
      tips: [
        "• Practice regularly - even 15 minutes daily helps",
        "• Don't just memorize formulas, understand the why",
        "• Work through problems step by step",
        "• Check your answers whenever possible"
      ]
    };
  }

  getScienceResponse(question, subject, complexity) {
    if (subject === 'chemistry' || question.includes('chemistry')) {
      return {
        main: "Chemistry is the science of matter and its transformations! ⚗️\n\n**Core Concepts:**\n• **Atoms** - Basic building blocks (protons, neutrons, electrons)\n• **Elements** - Pure substances organized in the periodic table\n• **Compounds** - Two or more elements chemically bonded\n• **Reactions** - Processes where substances change into new substances",
        examples: [
          "• Water (H₂O) = 2 hydrogen atoms + 1 oxygen atom",
          "• Combustion: CH₄ + 2O₂ → CO₂ + 2H₂O (methane burns to make carbon dioxide and water)"
        ],
        tips: [
          "• Learn the periodic table gradually",
          "• Practice balancing chemical equations",
          "• Understand electron behavior for bonding",
          "• Connect chemistry to everyday examples"
        ]
      };
    }
    
    if (subject === 'biology' || question.includes('biology')) {
      return {
        main: "Biology is the fascinating study of life! 🧬\n\n**Major Areas:**\n• **Cell Biology** - How cells work and reproduce\n• **Genetics** - How traits are inherited (DNA, RNA)\n• **Evolution** - How species change over time\n• **Ecology** - How organisms interact with their environment",
        examples: [
          "• Your body has ~37 trillion cells working together",
          "• DNA is like a recipe book with instructions for making proteins"
        ],
        tips: [
          "• Use mnemonics for complex processes",
          "• Draw diagrams to understand structures",
          "• Connect biology to your own body and experiences",
          "• Study cycles and processes step by step"
        ]
      };
    }
    
    if (subject === 'physics' || question.includes('physics')) {
      return {
        main: "Physics explains how the universe works! ⚡\n\n**Fundamental Concepts:**\n• **Forces** - Pushes and pulls that cause motion (F = ma)\n• **Energy** - Ability to do work (kinetic, potential, thermal)\n• **Waves** - Disturbances that transfer energy (sound, light)\n• **Matter** - Everything that has mass and takes up space",
        examples: [
          "• When you drop a ball, gravity (9.8 m/s²) accelerates it downward",
          "• A roller coaster converts potential energy (height) to kinetic energy (speed)"
        ],
        tips: [
          "• Visualize problems with diagrams",
          "• Learn units and dimensional analysis",
          "• Practice problem-solving strategies",
          "• Connect physics to everyday phenomena"
        ]
      };
    }
    
    return {
      main: "Science is about understanding the natural world through observation and experimentation! 🔬 Whether you're curious about atoms, ecosystems, forces, or chemical reactions, let's explore together. What specific scientific concept interests you?",
      tips: [
        "• Ask 'why' and 'how' questions constantly",
        "• Connect scientific concepts to real-world examples",
        "• Practice the scientific method",
        "• Don't be afraid to experiment and make mistakes"
      ]
    };
  }

  getStudyResponse(question, complexity) {
    if (question.includes('exam') || question.includes('test')) {
      return {
        main: "Exam success comes from smart preparation! 🎓\n\n**Study Strategy:**\n• **2 weeks before:** Create study schedule, gather materials\n• **1 week before:** Practice tests, review weak areas\n• **Night before:** Light review, good sleep\n• **Exam day:** Arrive early, read instructions carefully",
        tips: [
          "• Use active recall instead of just re-reading",
          "• Take practice tests in exam-like conditions",
          "• Manage your time during the actual exam",
          "• Start with questions you know well to build confidence"
        ]
      };
    }
    
    return {
      main: "Effective studying is a skill you can learn! 📚\n\n**Proven Techniques:**\n• **Active Learning** - Quiz yourself, teach others\n• **Spaced Repetition** - Review at increasing intervals\n• **Pomodoro Technique** - 25min focused study + 5min break\n• **Elaborative Interrogation** - Ask yourself 'why' and 'how'",
      tips: [
        "• Find your optimal study environment",
        "• Take regular breaks to maintain focus",
        "• Use multiple senses (visual, auditory, kinesthetic)",
        "• Connect new information to what you already know"
      ]
    };
  }

  getEnglishResponse(question, complexity) {
    if (question.includes('grammar')) {
      return {
        main: "Grammar is the foundation of clear communication! ✍️\n\n**Key Grammar Areas:**\n• **Parts of Speech** - nouns, verbs, adjectives, adverbs\n• **Sentence Structure** - subjects, predicates, clauses\n• **Punctuation** - commas, periods, semicolons\n• **Verb Tenses** - past, present, future forms",
        examples: [
          "• Subject-Verb Agreement: 'The cats are sleeping' (plural) vs 'The cat is sleeping' (singular)",
          "• Proper comma use: 'I bought apples, oranges, and bananas' (Oxford comma)"
        ],
        tips: [
          "• Read your writing aloud to catch errors",
          "• Learn one grammar rule at a time",
          "• Practice with grammar exercises daily",
          "• Keep a list of your common mistakes"
        ]
      };
    }
    
    if (question.includes('writing') || question.includes('essay')) {
      return {
        main: "Great writing comes from clear thinking and practice! 📝\n\n**Essay Structure:**\n• **Introduction** - Hook, background, thesis statement\n• **Body Paragraphs** - Topic sentence, evidence, analysis\n• **Conclusion** - Restate thesis, summarize, final thought\n• **Revision** - Always edit and proofread",
        tips: [
          "• Start with an outline before writing",
          "• Write a strong thesis statement",
          "• Use transitions between paragraphs",
          "• Read extensively to improve your style"
        ]
      };
    }
    
    return {
      main: "English encompasses reading, writing, grammar, and literature! 📖 Whether you're analyzing texts, improving your writing, or mastering grammar rules, I'm here to help you express yourself clearly and confidently.",
      tips: [
        "• Read diverse texts to expand vocabulary",
        "• Practice writing regularly",
        "• Learn grammar rules gradually",
        "• Discuss what you read with others"
      ]
    };
  }

  getHistoryResponse(question, complexity) {
    if (question.includes('war') || question.includes('world war')) {
      return {
        main: "History's conflicts teach us about human nature and change! ⚔️\n\n**Understanding Historical Wars:**\n• **Causes** - Political, economic, social tensions\n• **Key Events** - Major battles, turning points\n• **Consequences** - Changes in borders, society, technology\n• **Lessons** - How conflicts shaped modern world",
        examples: [
          "• WWI (1914-1918): Started by assassination, ended empires, led to WWII",
          "• WWII (1939-1945): Global conflict, Holocaust, atomic weapons, UN formation"
        ],
        tips: [
          "• Use timelines to understand sequence of events",
          "• Study maps to understand geographic factors",
          "• Learn about key figures and their motivations",
          "• Connect past events to present situations"
        ]
      };
    }
    
    return {
      main: "History is the story of humanity! 🏛️\n\n**Studying History Effectively:**\n• **Chronology** - Understand when events happened\n• **Cause and Effect** - Why events occurred and their impact\n• **Historical Thinking** - Analyze sources and perspectives\n• **Connections** - Link past events to present day",
      tips: [
        "• Create timelines for different periods",
        "• Use primary sources when possible",
        "• Understand different historical perspectives",
        "• Ask 'why' and 'how' questions about events"
      ]
    };
  }

  getGeneralResponse(question, complexity) {
    return {
      main: "I'm here to help you learn and understand any topic! 🌟 Whether you're working on homework, preparing for exams, or just curious about the world, let's explore together. What specific subject or concept would you like to dive into?",
      tips: [
        "• Break complex topics into smaller, manageable parts",
        "• Use examples and analogies to understand abstract concepts",
        "• Practice regularly and consistently",
        "• Don't hesitate to ask follow-up questions"
      ]
    };
  }

  getFallbackResponse() {
    const fallbacks = [
      "I'm experiencing some technical difficulties right now, but I'm still here to help! 🤔 Could you provide a bit more context about what you're studying? I'd love to help you understand this topic better.",
      "I'm here to help you learn! 📚 While I work through a small technical issue, could you tell me more about the specific subject or concept you're working on?",
      "Great question! Learning is all about curiosity. 🌟 What subject area does this relate to? I can provide more targeted assistance with additional context.",
      "I want to give you the best possible explanation! Could you share more details about what you're trying to understand or what level you're studying at? 🎓"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Method to get conversation starters or suggested topics
  getSuggestedTopics() {
    return [
      "📐 Help me with a math problem",
      "🔬 Explain a science concept",
      "📝 Study strategies and tips",
      "🎓 Exam preparation advice",
      "✍️ Homework guidance",
      "🧠 Memory techniques",
      "⏰ Time management for students",
      "📊 Understanding data and graphs"
    ];
  }

  // Test API connection
  async testConnection() {
    if (!this.hasValidApiKey) {
      return { success: false, message: "No valid API key provided" };
    }

    try {
      const testResponse = await this.llm.invoke([
        { role: "user", content: "Say 'API connection successful' in exactly those words." }
      ]);
      
      if (testResponse.content.includes('API connection successful')) {
        return { success: true, message: "LangChain connection verified" };
      } else {
        return { success: true, message: "API responding but unexpected format" };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // Get service status
  getStatus() {
    return {
      hasApiKey: this.hasValidApiKey,
      chainsInitialized: !!(this.educationalChain && this.mathChain && this.scienceChain),
      mode: this.hasValidApiKey ? 'LangChain with OpenAI' : 'Intelligent Fallback',
      ready: true
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
