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
  const [patients, setPatients] = useState<Record<string, Patient>>(mockPatients);

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
      healthData: []
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
  return useContext(PatientContext);
} 