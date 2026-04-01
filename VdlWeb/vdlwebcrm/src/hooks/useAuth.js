import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../features/auth/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
