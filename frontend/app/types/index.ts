export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
}

export interface RecoveryProcess {
  id: string;
  name: string;
  completed: boolean;
}

export interface WeeklyLog {
  week: number;
  pain: number;
  discomfort: number;
  tiredness: number;
  strength: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  completed: boolean;
}

export interface Patient {
  id: string;
  name: string;
  recovery_process: RecoveryProcess[];
  doctor?: {
    id: string;
    name: string;
  };
  medications?: Medication[];
  weekly_logs?: WeeklyLog[];
} 