import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use relative path in production (Vercel) to hit the serverless functions
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('life_audit_token');
    const savedUser = localStorage.getItem('life_audit_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Login failed.' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('life_audit_token', data.token);
      localStorage.setItem('life_audit_user', JSON.stringify(data.user));
      return {};
    } catch (e) {
      return { error: 'Unable to connect to authentication server.' };
    }
  };

  const register = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Registration failed.' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('life_audit_token', data.token);
      localStorage.setItem('life_audit_user', JSON.stringify(data.user));
      return {};
    } catch (e) {
      return { error: 'Unable to connect to authentication server.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('life_audit_token');
    localStorage.removeItem('life_audit_user');
    
    // Clear cache stored for offline entries to avoid data leaks across logouts
    localStorage.removeItem('life_audit_logs');
    localStorage.removeItem('life_audit_wheel');
    localStorage.removeItem('life_audit_checklist_items');
  };

  // Custom fetch wrapper that appends JWT token and intercepts session expirations
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const finalOptions = {
      ...options,
      headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, apiFetch }}>
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
