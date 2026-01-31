import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon,
  MapIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('login') // 'login' or 'signup'

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Upload', href: '/upload', icon: DocumentArrowUpIcon },
    { name: 'Roadmap', href: '/roadmap', icon: MapIcon },
    { name: 'Study Guide', href: '/study-guide', icon: DocumentTextIcon },
    { name: 'Analytics', href: '/analytics', icon: AcademicCapIcon },
    { name: 'Visualization', href: '/visualization', icon: BeakerIcon },
    { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
  ]

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  const openLoginModal = () => {
    setModalType('login')
    setShowModal(true)
  }

  const openSignupModal = () => {
    setModalType('signup')
    setShowModal(true)
  }

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 shadow-2xl border-b border-white/20 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-white hover:text-yellow-400 transition-colors duration-300">
                StudyGenie
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                        : 'border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
                    } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium rounded-t-lg transition-all duration-300`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.name || 'User'}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/10 w-full text-left rounded-lg mx-2 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={openLoginModal}
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/20 hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={openSignupModal}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
                  } block pl-3 pr-4 py-3 border-l-4 text-base font-medium rounded-r-lg transition-all`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 inline mr-3" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Mobile auth buttons */}
            <div className="pt-4 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Log Out
                </button>
              ) : (
                <>
                  <button
                    onClick={openLoginModal}
                    className="w-full text-left px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="w-full text-left px-3 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg transition-all"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
    </nav>
  )
}

export default Navbar
