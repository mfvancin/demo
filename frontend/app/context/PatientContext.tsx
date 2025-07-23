import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Patient } from '../types';
import * as patientService from '@services/patientService';
import { useAuth } from './AuthContext';

interface PatientContextData {
  patients: Record<string, Patient>;
  loading: boolean;
  fetchPatients: () => Promise<void>;
  assignPatient: (patientId: string) => Promise<void>;
  updatePatient: (patient: Patient) => void;
}

export const PatientContext = createContext<PatientContextData>({
  patients: {},
  loading: true,
  fetchPatients: async () => {},
  assignPatient: async () => {},
  updatePatient: () => {},
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

  const assignPatient = async (patientId: string) => {
    try {
      await patientService.assignPatientToDoctor(patientId);
      await fetchPatients(); // Refresh the list after assigning
    } catch (error) {
      console.error("Failed to assign patient:", error);
      throw error;
    }
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prevPatients => ({
      ...prevPatients,
      [updatedPatient.id]: updatedPatient,
    }));
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