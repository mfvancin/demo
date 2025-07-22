import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '@services/auth';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login(email: string, password: string, role: 'patient' | 'doctor'): Promise<void>;
  signup(name: string, email: string, password: string, role: 'patient' | 'doctor'): Promise<void>;
  logout(): void;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onPatientSignup?: (name: string, userId: string) => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onPatientSignup }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('@iRHIS:user');
            const storedToken = await AsyncStorage.getItem('@iRHIS:token');
            
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error loading storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string, role: 'patient' | 'doctor') => {
        try {
            const response = await authService.login(email, password, role);
            setUser(response.user);
            await AsyncStorage.setItem('@iRHIS:user', JSON.stringify(response.user));
            await AsyncStorage.setItem('@iRHIS:token', response.token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (name: string, email: string, password: string, role: 'patient' | 'doctor') => {
        try {
            const response = await authService.signup(name, email, password, role);
            
            // If this is a new patient user, create their patient record
            if (role === 'patient' && response.user && onPatientSignup) {
                onPatientSignup(name, response.user.id);
            }
            
            setUser(response.user);
            await AsyncStorage.setItem('@iRHIS:user', JSON.stringify(response.user));
            await AsyncStorage.setItem('@iRHIS:token', response.token);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('@iRHIS:user');
            await AsyncStorage.removeItem('@iRHIS:token');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
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