import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types';
import { AuthApi } from '../api/endpoints';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: { username: string; email?: string; phone?: string; password: string; marketingEmails?: boolean }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('myinner_token');
    if (!token) {
      setLoading(false);
      return;
    }
    AuthApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('myinner_token'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('myinner:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('myinner:unauthorized', handleUnauthorized);
  }, []);

  async function login(identifier: string, password: string) {
    const { token, user: loggedInUser } = await AuthApi.login({ identifier, password });
    localStorage.setItem('myinner_token', token);
    setUser(loggedInUser);
  }

  async function register(input: { username: string; email?: string; phone?: string; password: string; marketingEmails?: boolean }) {
    const { token, user: newUser } = await AuthApi.register(input);
    localStorage.setItem('myinner_token', token);
    setUser(newUser);
  }

  function logout() {
    void AuthApi.logout().catch(() => undefined);
    localStorage.removeItem('myinner_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
