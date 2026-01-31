import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'
import { 
  DocumentTextIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon,
  MapIcon,
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  RocketLaunchIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('login') // 'login' or 'signup'
  
  const features = [
    {
      icon: DocumentArrowUpIcon,
      title: 'Smart File Upload',
      description: 'Upload PDFs, handwritten notes, and multimedia content with intelligent OCR extraction.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: MapIcon,
      title: 'Interactive Roadmaps',
      description: 'Dynamic learning paths with milestone tracking and progress visualization.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: DocumentTextIcon,
      title: 'AI Study Guides',
      description: 'Personalized summaries, quizzes, and flashcards generated from your content.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'AI Tutor',
      description: 'Real-time Q&A with context-aware answers based on your uploaded materials.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Adaptive Scheduling',
      description: 'Smart timetables that adapt to your learning pace and goals.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: GlobeAltIcon,
      title: 'Multilingual Support',
      description: 'Study in English, Hindi, Marathi, and other regional languages.',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      icon: AcademicCapIcon,
      title: 'Progress Analytics',
      description: 'Detailed insights into your learning journey with visual dashboards.',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Community Learning',
      description: 'Connect with peers, share roadmaps, and collaborate on studies.',
      gradient: 'from-amber-500 to-orange-500'
    }
  ]

  const stats = [
    { number: '50K+', label: 'Active Students', icon: UserGroupIcon },
    { number: '1M+', label: 'Study Materials', icon: DocumentTextIcon },
    { number: '95%', label: 'Success Rate', icon: ChartBarIcon },
    { number: '24/7', label: 'AI Support', icon: ChatBubbleLeftRightIcon }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Engineering Student',
      content: 'StudyGenie transformed my study routine. The AI-generated summaries saved me hours!',
      rating: 5,
      avatar: '👩‍🎓'
    },
    {
      name: 'Arjun Patel',
      role: 'Medical Student',
      content: 'The interactive roadmaps kept me on track for my NEET preparation. Highly recommended!',
      rating: 5,
      avatar: '👨‍⚕️'
    },
    {
      name: 'Sneha Kumar',
      role: 'MBA Aspirant',
      content: 'Multilingual support helped me study in Hindi. The AI tutor is incredibly smart!',
      rating: 5,
      avatar: '👩‍💼'
    }
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
          <div className="absolute top-40 -left-32 w-64 h-64 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 animate-bounce"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-20 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center mb-6"
            >
              <SparklesIcon className="w-12 h-12 text-yellow-400 mr-3" />
              <h1 className="text-6xl md:text-7xl font-bold">
                Study<span className="text-yellow-400">Genie</span>
              </h1>
              <SparklesIcon className="w-12 h-12 text-yellow-400 ml-3" />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl mb-4 text-gray-200"
            >
              Transform your learning with AI-powered education
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-lg mb-12 max-w-3xl mx-auto text-gray-300"
            >
              Personalized study materials, interactive roadmaps, and intelligent tutoring 
              that adapts to your learning style and pace
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex justify-center"
            >
              {isAuthenticated ? (
                <Link
                  to="/upload"
                  className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center"
                >
                  <RocketLaunchIcon className="w-6 h-6 mr-2 group-hover:animate-bounce" />
                  Get Started
                </Link>
              ) : (
                <Link
                  to="/upload"
                  className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center"
                >
                  <RocketLaunchIcon className="w-6 h-6 mr-2 group-hover:animate-bounce" />
                  Get Started
                </Link>
              )}
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-300"
            >
              <div className="flex items-center">
                <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
              <div className="flex items-center">
                <UserGroupIcon className="w-5 h-5 text-green-400 mr-1" />
                <span className="text-sm">50K+ Students</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-1" />
                <span className="text-sm">Trusted by Universities</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Smart Learning</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leverage cutting-edge AI technology to create your perfect study environment
              and achieve your academic goals faster than ever before
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Decorative element */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <Icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-300 font-medium">{stat.label}</div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              What Students Say About 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> StudyGenie</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of successful students who transformed their learning journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-10 -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-10 translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Join thousands of students already using StudyGenie to achieve their academic goals.
              Start your journey today and unlock your full potential!
            </p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {isAuthenticated ? (
                <Link
                  to="/upload"
                  className="group inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-12 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <RocketLaunchIcon className="w-7 h-7 mr-3 group-hover:animate-bounce" />
                  Start Your Journey
                </Link>
              ) : (
                <Link
                  to="/upload"
                  className="group inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-12 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <RocketLaunchIcon className="w-7 h-7 mr-3 group-hover:animate-bounce" />
                  Join StudyGenie
                </Link>
              )}
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-8 text-gray-400"
            >
              Free to start • No credit card required • Join 50K+ students
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Modal for Login/Signup */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={modalType === 'login' ? 'Welcome Back' : 'Join StudyGenie'}
      >
        {modalType === 'login' ? (
          <LoginModal 
            onClose={() => setShowModal(false)}
            onSwitchToSignup={() => setModalType('signup')}
          />
        ) : (
          <SignupModal 
            onClose={() => setShowModal(false)}
            onSwitchToLogin={() => setModalType('login')}
          />
        )}
      </Modal>
    </div>
  )
}

export default Home
