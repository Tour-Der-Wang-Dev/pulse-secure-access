import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Shield, Fuel, BarChart3, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'payment' | 'admin' | 'audit';
  onPageChange: (page: 'dashboard' | 'payment' | 'admin' | 'audit') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { employee, logout } = useAuth();

  if (!employee) return null;

  const isAdmin = employee.role === 'admin' || employee.role === 'manager';

  const navItems = [
    { key: 'payment', label: 'Payment', icon: Fuel, show: true },
    { key: 'admin', label: 'Admin Dashboard', icon: BarChart3, show: isAdmin },
    { key: 'audit', label: 'Audit Logs', icon: History, show: isAdmin }
  ] as const;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-danger text-danger-foreground';
      case 'manager': return 'bg-warning text-warning-foreground';
      case 'cashier': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Fuel className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Gas Station POS</h1>
                <p className="text-sm text-muted-foreground">Payment & Management System</p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(({ key, label, icon: Icon, show }) => 
                show && (
                  <Button
                    key={key}
                    variant={currentPage === key ? 'default' : 'ghost'}
                    onClick={() => onPageChange(key)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                )
              )}
            </nav>

            {/* User Info and Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{employee.full_name}</p>
                  <Badge className={`text-xs ${getRoleBadgeColor(employee.role)}`}>
                    {employee.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <nav className="flex gap-1 overflow-x-auto">
              {navItems.map(({ key, label, icon: Icon, show }) => 
                show && (
                  <Button
                    key={key}
                    variant={currentPage === key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(key)}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Security Footer */}
      <footer className="bg-muted/30 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              All transactions are monitored and logged
            </div>
            <div>
              Session: {employee.full_name} ({employee.role})
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;