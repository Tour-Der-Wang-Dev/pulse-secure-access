import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import PaymentForm from '@/components/PaymentForm';

const Index = () => {
  const { employee, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'payment' | 'admin' | 'audit'>('payment');

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
      case 'payment':
        return <PaymentForm />;
      case 'admin':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'audit':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <PaymentForm />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
