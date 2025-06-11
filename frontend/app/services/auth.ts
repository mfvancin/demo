import api from './api';
import { User } from '../types';

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const signup = async (name: string, email: string, password: string, role: 'patient' | 'doctor'): Promise<{ token: string; user: User }> => {
  const response = await api.post('/signup', { name, email, password, role });
  return response.data;
}; 