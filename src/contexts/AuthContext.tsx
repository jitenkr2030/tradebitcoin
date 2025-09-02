import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types/trading';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  upgradeSubscription: (plan: 'PRO' | 'ELITE') => Promise<void>;
  enable2FA: () => Promise<void>;
  updateApiKeys: (exchange: string, key: string, secret: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Validate token by making a request
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data);
        } else {
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, tokens } = response.data.data;
      
      localStorage.setItem('authToken', tokens.accessToken);
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authAPI.register(email, password, name);
      const { user: userData, tokens } = response.data.data;
      
      localStorage.setItem('authToken', tokens.accessToken);
      setUser(userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const upgradeSubscription = async (plan: 'PRO' | 'ELITE') => {
    try {
      // Implementation for subscription upgrade
      console.log('Upgrading to:', plan);
    } catch (error) {
      console.error('Subscription upgrade error:', error);
      throw error;
    }
  };

  const enable2FA = async () => {
    try {
      // Implementation for 2FA
      console.log('Enabling 2FA');
    } catch (error) {
      console.error('2FA enablement error:', error);
      throw error;
    }
  };

  const updateApiKeys = async (exchange: string, key: string, secret: string) => {
    try {
      // Implementation for API key update
      console.log('Updating API keys for:', exchange);
    } catch (error) {
      console.error('API key update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    upgradeSubscription,
    enable2FA,
    updateApiKeys
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}