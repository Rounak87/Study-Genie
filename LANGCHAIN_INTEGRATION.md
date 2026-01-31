# LangChain Integration Guide for StudyGenie Chatbot

## 🚀 Quick Setup

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (it starts with `sk-`)

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and replace `your_openai_api_key_here` with your actual API key:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Restart Development Server
```bash
npm run dev
```

## 🤖 How It Works

### Current Implementation
The chatbot now has **dual-mode operation**:

1. **With API Key**: Uses real OpenAI GPT-3.5-turbo via LangChain
2. **Without API Key**: Falls back to intelligent pattern-matching responses

### LangChain Features Implemented

#### 1. **Smart Prompt Templates**
- **Educational Assistant**: General tutoring with context awareness
- **Math Tutor**: Specialized for mathematical problem-solving
- **Science Educator**: Tailored for scientific concepts

#### 2. **Chain Architecture**
```javascript
// Example chain structure
const educationalChain = RunnableSequence.from([
  promptTemplate,    // Formats the prompt
  llm,              // OpenAI GPT model
  outputParser,     // Formats the response
]);
```

#### 3. **Context Awareness**
- Tracks conversation history
- Adapts to student level
- Maintains subject context

## 🎯 Features Available

### Real LangChain Integration
When you add your API key, you get:

- **GPT-3.5-turbo responses** - Real AI understanding
- **Context-aware conversations** - Remembers previous messages
- **Subject specialization** - Different prompts for math, science, etc.
- **Adaptive complexity** - Adjusts to student level
- **Educational focus** - Optimized for learning

### Fallback System
Without an API key, you still get:
- **Intelligent pattern matching** - Smart keyword detection
- **Subject-specific responses** - Pre-built educational content
- **Study tips and examples** - Comprehensive learning support
- **Encouraging interactions** - Motivational responses

## 🔧 Advanced Customization

### Adding New Subjects
```javascript
// In aiService.js
this.historyChain = RunnableSequence.from([
  PromptTemplate.fromTemplate(`
You are a History educator specializing in {period}.
Question: {question}
Context: {context}

Provide engaging historical context with:
- Key events and dates
- Important figures
- Cause and effect relationships
- Connections to modern times

Response:
  `),
  this.llm,
  this.outputParser,
]);
```

### Custom Prompts
You can modify prompts in `initializeChains()` to:
- Change the AI's personality
- Add specific teaching methods
- Include curriculum standards
- Adjust response length

### Memory Integration
Future enhancement: Add conversation memory:
```javascript
import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory } from "langchain/memory";
```

## 💡 Usage Examples

### Math Problem
**Input**: "Help me solve 2x + 5 = 15"
**LangChain Response**: Step-by-step solution with explanations, common mistakes, and practice suggestions

### Science Question
**Input**: "What is photosynthesis?"
**LangChain Response**: Detailed explanation with analogies, real-world examples, and related concepts

### Study Help
**Input**: "How should I prepare for my chemistry exam?"
**LangChain Response**: Personalized study plan based on chemistry-specific strategies

## 🛡️ Security & Best Practices

### API Key Security
- Never commit `.env` files to version control
- Use different keys for development and production
- Monitor API usage in OpenAI dashboard
- Set usage limits to control costs

### Error Handling
The service includes:
- Automatic fallback to mock responses
- Error logging for debugging
- Rate limiting awareness
- Graceful degradation

## 🎛️ Configuration Options

### Model Settings
```javascript
this.llm = new ChatOpenAI({
  openAIApiKey: apiKey,
  modelName: "gpt-3.5-turbo",  // or "gpt-4" for better quality
  temperature: 0.7,            // Creativity level (0-1)
  maxTokens: 500,             // Response length limit
});
```

### Response Tuning
- **Temperature**: Higher = more creative, Lower = more focused
- **Max Tokens**: Controls response length
- **Model**: GPT-3.5-turbo (fast) vs GPT-4 (better quality, slower)

## 🚀 Next Steps

### Enhanced Features You Can Add:

1. **Document QA**: Upload study materials and ask questions about them
2. **Memory Persistence**: Remember student progress across sessions
3. **Multi-modal**: Add image recognition for handwritten problems
4. **Voice Chat**: Integrate speech-to-text for verbal questions
5. **Collaborative Learning**: Multi-student chat sessions

### Professional Deployment:
- Use environment-specific API keys
- Implement user authentication with API quotas
- Add conversation analytics
- Monitor and optimize costs

## 💬 Testing Your Integration

1. **Without API Key**: Test fallback responses work
2. **With API Key**: Verify real LangChain responses
3. **Error Handling**: Try invalid inputs
4. **Context Awareness**: Have multi-turn conversations

Your chatbot is now ready for professional educational assistance! 🎓
