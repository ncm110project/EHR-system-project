"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, mockUsers, Patient } from '@/lib/ehr-data';

interface AuthContextType {
  user: User | Patient | null;
  isAuthenticated: boolean;
  isPatient: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  patientList?: Patient[];
}

export function AuthProvider({ children, patientList }: AuthProviderProps) {
  const [user, setUser] = useState<User | Patient | null>(null);

  const login = useCallback((username: string, password: string): boolean => {
    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      setUser(foundUser);
      return true;
    }

    if (patientList) {
      const patientWithAccount = patientList.find(
        p => p.hasPatientAccount && p.username === username && p.password === password
      );
      
      if (patientWithAccount) {
        setUser(patientWithAccount as unknown as User);
        return true;
      }
    }
    
    return false;
  }, [patientList]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isPatient = !!(user && ('role' in user ? user.role === 'patient' : 'hasPatientAccount' in user && (user as any).hasPatientAccount === true));

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isPatient,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
