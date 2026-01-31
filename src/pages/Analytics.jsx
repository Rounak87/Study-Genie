import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  ArrowTrendingUpIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { dashboardData } from '../services/dashboardData'

const Analytics = () => {
  const [weeklyActivity, setWeeklyActivity] = useState([])
  const [subjectDistribution, setSubjectDistribution] = useState([])
  const [stats, setStats] = useState([])
  const [insights, setInsights] = useState([])
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all required data
        const [activity, subjects, todayStats, streak] = await Promise.all([
          dashboardData.getWeeklyActivity(),
          dashboardData.getSubjectBreakdown(),
          dashboardData.getTodayStats(),
          dashboardData.getStudyStreak()
        ])

        // Process weekly activity data
        const processedActivity = activity.map(day => ({
          day: day.day,
          hours: Math.round((day.studyMinutes / 60) * 10) / 10,
          questions: day.questions,
          filesUploaded: day.filesUploaded || 0
        }));
        console.log('Weekly Activity Data:', processedActivity);
        setWeeklyActivity(processedActivity);

        // Process subject distribution
        const totalQuestions = subjects.reduce((sum, subject) => sum + subject.questions, 0)
        setSubjectDistribution(subjects.map((subject, index) => ({
          name: subject.name,
          value: Math.round((subject.questions / totalQuestions) * 100),
          color: colors[index % colors.length]
        })))

        // Update stats
        setStats([
          { 
            label: 'Total Study Hours', 
            value: Math.round(todayStats.studyMinutes / 60 * 10) / 10, 
            trend: '+' + Math.round(todayStats.currentSessionMinutes / 60 * 10) / 10 + 'h', 
            icon: ClockIcon, 
            gradient: 'from-blue-500 to-cyan-500' 
          },
          { 
            label: 'Questions Asked', 
            value: todayStats.questionsAsked, 
            trend: '+' + todayStats.questionsAsked, 
            icon: ArrowTrendingUpIcon, 
            gradient: 'from-green-500 to-emerald-500' 
          },
          { 
            label: 'Files Uploaded', 
            value: todayStats.filesUploaded || 0, 
            trend: '+' + todayStats.filesUploaded, 
            icon: AcademicCapIcon, 
            gradient: 'from-purple-500 to-pink-500' 
          },
          { 
            label: 'Study Streak', 
            value: streak + ' days', 
            trend: 'Current', 
            icon: FireIcon, 
            gradient: 'from-orange-500 to-red-500' 
          }
        ])

        // Fetch and set insights
        const learningInsights = await dashboardData.getLearningInsights()
        setInsights(learningInsights)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      }
    }

    fetchData()
  }, [])

  // Stats will be populated from real data

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
            <ChartBarIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Learning <span className="text-yellow-400">Analytics</span>
            </h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">Insights into your study patterns and progress</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <StatIcon className="w-8 h-8 text-white" />
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.gradient}`}></div>
                </div>
                <h3 className="text-sm font-medium text-gray-300">{stat.label}</h3>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-sm text-green-400 mt-1">{stat.trend}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Study Hours */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Weekly Study Activity</h2>
            {weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" tick={{ fill: 'white' }} />
                  <YAxis yAxisId="left" tick={{ fill: 'white' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }} 
                  />
                  <Bar yAxisId="left" dataKey="hours" fill="url(#blueGradient)" name="Study Hours" />
                  <Bar yAxisId="right" dataKey="questions" fill="url(#purpleGradient)" name="Questions Asked" />
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No study activity data available yet
              </div>
            )}
          </motion.div>

          {/* Subject Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Subject Distribution</h2>
            {subjectDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelStyle={{ fill: 'white', fontSize: '12px' }}
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No subject data available yet
              </div>
            )}
          </motion.div>
        </div>

          {/* Weekly Questions and Files Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Questions Asked Over Time</h2>
            {weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" tick={{ fill: 'white' }} />
                  <YAxis tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="questions" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Questions"
                    dot={{ stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No questions data available yet
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Files Uploaded Over Time</h2>
            {weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" tick={{ fill: 'white' }} />
                  <YAxis tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="filesUploaded" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    name="Files Uploaded"
                    dot={{ stroke: '#F59E0B', strokeWidth: 2, fill: '#F59E0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No file upload data available yet
              </div>
            )}
          </motion.div>
        </div>        {/* Study Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Study Insights</h2>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 
                    ${insight.type === 'subject' ? 'bg-blue-500/20 border-blue-500/30' :
                      insight.type === 'progress' ? 'bg-green-500/20 border-green-500/30' :
                      'bg-purple-500/20 border-purple-500/30'
                    } 
                    backdrop-blur-sm rounded-lg border`}
                >
                  <span className="text-lg mr-2">{insight.icon}</span>
                  <span className={`flex-1 ${
                    insight.type === 'subject' ? 'text-blue-200' :
                    insight.type === 'progress' ? 'text-green-200' :
                    'text-purple-200'
                  }`}>
                    {insight.message}
                  </span>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  Start learning to generate insights!
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Activity Analysis</h2>
            <div className="space-y-3">
              {weeklyActivity.length > 0 && (
                <>
                  <div className="p-3 bg-blue-500/20 backdrop-blur-sm border-l-4 border-blue-400 rounded">
                    <p className="text-blue-200 text-sm">
                      Most active day: {weeklyActivity.reduce((max, day) => 
                        (day.hours > max.hours ? day : max)).day}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 backdrop-blur-sm border-l-4 border-green-400 rounded">
                    <p className="text-green-200 text-sm">
                      Average daily questions: {Math.round(weeklyActivity.reduce((sum, day) => 
                        sum + day.questions, 0) / weeklyActivity.length)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 backdrop-blur-sm border-l-4 border-purple-400 rounded">
                    <p className="text-purple-200 text-sm">
                      Total weekly hours: {Math.round(weeklyActivity.reduce((sum, day) => 
                        sum + day.hours, 0) * 10) / 10}
                    </p>
                  </div>
                </>
              )}
              {weeklyActivity.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No activity data available yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
