import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import aiService from '../services/aiService'
import dataTracker from '../services/dataTracker'
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserIcon,
  SparklesIcon,
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const FloatingChatbot = () => {
  const { isAuthenticated, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi ${user?.name || 'there'}! 👋 What would you like to learn about today?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome'
    }
  ])
  const [showQuickTopics, setShowQuickTopics] = useState(false)
  const messagesEndRef = useRef(null)

  const quickTopics = [
    { icon: '📐', text: 'Help with Math', query: 'I need help with a math problem' },
    { icon: '🔬', text: 'Science Questions', query: 'I have a science question' },
    { icon: '📚', text: 'Study Tips', query: 'What are some effective study strategies?' },
    { icon: '✍️', text: 'Homework Help', query: 'I need help with my homework' },
    { icon: '🎓', text: 'Exam Prep', query: 'How should I prepare for my upcoming exam?' },
    { icon: '🧠', text: 'Learning Techniques', query: 'What are some good learning techniques?' }
  ]

  const handleQuickTopic = (topic) => {
    setMessage(topic.query)
    setShowQuickTopics(false)
    // Auto-send the message
    setTimeout(() => {
      const syntheticEvent = { preventDefault: () => {} }
      handleSendMessage(syntheticEvent)
    }, 100)
  }

  // Function to format AI responses with proper styling
  const formatMessage = (text) => {
    // Split the message into lines for processing
    const lines = text.split('\n');
    const formattedElements = [];
    let listItems = [];

    const processListItems = () => {
      if (listItems.length > 0) {
        formattedElements.push(
          <ul key={`list-${formattedElements.length}`} className="list-disc list-inside ml-2 space-y-1 mb-3">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      line = line.trim();
      
      if (!line) {
        processListItems();
        if (formattedElements.length > 0) {
          formattedElements.push(<div key={`space-${index}`} className="mb-2"></div>);
        }
        return;
      }

      // Handle headers with **text**
      if (line.includes('**') && line.includes(':')) {
        processListItems();
        const headerText = line.replace(/\*\*/g, '').replace(':', '');
        formattedElements.push(
          <h4 key={`header-${index}`} className="font-semibold text-indigo-700 mb-2 text-sm bg-indigo-50 px-2 py-1 rounded">
            {headerText}:
          </h4>
        );
      }
      // Handle bullet points with •
      else if (line.startsWith('•')) {
        const itemText = line.substring(1).trim();
        listItems.push(itemText);
      }
      // Handle emoji bullets (check if line starts with an emoji)
      else if (line.length > 1 && line.charCodeAt(0) > 127) {
        processListItems();
        formattedElements.push(
          <p key={`emoji-${index}`} className="text-sm text-gray-800 mb-2 flex items-start bg-gray-50 p-2 rounded">
            <span className="mr-2 text-lg">{line.charAt(0)}</span>
            <span className="flex-1">{line.substring(1).trim()}</span>
          </p>
        );
      }
      // Handle section headers like **Key Concepts:**
      else if (line.startsWith('**') && line.endsWith('**')) {
        processListItems();
        const sectionText = line.replace(/\*\*/g, '');
        formattedElements.push(
          <h3 key={`section-${index}`} className="font-bold text-indigo-800 mb-3 text-base border-l-4 border-indigo-500 pl-3 bg-indigo-50 py-2">
            {sectionText}
          </h3>
        );
      }
      // Regular text
      else {
        processListItems();
        formattedElements.push(
          <p key={`text-${index}`} className="text-sm text-gray-800 mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    // Process any remaining list items
    processListItems();

    return formattedElements;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Enhanced AI teaching assistant responses using LangChain-style processing
  const generateAIResponse = async (userMessage) => {
    try {
      // Use the AI service to generate intelligent responses
      const response = await aiService.generateResponse(userMessage, {
        user: user,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });
      
      // Track the chatbot interaction for analytics
      try {
        const analysis = aiService.analyzeQuestion(userMessage);
        await dataTracker.trackChatbotInteraction(
          userMessage, 
          response, 
          analysis.subject, 
          analysis.complexity
        );
        console.log('📊 Chatbot interaction tracked');
      } catch (trackingError) {
        console.warn('⚠️ Data tracking failed:', trackingError);
      }
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to basic educational responses
      return generateBasicResponse(userMessage);
    }
  }

  // Fallback response system
  const generateBasicResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    // Quick response patterns
    if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
      return `Hello! 👋 It's great to see you're ready to learn! I'm here to help you succeed in your studies. What subject or topic would you like to work on today?`
    }
    
    if (message.includes('thank') || message.includes('thanks')) {
      return `You're very welcome! 😊 I'm so glad I could help. Remember, asking questions is a sign of good learning. Is there anything else you'd like to explore or understand better?`
    }
    
    if (message.includes('math') || message.includes('algebra') || message.includes('calculus')) {
      return `I'd love to help with math! 📐 What specific topic are you working on? I can help with algebra, geometry, calculus, statistics, trigonometry, and more. Just share your question or problem!`
    }
    
    if (message.includes('science') || message.includes('chemistry') || message.includes('biology') || message.includes('physics')) {
      return `Science is fascinating! � I can help explain concepts in chemistry, biology, physics, and earth science. What specific topic interests you or what question do you have?`
    }
    
    if (message.includes('study') || message.includes('exam') || message.includes('test')) {
      return `I'm great at helping with study strategies! 📚 Whether you need help with time management, memory techniques, exam preparation, or effective note-taking, I'm here to guide you. What specific study challenge are you facing?`
    }
    
    if (message.includes('homework') || message.includes('assignment')) {
      return `I'm here to help with your homework! 📝 I can guide you through problems step by step, explain concepts, and help you understand the material. What subject is your homework in?`
    }
    
    // Default encouraging response
    return `That's a great question! 🤔 I'm here to help you learn and understand any topic. Could you provide a bit more detail about what you're studying or what specific concept you'd like to explore? The more context you give me, the better I can assist you!`
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || isTyping) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentMessage = message
    setMessage('')
    setIsTyping(true)

    try {
      // Generate AI response using the enhanced AI service
      const aiResponseText = await generateAIResponse(currentMessage)
      
      // Add AI response
      const botResponse = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'bot',
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, botResponse])
        setIsTyping(false)
      }, 1000) // Small delay for better UX
      
    } catch (error) {
      console.error('Error in message handling:', error)
      
      // Fallback response
      const fallbackResponse = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your question right now. Could you try asking again? I'm here to help with any educational topic! 🤖📚",
        sender: 'bot',
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, fallbackResponse])
        setIsTyping(false)
      }, 1000)
    }
  }

  if (!isAuthenticated) {
    return null // Don't show chatbot if not logged in
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <style>{`
        .formatted-message {
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .formatted-message h3 {
          color: #4f46e5;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .formatted-message h4 {
          color: #6366f1;
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .formatted-message ul {
          margin-left: 8px;
        }
        .formatted-message code {
          background-color: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      `}</style>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AcademicCapIcon className="w-6 h-6 mr-2" />
              <div>
                <h3 className="font-semibold">AI Teaching Assistant</h3>
                <p className="text-xs opacity-90 flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></span>
                  Ready to help you learn
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-3 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex items-center mb-2">
                      <SparklesIcon className="w-3 h-3 text-indigo-600 mr-1" />
                      <span className="text-xs font-medium text-indigo-600">AI Assistant</span>
                    </div>
                  )}
                  {msg.sender === 'user' ? (
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  ) : (
                    <div className="formatted-message">
                      {formatMessage(msg.text)}
                    </div>
                  )}
                  <p className={`text-xs opacity-70 mt-2 ${
                    msg.sender === 'user' ? 'text-white' : 'text-gray-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg max-w-xs">
                  <div className="flex items-center mb-1">
                    <SparklesIcon className="w-3 h-3 text-indigo-600 mr-1" />
                    <span className="text-xs font-medium text-indigo-600">AI Assistant</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
            {/* Quick Topics */}
            {showQuickTopics && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {quickTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickTopic(topic)}
                    className="flex items-center space-x-2 p-2 text-xs bg-white border border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span>{topic.icon}</span>
                    <span className="truncate">{topic.text}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowQuickTopics(!showQuickTopics)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-md transition-colors"
                title="Quick Topics"
              >
                <LightBulbIcon className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !message.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-md transition-all duration-200"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 Powered by advanced AI - ask me anything about any subject!
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <div className="relative">
            <AcademicCapIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <SparklesIcon className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        )}
      </button>

      {/* Notification Badge (when closed) */}
      {!isOpen && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <BookOpenIcon className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}

export default FloatingChatbot
