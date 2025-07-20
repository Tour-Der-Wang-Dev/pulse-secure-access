import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, PieChart, Calendar, Download, Filter } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const Analytics = () => {
  const { employee } = useAuth();
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Check if user has analytics access
  if (employee?.role === 'cashier') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Analytics are available for managers and administrators only.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all transactions for analytics
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['/api/audit-logs'],
    enabled: employee?.role === 'admin' || employee?.role === 'manager',
  });

  // Fetch fuel types for analysis
  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['/api/fuel-types'],
  });

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: subDays(now, 90), end: now };
      default:
        return { start: startOfWeek(now), end: endOfWeek(now) };
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'primary' }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            {' '}from last period
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business intelligence and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$12,453.78"
          change={15.2}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Total Transactions"
          value="847"
          change={8.1}
          icon={BarChart3}
          color="blue"
        />
        <MetricCard
          title="Avg Transaction Value"
          value="$24.73"
          change={-2.4}
          icon={PieChart}
          color="purple"
        />
        <MetricCard
          title="Fuel Volume (Liters)"
          value="8,234"
          change={12.7}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>Chart visualization would be here</p>
                <p className="text-sm">Integration with chart library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Fuel Type Sales
            </CardTitle>
            <CardDescription>Sales distribution by fuel type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fuelTypes.slice(0, 5).map((fuel: any, index: number) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                const percentage = Math.floor(Math.random() * 30) + 10; // Mock data
                return (
                  <div key={fuel.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{fuel.name}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Analysis</CardTitle>
            <CardDescription>Popular payment preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { method: 'Credit/Debit Card', percentage: 65, amount: '$8,094.96' },
                { method: 'Cash', percentage: 28, amount: '$3,487.06' },
                { method: 'QR Code Payment', percentage: 7, amount: '$871.76' },
              ].map((payment) => (
                <div key={payment.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{payment.method}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{payment.amount}</div>
                      <div className="text-xs text-muted-foreground">{payment.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${payment.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Analysis</CardTitle>
            <CardDescription>Busiest times of the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { hour: '7:00 - 9:00 AM', transactions: 124, percentage: 85 },
                { hour: '12:00 - 2:00 PM', transactions: 98, percentage: 67 },
                { hour: '5:00 - 7:00 PM', transactions: 145, percentage: 100 },
                { hour: '8:00 - 10:00 PM', transactions: 67, percentage: 46 },
              ].map((peak) => (
                <div key={peak.hour} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">{peak.hour}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{peak.transactions} transactions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${peak.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Business Insights
          </CardTitle>
          <CardDescription>AI-powered recommendations and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <Badge variant="outline" className="text-green-700 border-green-300">Opportunity</Badge>
              </div>
              <h4 className="font-semibold text-green-800 mb-2">Premium Fuel Growth</h4>
              <p className="text-sm text-green-700">
                Premium gasoline sales increased 23% this month. Consider promotional campaigns to maximize revenue.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <Badge variant="outline" className="text-amber-700 border-amber-300">Peak Time</Badge>
              </div>
              <h4 className="font-semibold text-amber-800 mb-2">Evening Rush Optimization</h4>
              <p className="text-sm text-amber-700">
                5-7 PM shows highest traffic. Consider additional staffing during peak hours for better service.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                <Badge variant="outline" className="text-blue-700 border-blue-300">Trend</Badge>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Digital Payments Rising</h4>
              <p className="text-sm text-blue-700">
                QR code payments up 45% this quarter. Consider expanding digital payment options.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;