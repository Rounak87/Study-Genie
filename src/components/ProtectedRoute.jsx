import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import Home from '../pages/Home'

const ProtectedRoute = ({ children, defaultModal = 'login' }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState(defaultModal) // 'login' or 'signup'
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowModal(true)
      setModalType(defaultModal)
    }
  }, [isAuthenticated, isLoading, defaultModal])

  const handleModalClose = () => {
    setShowModal(false)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {/* Show homepage in background */}
        <Home />
        
        {/* Modal overlay */}
        <Modal 
          isOpen={showModal} 
          onClose={handleModalClose}
          title={modalType === 'login' ? 'Welcome Back' : 'Join StudyGenie'}
        >
          {modalType === 'login' ? (
            <LoginModal 
              onClose={handleModalClose}
              onSwitchToSignup={() => setModalType('signup')}
            />
          ) : (
            <SignupModal 
              onClose={handleModalClose}
              onSwitchToLogin={() => setModalType('login')}
            />
          )}
        </Modal>
      </>
    )
  }

  return children
}

export default ProtectedRoute
