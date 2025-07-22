import React, { useEffect } from 'react';
import AppNavigator from './app/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './app/theme/ThemeContext';
import { AuthProvider } from './app/context/AuthContext';
import { PatientProvider, usePatients } from './app/context/PatientContext';
import { HealthProvider } from './app/context/HealthContext';
import { HealthGoalsProvider } from './app/context/HealthGoalsContext';
import healthService from './app/services/healthService';

export default function App() {
  useEffect(() => {
    return () => {
      healthService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PatientProvider>
          <AuthProviderWrapper />
        </PatientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const AuthProviderWrapper = () => {
  const { createPatient } = usePatients();
  
  return (
    <AuthProvider onPatientSignup={(name, userId) => createPatient(name, userId)}>
      <HealthGoalsProvider>
        <HealthProvider>
          <AppNavigator />
        </HealthProvider>
      </HealthGoalsProvider>
    </AuthProvider>
  );
}; 