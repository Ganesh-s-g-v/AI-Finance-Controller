import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { loginApi, registerApi, getMeApi, logoutApi } from './api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole, company_name?: string) => Promise<void>;
  demoLogin: (role: 'cfo' | 'auditor' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      localStorage.removeItem('auth_user');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Separate flag for login/register actions so the app gate doesn't flash
  // the dashboard while credentials are being verified.
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Validate and sync user on mount
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        try {
          const profile = await getMeApi();
          setUser(profile);
          localStorage.setItem('auth_user', JSON.stringify(profile));
        } catch (err) {
          // Token expired or invalid
          console.warn('Session expired or invalid, resetting auth state.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const res = await loginApi(email.trim(), password);
      // Persist synchronously before updating state so a re-render or
      // remount always sees a consistent session.
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'CONTROLLER',
    company_name = 'Apex Technologies Pvt Ltd'
  ) => {
    setIsAuthenticating(true);
    try {
      const res = await registerApi({ name, email, password, role, company_name });
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const demoLogin = async (role: 'cfo' | 'auditor' | 'admin') => {
    if (role === 'cfo') {
      await login('cfo@financecontroller.ai', 'cfo123456');
    } else if (role === 'auditor') {
      await login('auditor@financecontroller.ai', 'audit123456');
    } else {
      await login('admin@financecontroller.ai', 'admin123456');
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      // Always clear client state, even if the backend call fails/offline.
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isAuthenticating,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
