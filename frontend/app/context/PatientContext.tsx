import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Patient, PatientFeedback } from '../types';
import * as patientService from '@services/patientService';
import { useAuth } from './AuthContext';

interface PatientContextData {
  patients: Record<string, Patient>;
  loading: boolean;
  fetchPatients: () => Promise<void>;
  assignPatient: (patientId: string) => Promise<void>;
  updatePatient: (patientId: string, updates: Partial<Patient>) => Promise<void>;
}

export const PatientContext = createContext<PatientContextData>({
  patients: {},
  loading: true,
  fetchPatients: async () => {},
  assignPatient: async () => {},
  updatePatient: async () => {},
});

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let fetchedPatients: Patient[] = [];
      if (user.role === 'doctor') {
        fetchedPatients = await patientService.getPatientsForDoctor(user.id);
      } else {
        // Patients might see their own data, adjust if needed
        const patientData = await patientService.getPatientById(user.id);
        if (patientData) {
          fetchedPatients = [patientData];
        }
      }
      const patientsById = fetchedPatients.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, Patient>);
      setPatients(patientsById);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user, fetchPatients]);

  const assignPatient = async (patientId: string) => {
    try {
      await patientService.assignPatientToDoctor(patientId);
      await fetchPatients(); // Refresh the list after assigning
    } catch (error) {
      console.error("Failed to assign patient:", error);
      throw error;
    }
  };

  const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
    try {
      if (updates.feedback) {
        await patientService.updatePatientFeedback(patientId, updates.feedback);
      }

      setPatients(prevPatients => {
        const updatedPatient = {
          ...prevPatients[patientId],
          ...updates,
        };
        return {
          ...prevPatients,
          [patientId]: updatedPatient,
        };
      });
    } catch (error) {
      console.error("Failed to update patient:", error);
      throw error;
    }
  };

  return (
    <PatientContext.Provider value={{ patients, loading, fetchPatients, assignPatient, updatePatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export function usePatients() {
  return useContext(PatientContext);
} 