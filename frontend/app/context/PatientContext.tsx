import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Patient, PatientDetails } from '../types';
import { mockPatients } from '@data/mockPatients';

interface PatientContextData {
  patients: Record<string, Patient>;
  createPatient: (name: string, specificId?: string) => Patient;
}

const defaultPatientDetails: PatientDetails = {
  age: 0,
  sex: 'Other',
  height: 0,
  weight: 0,
  bmi: 0,
  clinicalInfo: '',
};

const PatientContext = createContext<PatientContextData>({} as PatientContextData);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with mock data and ensure all required fields are present
  const initialPatients = Object.entries(mockPatients).reduce((acc, [id, patient]) => {
    acc[id] = {
      ...patient,
      details: patient.details || { ...defaultPatientDetails },
      recovery_process: patient.recovery_process || [],
      medications: patient.medications || [],
      weekly_logs: patient.weekly_logs || [],
      movementData: patient.movementData || [],
      feedback: patient.feedback || [],
      healthData: patient.healthData || [],
    };
    return acc;
  }, {} as Record<string, Patient>);

  const [patients, setPatients] = useState<Record<string, Patient>>(initialPatients);

  const createPatient = (name: string, specificId?: string): Patient => {
    const newId = specificId || `patient_${Date.now()}`;
    const newPatient: Patient = {
      id: newId,
      name: name,
      details: { ...defaultPatientDetails },
      recovery_process: [],
      medications: [],
      weekly_logs: [],
      movementData: [],
      feedback: [],
      healthData: [],
      doctor: { id: 'doc1', name: 'Dr. Smith' }, // Default doctor assignment
    };

    setPatients(prevPatients => ({
      ...prevPatients,
      [newId]: newPatient,
    }));
    
    return newPatient;
  };

  return (
    <PatientContext.Provider value={{ patients, createPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
} 