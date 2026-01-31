import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('studygenie_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (email, password) => {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('studygenie_users') || '[]')
    
    // Find user with matching credentials
    const foundUser = users.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      const userToStore = { ...foundUser }
      delete userToStore.password // Don't store password in user session
      
      setUser(userToStore)
      localStorage.setItem('studygenie_user', JSON.stringify(userToStore))
      return { success: true }
    } else {
      return { success: false, error: 'Invalid email or password' }
    }
  }

  const signup = (name, email, password) => {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('studygenie_users') || '[]')
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    }

    // Add to users array
    users.push(newUser)
    localStorage.setItem('studygenie_users', JSON.stringify(users))

    // Log in the new user
    const userToStore = { ...newUser }
    delete userToStore.password
    
    setUser(userToStore)
    localStorage.setItem('studygenie_user', JSON.stringify(userToStore))
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('studygenie_user')
  }

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
