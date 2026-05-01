import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kabootar_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (idToken, name = null) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify', { idToken, name });
      localStorage.setItem('kabootar_token', data.token);
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
      connectSocket(data.user._id);
      return { success: true, user: data.user, requiresProfileCompletion: data.requiresProfileCompletion };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const isNewUser = err.response?.data?.newUser;
      return { success: false, message: msg, newUser: isNewUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut().catch(() => {});
    localStorage.removeItem('kabootar_token');
    localStorage.removeItem('kabootar_user');
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch {}
  };

  // Connect socket on mount if user exists
  useEffect(() => {
    if (user?._id) connectSocket(user._id);
  }, [user?._id]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
