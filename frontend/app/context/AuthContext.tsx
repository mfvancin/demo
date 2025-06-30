import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api from '../services/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  signup(name: string, email: string, password: string, role: 'patient' | 'doctor'): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      const storedUser = await AsyncStorage.getItem('@iRHIS:user');
      const storedToken = await AsyncStorage.getItem('@iRHIS:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    const { token, user: apiUser } = response.data;

    setUser(apiUser);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await AsyncStorage.setItem('@iRHIS:user', JSON.stringify(apiUser));
    await AsyncStorage.setItem('@iRHIS:token', token);
  };

  const signup = async (name: string, email: string, password: string, role: 'patient' | 'doctor') => {
    const response = await api.post('/signup', { name, email, password, role });
    const { token, user: apiUser } = response.data;

    setUser(apiUser);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await AsyncStorage.setItem('@iRHIS:user', JSON.stringify(apiUser));
    await AsyncStorage.setItem('@iRHIS:token', token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@iRHIS:user');
    await AsyncStorage.removeItem('@iRHIS:token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
} 