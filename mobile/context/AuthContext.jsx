import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import auth from '@react-native-firebase/auth';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await SecureStore.getItemAsync('kabootar_user');
        if (stored) {
          const u = JSON.parse(stored);
          setUser(u);
          connectSocket(u._id);
        }
      } catch {}
      finally { setLoading(false); }
    };
    restore();
  }, []);

  const login = async (idToken, name = null) => {
    try {
      const { data } = await api.post('/auth/verify', { idToken, name });
      await SecureStore.setItemAsync('kabootar_token', data.token);
      await SecureStore.setItemAsync('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
      connectSocket(data.user._id);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const isNewUser = err.response?.data?.newUser;
      return { success: false, message: msg, newUser: isNewUser };
    }
  };

  const logout = async () => {
    await auth().signOut().catch(() => {});
    await SecureStore.deleteItemAsync('kabootar_token');
    await SecureStore.deleteItemAsync('kabootar_user');
    disconnectSocket();
    setUser(null);
  };

  const persistUser = async (updated) => {
    await SecureStore.setItemAsync('kabootar_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser: persistUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
