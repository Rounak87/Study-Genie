import { useState, useEffect } from 'react'
import { useSummary } from '../contexts/SummaryContext'
import qnaService from '../services/qnaService'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  LightBulbIcon,
  ArrowPathIcon,
  SparklesIcon,
  BookOpenIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

const getRandomGradient = () => {
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500'
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

const StudyGuide = () => {
  const [activeTab, setActiveTab] = useState('summaries')
  const { summary, studyMaterials } = useSummary()
  const [flippedCard, setFlippedCard] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [quizCompleted, setQuizCompleted] = useState(false)
  
  // QnA state
  const [qnaHistory, setQnaHistory] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)

  // Switch to quiz tab if study materials are available
  useEffect(() => {
    if (studyMaterials.isGenerated && studyMaterials.questions.length > 0) {
      setActiveTab('quiz')
    }
  }, [studyMaterials])

  const handleAnswerSubmit = () => {
    if (selectedAnswer !== null && studyMaterials.questions.length > 0) {
      const currentQuestion = studyMaterials.questions[currentQuestionIndex]
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }))
      setShowAnswer(true)
    }
  }

  const nextQuestion = () => {
    setSelectedAnswer(null)
    setShowAnswer(false)
    if (studyMaterials.questions.length > 0) {
      setCurrentQuestionIndex(prev => 
        prev < studyMaterials.questions.length - 1 ? prev + 1 : 0
      )
    }
  }

  const shuffleFlashcards = () => {
    setFlippedCard(null) // Reset flipped cards when shuffling
  }

  // Enhanced QnA functionality
  const generateAnswer = async (question) => {
    if (!question.trim() || !summary) return;
    
    setIsLoadingAnswer(true);
    
    try {
      // Use the enhanced QnA service for better answer generation
      const answer = await qnaService.generateAnswer(question, summary);
      
      const newQnA = {
        id: Date.now(),
        question: question.trim(),
        answer: answer,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success'
      };
      
      setQnaHistory(prev => [...prev, newQnA]);
      setCurrentQuestion('');
    } catch (error) {
      console.error('Error generating answer:', error);
      const errorQnA = {
        id: Date.now(),
        question: question.trim(),
        answer: "I apologize, but I'm having trouble processing your question right now. Could you try rephrasing it or asking about a different aspect of the document?",
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      setQnaHistory(prev => [...prev, errorQnA]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (currentQuestion.trim()) {
      generateAnswer(currentQuestion);
    }
  };

  // Enhanced question suggestions based on document context
  const getSmartQuestionSuggestions = () => {
    if (!summary) return [];
    
    const suggestions = [
      "What is the main topic of this document?",
      "Can you summarize the key points?",
      "What are the most important concepts mentioned?",
    ];

    // Add context-specific suggestions based on content
    const summaryText = typeof summary === 'string' ? summary : summary?.summary || '';
    const summaryLower = summaryText.toLowerCase();
    
    if (summaryLower.includes('process') || summaryLower.includes('method')) {
      suggestions.push("How does this process work?");
    }
    if (summaryLower.includes('problem') || summaryLower.includes('solution')) {
      suggestions.push("What problems does this address?");
    }
    if (summaryLower.includes('benefit') || summaryLower.includes('advantage')) {
      suggestions.push("What are the main benefits mentioned?");
    }
    if (summaryLower.includes('research') || summaryLower.includes('study')) {
      suggestions.push("What research findings are presented?");
    }
    if (summaryLower.includes('example') || summaryLower.includes('case')) {
      suggestions.push("Can you provide examples from the document?");
    }

    return suggestions.slice(0, 5);
  };

  const getDifficultyColor = (difficulty) => {
    if (typeof difficulty === 'number') {
      if (difficulty < 0.4) return 'text-green-400 bg-green-500/20'
      if (difficulty < 0.7) return 'text-yellow-400 bg-yellow-500/20'
      return 'text-red-400 bg-red-500/20'
    }
    
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getDifficultyText = (difficulty) => {
    if (typeof difficulty === 'number') {
      if (difficulty < 0.4) return 'Easy'
      if (difficulty < 0.7) return 'Medium'
      return 'Hard'
    }
    return difficulty || 'Unknown'
  }

  const tabs = [
    { 
      id: 'summaries', 
      label: 'Study Summary', 
      icon: DocumentTextIcon, 
      count: summary ? 1 : 0
    },
    { 
      id: 'flashcards', 
      label: 'Flashcards', 
      icon: LightBulbIcon, 
      count: studyMaterials.flashcards.length 
    },
    { 
      id: 'quiz', 
      label: 'Practice Quiz', 
      icon: AcademicCapIcon, 
      count: studyMaterials.questions.length 
    },
    { 
      id: 'qna', 
      label: 'Q&A Assistant', 
      icon: ChatBubbleLeftRightIcon, 
      count: qnaHistory.length 
    }
  ]

  const FlashCard = ({ card, index }) => {
    const isFlipped = flippedCard === index

    return (
      <motion.div
        className="relative w-full h-64 cursor-pointer"
        onClick={() => setFlippedCard(isFlipped ? null : index)}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <motion.div
          className="relative w-full h-full transition-transform duration-700"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className={`absolute inset-0 w-full h-full bg-gradient-to-r ${getRandomGradient()} rounded-2xl p-6 flex flex-col justify-between text-white backface-hidden shadow-2xl`} style={{ backfaceVisibility: 'hidden' }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(card.difficulty)}`}>
                  {getDifficultyText(card.difficulty)}
                </span>
                <LightBulbIcon className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium leading-relaxed">{card.front}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Click to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div className={`absolute inset-0 w-full h-full bg-gradient-to-r ${getRandomGradient()} rounded-2xl p-6 flex flex-col justify-between text-white backface-hidden shadow-2xl`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium opacity-80">{card.category || 'Study Material'}</span>
                <TrophyIcon className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium leading-relaxed">{card.back}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">Click to see question</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const QuizQuestion = () => {
    if (studyMaterials.questions.length === 0) {
      return (
        <div className="text-center py-12">
          <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Questions Available</h3>
          <p className="text-gray-400">Generate quiz questions from a document summary first.</p>
        </div>
      )
    }

    const currentQuestion = studyMaterials.questions[currentQuestionIndex]

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Quiz Question</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">
              {currentQuestionIndex + 1} / {studyMaterials.questions.length}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {getDifficultyText(currentQuestion.difficulty)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg text-white mb-4">{currentQuestion.question}</p>
          
          {!showAnswer ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedAnswer === index 
                      ? 'bg-blue-500/20 border-2 border-blue-500' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/20'
                  }`}
                >
                  <span className="font-medium text-white">{String.fromCharCode(65 + index)}. </span>
                  <span className="text-gray-200">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-4 rounded-xl ${
              selectedAnswer === currentQuestion.correctAnswer 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <div className="flex items-center mb-2">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-400 mr-2" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-400 mr-2" />
                )}
                <span className="text-white font-medium">
                  {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-gray-200 mb-2">
                <strong>Correct Answer:</strong> {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
              </p>
              {currentQuestion.explanation && (
                <p className="text-gray-300 text-sm">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          {!showAnswer ? (
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null}
              className={`px-6 py-3 rounded-xl font-medium ${
                selectedAnswer === null 
                  ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600"
            >
              Next Question
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            <TrophyIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-white">
              Score: {score.correct}/{score.total}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 animate-pulse"></div>
        <div className="absolute top-40 -left-32 w-64 h-64 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-10 animate-bounce"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-10 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <BookOpenIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Study <span className="text-yellow-400">Guide</span>
            </h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">
            AI-generated summaries, flashcards, and quizzes from your uploaded materials
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center mb-8 gap-4"
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                    : 'bg-white/10 backdrop-blur-lg text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                <TabIcon className="w-5 h-5 mr-2" />
                <span>{tab.label}</span>
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                  {tab.count}
                </span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          {activeTab === 'summaries' && (
            <div className="grid gap-6">
              {summary ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Study Material Summary</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRandomGradient()} text-white`}>
                        Document Summary
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">
                      Generated from uploaded document
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap">
                    {typeof summary === 'string' ? summary : summary?.summary || 'No summary available'}
                  </p>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Summary Available</h3>
                  <p className="text-gray-400">Upload a document and generate a summary to get started.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Interactive Flashcards</h2>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shuffleFlashcards}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Shuffle Cards
                </motion.button>
              </div>
              
              {studyMaterials.flashcards.length === 0 ? (
                <div className="text-center py-12">
                  <LightBulbIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Flashcards Available</h3>
                  <p className="text-gray-400">Generate flashcards from a document summary first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studyMaterials.flashcards.map((card, index) => (
                    <FlashCard key={index} card={card} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && <QuizQuestion />}

          {activeTab === 'qna' && (
            <div className="space-y-6">
              {/* QnA Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Q&A Assistant</h2>
                <p className="text-gray-300">Ask any question about your document summary</p>
              </div>

              {/* Question Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
              >
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Ask a question about the document:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="e.g., What is the main topic? How does this work? Why is this important?"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        disabled={isLoadingAnswer || !summary}
                      />
                      <button
                        type="submit"
                        disabled={!currentQuestion.trim() || isLoadingAnswer || !summary}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                          currentQuestion.trim() && summary && !isLoadingAnswer
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isLoadingAnswer ? (
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <PaperAirplaneIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {!summary && (
                    <p className="text-yellow-400 text-sm">
                      Please upload a document and generate a summary first to use the Q&A feature.
                    </p>
                  )}
                </form>
              </motion.div>

              {/* QnA History */}
              <div className="space-y-4">
                {qnaHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Questions Yet</h3>
                    <p className="text-gray-400">Start by asking a question about your document!</p>
                  </div>
                ) : (
                  qnaHistory.map((qna) => (
                    <motion.div
                      key={qna.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
                    >
                      {/* Question */}
                      <div className="bg-blue-500/20 p-4 border-b border-white/10">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{qna.question}</p>
                            <p className="text-blue-200 text-xs mt-1">{qna.timestamp}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Answer */}
                      <div className={`p-4 ${qna.type === 'error' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            qna.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {qna.type === 'error' ? (
                              <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                            ) : (
                              <SparklesIcon className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium leading-relaxed whitespace-pre-wrap ${
                              qna.type === 'error' ? 'text-red-200' : 'text-green-100'
                            }`}>
                              {qna.answer}
                            </div>
                            {qna.type === 'success' && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-gray-400">
                                  💡 Follow up with more specific questions for deeper insights!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Smart Question Suggestions */}
              {summary && qnaHistory.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">💡 Suggested Questions</h3>
                  <p className="text-gray-400 text-sm mb-4">Click any question to get started, or type your own!</p>
                  <div className="grid grid-cols-1 gap-3">
                    {getSmartQuestionSuggestions().map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(suggestion)}
                        className="text-left p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-300 group"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-blue-400 font-medium flex-shrink-0 mt-0.5">Q{index + 1}:</span>
                          <span className="group-hover:text-blue-300 transition-colors">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default StudyGuide