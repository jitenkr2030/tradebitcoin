import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/trading';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  upgradeSubscription: (plan: 'PRO' | 'ENTERPRISE') => Promise<void>;
  enable2FA: () => Promise<void>;
  updateApiKeys: (exchange: string, key: string, secret: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored auth token and validate
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and fetch user data
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const upgradeSubscription = async (plan: 'PRO' | 'ENTERPRISE') => {
    try {
      const response = await fetch('http://localhost:3000/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan })
      });
      
      if (!response.ok) throw new Error('Subscription upgrade failed');
      
      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      console.error('Subscription upgrade error:', error);
      throw error;
    }
  };

  const enable2FA = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/enable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('2FA enablement failed');
      
      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      console.error('2FA enablement error:', error);
      throw error;
    }
  };

  const updateApiKeys = async (exchange: string, key: string, secret: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ exchange, key, secret })
      });
      
      if (!response.ok) throw new Error('API key update failed');
      
      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      console.error('API key update error:', error);
      throw error;
    }
  };

  const value = {
    user,
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