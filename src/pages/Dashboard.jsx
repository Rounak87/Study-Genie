import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import dashboardData from '../services/dashboardData'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState({
    studyMinutes: 0,
    questionsAsked: 0,
    filesUploaded: 0,
    pagesVisited: 0,
    currentSessionMinutes: 0
  })
  const [studyStreak, setStudyStreak] = useState(0)
  const [subjects, setSubjects] = useState([])
  const [recentInteractions, setRecentInteractions] = useState([])
  const [insights, setInsights] = useState([])

  useEffect(() => {
    loadDashboardData()
    
    // Track page visit
    dashboardData.trackPageVisit?.('dashboard') || 
    (async () => {
      try {
        const { dataTracker } = await import('../services/dataTracker')
        await dataTracker.trackPageVisit('dashboard')
      } catch (error) {
        console.warn('Page tracking failed:', error)
      }
    })()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [
        todayData,
        streakData,
        subjectsData,
        interactionsData,
        insightsData
      ] = await Promise.all([
        dashboardData.getTodayStats(),
        dashboardData.getStudyStreak(),
        dashboardData.getSubjectBreakdown(),
        dashboardData.getRecentInteractions(4),
        dashboardData.getLearningInsights()
      ])
      
      setTodayStats(todayData)
      setStudyStreak(streakData)
      setSubjects(subjectsData)
      setRecentInteractions(interactionsData)
      setInsights(insightsData)
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      name: 'Questions Asked Today',
      value: loading ? '...' : todayStats.questionsAsked.toString(),
      icon: ChatBubbleLeftRightIcon,
      change: loading ? '' : `+${todayStats.questionsAsked}`,
      changeType: 'increase',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Study Minutes',
      value: loading ? '...' : `${todayStats.studyMinutes + todayStats.currentSessionMinutes}m`,
      icon: ClockIcon,
      change: loading ? '' : `Session: ${todayStats.currentSessionMinutes}m`,
      changeType: 'increase',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Files Uploaded',
      value: loading ? '...' : todayStats.filesUploaded.toString(),
      icon: DocumentTextIcon,
      change: loading ? '' : 'Today',
      changeType: 'neutral',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Study Streak',
      value: loading ? '...' : `${studyStreak} days`,
      icon: TrophyIcon,
      change: loading ? '' : 'Current',
      changeType: 'neutral',
      gradient: 'from-amber-500 to-orange-500'
    }
  ]

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now'
    
    const now = Date.now()
    const time = timestamp.seconds ? timestamp.seconds * 1000 : timestamp
    const diff = now - time
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const recentActivity = recentInteractions.map(interaction => ({
    title: `Asked about ${interaction.subject}: "${interaction.question.substring(0, 40)}..."`,
    time: formatTimestamp(interaction.timestamp),
    icon: interaction.subject === 'math' ? AcademicCapIcon : 
          interaction.subject === 'science' ? SparklesIcon :
          interaction.subject === 'study' ? DocumentTextIcon : 
          ChatBubbleLeftRightIcon
  }))

  // Add default activities if no real data yet
  if (recentActivity.length === 0) {
    recentActivity.push(
      { title: 'Welcome to StudyGenie! 🎉', time: 'Start learning', icon: RocketLaunchIcon },
      { title: 'Ask the AI assistant a question to begin tracking', time: 'Get started', icon: ChatBubbleLeftRightIcon }
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
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center mb-6">
            <SparklesIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Your Learning <span className="text-yellow-400">Dashboard</span>
            </h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">Track your progress and continue your learning journey</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      stat.changeType === 'increase' ? 'bg-green-500/20 text-green-400' : 
                      stat.changeType === 'decrease' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">{stat.name}</h3>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <RocketLaunchIcon className="w-5 h-5 mr-2 text-yellow-400" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const ActivityIcon = activity.icon
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                        <ActivityIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group p-6 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300"
                >
                  <DocumentTextIcon className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">Upload Material</p>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group p-6 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
                >
                  <AcademicCapIcon className="w-8 h-8 text-pink-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">Take Quiz</p>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300"
                >
                  <ChartBarIcon className="w-8 h-8 text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">View Analytics</p>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group p-6 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300"
                >
                  <ClockIcon className="w-8 h-8 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">Schedule Study</p>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Learning Insights & Subject Breakdown */}
        {(insights.length > 0 || subjects.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Learning Insights */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
              >
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
                    Learning Insights
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
                      >
                        <div className="text-2xl">{insight.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{insight.message}</p>
                          <p className="text-xs text-gray-400 capitalize">{insight.type} insight</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Subject Breakdown */}
            {subjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
              >
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <AcademicCapIcon className="w-5 h-5 mr-2 text-yellow-400" />
                    Subject Breakdown
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {subjects.map((subject, index) => (
                      <motion.div 
                        key={subject.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                          <span className="text-sm font-medium text-white capitalize">{subject.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">{subject.questions}</span>
                          <p className="text-xs text-gray-400">questions</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Real-time status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Real-time data • Updates every 30s</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
