import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import PaymentForm from '@/components/PaymentForm';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import Reports from './Reports';

const Index = () => {
  const { employee, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'payment' | 'analytics' | 'reports' | 'admin' | 'audit'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'payment':
        return <PaymentForm />;
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <Reports />;
      case 'admin':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'audit':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Live Audit Monitor</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
