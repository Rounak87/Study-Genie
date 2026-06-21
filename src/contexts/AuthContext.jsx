import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import documentStorage from '../services/simpleDocumentStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      const token = localStorage.getItem('studygenie_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.success) {
          const fetchedUser = response.data.user;
          setUser(fetchedUser);
          
          // Bridge user IDs to ensure IndexedDB maps correctly
          localStorage.setItem('studyGenieUserId', fetchedUser.id);
          documentStorage.userId = fetchedUser.id;
        } else {
          // Token invalid/expired
          localStorage.removeItem('studygenie_token');
          localStorage.removeItem('studygenie_user');
        }
      } catch (err) {
        console.error('Failed to verify token on boot:', err);
        // Clean up token only if it's a verification failure, not a server-offline issue
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('studygenie_token');
          localStorage.removeItem('studygenie_user');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data && response.data.success) {
        const { token, user: loggedUser } = response.data;

        // Save session items
        localStorage.setItem('studygenie_token', token);
        localStorage.setItem('studygenie_user', JSON.stringify(loggedUser));
        
        // Sync database user ID with local file storage user ID
        localStorage.setItem('studyGenieUserId', loggedUser.id);
        documentStorage.userId = loggedUser.id;

        setUser(loggedUser);
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (err) {
      console.error('Login request failed:', err);
      const errorMessage = err.response?.data?.error || 'Server error during login';
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      if (response.data && response.data.success) {
        const { token, user: registeredUser } = response.data;

        // Save session items
        localStorage.setItem('studygenie_token', token);
        localStorage.setItem('studygenie_user', JSON.stringify(registeredUser));
        
        // Sync database user ID with local file storage user ID
        localStorage.setItem('studyGenieUserId', registeredUser.id);
        documentStorage.userId = registeredUser.id;

        setUser(registeredUser);
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Registration failed' };
      }
    } catch (err) {
      console.error('Registration request failed:', err);
      const errorMessage = err.response?.data?.error || 'Server error during registration';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studygenie_token');
    localStorage.removeItem('studygenie_user');
    
    // Clear the mapped DB user ID and generate a clean anonymous session for simpleDocumentStorage
    localStorage.removeItem('studyGenieUserId');
    documentStorage.userId = documentStorage.getUserId();
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
