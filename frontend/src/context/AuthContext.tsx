import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check current session on application mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.get<{ user: User }>('/auth/me');
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err: any) {
        if (err?.status === 401) {
          setUser(null);
          localStorage.removeItem('optopick_token');
        } else {
          // If transient network glitch, keep session token intact
          console.warn('Session check notice:', err?.message || err);
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const data = await api.post<{ user: User; token: string }>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('optopick_token', data.token);
    }
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('optopick_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isStaff: user?.role === 'STAFF',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
