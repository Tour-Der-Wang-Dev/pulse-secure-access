import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface Employee {
  id: string;
  pin: string;
  fullName: string;
  role: 'cashier' | 'admin' | 'manager';
  isActive: boolean;
}

interface AuthContextType {
  employee: Employee | null;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });

      if (response.success && response.employee) {
        // Set employee context
        setEmployee(response.employee);
        
        // Store employee session
        localStorage.setItem('gas_station_employee', JSON.stringify(response.employee));

        return { success: true };
      }

      return { success: false, error: response.error || 'Invalid PIN or inactive employee' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    if (employee) {
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ 
            employeeId: employee.id, 
            employeeName: employee.fullName 
          }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setEmployee(null);
    localStorage.removeItem('gas_station_employee');
  };

  useEffect(() => {
    // Check for existing session on mount
    const stored = localStorage.getItem('gas_station_employee');
    if (stored) {
      try {
        const employeeData = JSON.parse(stored);
        setEmployee(employeeData);
      } catch (error) {
        console.error('Error parsing stored employee data:', error);
        localStorage.removeItem('gas_station_employee');
      }
    }
    setLoading(false);
  }, []);

  const value = {
    employee,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};