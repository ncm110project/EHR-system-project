"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, mockUsers, Patient } from '@/lib/ehr-data';

interface AuthContextType {
  user: User | Patient | null;
  isAuthenticated: boolean;
  isPatient: boolean;
  login: (username: string, password: string) => boolean;
  loginAsPatient: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

const rolePermissions: Record<string, string[]> = {
  doctor: ['view_patients', 'edit_patients', 'prescribe', 'order_lab', 'order_imaging', 'view_own_department'],
  nurse: ['view_patients', 'edit_patients', 'record_vitals', 'view_own_department'],
  admin: ['view_all', 'edit_all', 'manage_staff', 'view_reports', 'manage_incidents'],
  patient: ['view_own_records', 'book_appointment', 'view_prescriptions', 'view_lab_results', 'view_imaging_results'],
  'radiologic-technologist': ['view_patients', 'process_imaging', 'view_own_department'],
  'charge-nurse': ['view_patients', 'edit_patients', 'manage_ward', 'assign_nurse', 'view_reports'],
  'staff-nurse': ['view_patients', 'record_vitals', 'view_own_department']
};

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
      const permissions = rolePermissions[foundUser.role] || [];
      setUser({ ...foundUser, permissions });
      return true;
    }

    if (patientList) {
      const patientWithAccount = patientList.find(
        p => p.hasPatientAccount && p.username === username && p.password === password
      );
      
      if (patientWithAccount) {
        const permissions = rolePermissions['patient'] || [];
        setUser({ ...patientWithAccount, permissions } as unknown as User);
        return true;
      }
    }
    
    return false;
  }, [patientList]);

  const loginAsPatient = useCallback((username: string, password: string): boolean => {
    const pendingPatients = JSON.parse(localStorage.getItem('pendingPatients') || '[]');
    const allPatients = [...(patientList || []), ...pendingPatients];
    
    const patientWithAccount = allPatients.find(
      p => p.hasPatientAccount && p.username === username && p.password === password
    );
    
    if (patientWithAccount) {
      const permissions = rolePermissions['patient'] || [];
      setUser({ ...patientWithAccount, role: 'patient', permissions } as unknown as User);
      return true;
    }
    
    return false;
  }, [patientList]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const changePassword = useCallback((currentPassword: string, newPassword: string): boolean => {
    if (!user || !('username' in user)) return false;
    
    if (user.password !== currentPassword) return false;

    if ('role' in user) {
      const updatedUser = { ...user, password: newPassword };
      setUser(updatedUser);
      
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], password: newPassword };
      }
      return true;
    }
    
    return false;
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if ('permissions' in user && user.permissions) {
      return user.permissions.includes(permission);
    }
    if ('role' in user && user.role) {
      return rolePermissions[user.role]?.includes(permission) || false;
    }
    return false;
  }, [user]);

  const isPatient = !!(user && ('role' in user ? user.role === 'patient' : 'hasPatientAccount' in user && (user as any).hasPatientAccount === true));

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isPatient,
      login,
      loginAsPatient,
      logout,
      changePassword,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}
