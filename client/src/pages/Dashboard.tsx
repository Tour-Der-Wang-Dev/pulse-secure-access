import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Fuel, Users, AlertTriangle, Clock } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const Dashboard = () => {
  const { employee } = useAuth();

  // Fetch employee transactions for the last 7 days
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/employees/${employee?.id}/transactions`],
    enabled: !!employee?.id,
  });

  // Fetch alerts for admin/manager roles
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts', 'active'],
    enabled: employee?.role === 'admin' || employee?.role === 'manager',
  });

  // Calculate daily statistics
  const today = new Date();
  const todayTransactions = transactions.filter((t: any) => 
    new Date(t.createdAt) >= startOfDay(today) && 
    new Date(t.createdAt) <= endOfDay(today)
  );
  
  const todayRevenue = todayTransactions.reduce((sum: number, t: any) => 
    sum + parseFloat(t.totalAmount || '0'), 0
  );

  const weekTransactions = transactions.filter((t: any) => 
    new Date(t.createdAt) >= subDays(today, 7)
  );

  const avgTransactionValue = transactions.length > 0 
    ? transactions.reduce((sum: number, t: any) => sum + parseFloat(t.totalAmount || '0'), 0) / transactions.length 
    : 0;

  const StatCard = ({ title, value, icon: Icon, trend, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {' '}{description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant={employee?.role === 'admin' ? 'default' : 'secondary'}>
          {employee?.role?.toUpperCase()}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={`$${todayRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={12}
          description="vs yesterday"
        />
        <StatCard
          title="Today's Transactions"
          value={todayTransactions.length}
          icon={TrendingUp}
          trend={8}
          description="vs yesterday"
        />
        <StatCard
          title="Average Transaction"
          value={`$${avgTransactionValue.toFixed(2)}`}
          icon={Fuel}
          trend={-2}
          description="vs last week"
        />
        <StatCard
          title="Active Alerts"
          value={alerts.length}
          icon={AlertTriangle}
          description="Requires attention"
        />
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest fuel sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">
                      Receipt #{transaction.receiptNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.fuelAmount}L • {transaction.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${transaction.totalAmount}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.createdAt), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No transactions yet today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts - Admin/Manager Only */}
        {(employee?.role === 'admin' || employee?.role === 'manager') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>System notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No active alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Info for Cashiers */}
        {employee?.role === 'cashier' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Performance
              </CardTitle>
              <CardDescription>This week's summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="font-semibold">
                    ${weekTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.totalAmount || '0'), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{weekTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Sale</span>
                  <span className="font-semibold">${avgTransactionValue.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="outline" className="w-full justify-center">
                    {weekTransactions.length >= 50 ? 'Excellent' : 
                     weekTransactions.length >= 25 ? 'Good' : 'Getting Started'} Performance
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;