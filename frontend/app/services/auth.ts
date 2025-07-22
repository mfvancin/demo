import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User } from '../types';

// Add token to all requests
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string, role: 'patient' | 'doctor'): Promise<{ token: string; user: User }> => {
  try {
    const response = await api.post('/login', { email, password, role });
    const { token, user } = response.data;
    
    // Store the token
    await AsyncStorage.setItem('@auth_token', token);
    
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signup = async (
  name: string,
  email: string,
  password: string,
  role: 'patient' | 'doctor'
): Promise<{ token: string; user: User }> => {
  try {
    const response = await api.post('/signup', { name, email, password, role });
    const { token, user } = response.data;
    
    // Store the token
    await AsyncStorage.setItem('@auth_token', token);
    
    return { token, user };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}; 