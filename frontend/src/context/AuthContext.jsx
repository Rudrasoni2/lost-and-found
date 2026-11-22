import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Assume there is an endpoint like GET /api/auth/me to fetch user details
          const response = await api.getMe();
          setUser(response);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const accessToken = res.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(res.user);
  };

  const register = async (name, email, password) => {
    await api.register({ name, email, password });
    // Auto-login after successful registration
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
