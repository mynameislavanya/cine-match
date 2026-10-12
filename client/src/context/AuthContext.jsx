import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cinematch_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cinematch_token'));

  const persist = (data) => {
    const { token: t, ...profile } = data;
    setUser(profile);
    setToken(t);
    localStorage.setItem('cinematch_token', t);
    localStorage.setItem('cinematch_user', JSON.stringify(profile));
  };

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persist(data);
    return data;
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    persist(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cinematch_token');
    localStorage.removeItem('cinematch_user');
  }, []);

  const updatePreferences = useCallback(async (payload) => {
    const { data } = await api.put('/auth/preferences', payload);
    setUser(data);
    localStorage.setItem('cinematch_user', JSON.stringify(data));
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
