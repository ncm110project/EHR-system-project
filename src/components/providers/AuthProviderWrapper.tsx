"use client";

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { useEHR } from '@/lib/ehr-context';

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const { patients } = useEHR();
  
  return (
    <AuthProvider patientList={patients}>
      {children}
    </AuthProvider>
  );
}