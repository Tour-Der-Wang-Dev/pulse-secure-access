import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  pin: string;
  full_name: string;
  role: 'cashier' | 'admin' | 'manager';
  is_active: boolean;
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
      // Query employees table directly
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('pin', pin)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        // Log audit event for failed login
        await supabase.from('audit_logs').insert({
          action: 'login',
          details: { success: false, pin_attempted: pin },
          ip_address: null,
          user_agent: navigator.userAgent
        });

        return { success: false, error: 'Invalid PIN or inactive employee' };
      }

      // Set employee context
      setEmployee(data);
      
      // Store employee session
      localStorage.setItem('gas_station_employee', JSON.stringify(data));

      // Log successful login
      await supabase.from('audit_logs').insert({
        employee_id: data.id,
        action: 'login',
        details: { success: true, employee_name: data.full_name },
        ip_address: null,
        user_agent: navigator.userAgent
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    if (employee) {
      // Log logout
      await supabase.from('audit_logs').insert({
        employee_id: employee.id,
        action: 'logout',
        details: { employee_name: employee.full_name },
        ip_address: null,
        user_agent: navigator.userAgent
      });
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