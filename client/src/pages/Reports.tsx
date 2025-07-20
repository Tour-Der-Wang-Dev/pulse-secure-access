import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const { employee } = useAuth();
  const [reportType, setReportType] = useState('transactions');
  const [dateRange, setDateRange] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Check access permissions
  if (employee?.role === 'cashier') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Detailed reports are available for managers and administrators only.
          </p>
        </div>
      </div>
    );
  }

  // Fetch audit logs for reports
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['/api/audit-logs'],
    enabled: employee?.role === 'admin' || employee?.role === 'manager',
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    enabled: employee?.role === 'admin' || employee?.role === 'manager',
  });

  const ReportCard = ({ title, description, type, count, lastUpdated }: any) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </span>
          <Badge variant="outline">{count} records</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AuditLogRow = ({ log }: { log: any }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          log.action === 'login' ? 'bg-green-500' : 
          log.action === 'logout' ? 'bg-gray-500' : 
          log.action === 'payment_processed' ? 'bg-blue-500' : 
          'bg-amber-500'
        }`} />
        <div>
          <div className="font-medium capitalize">
            {log.action.replace('_', ' ')}
          </div>
          <div className="text-sm text-muted-foreground">
            {log.details?.employee_name || 'System'}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">
          {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
        </div>
        <div className="text-xs text-muted-foreground">
          {log.userAgent ? 'Web' : 'System'}
        </div>
      </div>
    </div>
  );

  if (auditLoading || alertsLoading) {
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
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Comprehensive business and security reports</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Bulk Export
        </Button>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="audit">Audit Logs</SelectItem>
                  <SelectItem value="alerts">Security Alerts</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search reports..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Transaction Summary"
          description="Daily, weekly, and monthly transaction reports"
          type="transactions"
          count="1,247"
          lastUpdated="2 hours ago"
        />
        <ReportCard
          title="Revenue Analysis"
          description="Detailed revenue breakdowns and trends"
          type="revenue"
          count="365"
          lastUpdated="1 hour ago"
        />
        <ReportCard
          title="Employee Performance"
          description="Individual and team performance metrics"
          type="performance"
          count="12"
          lastUpdated="6 hours ago"
        />
        <ReportCard
          title="Fuel Inventory"
          description="Stock levels and consumption patterns"
          type="inventory"
          count="156"
          lastUpdated="30 minutes ago"
        />
        <ReportCard
          title="Security Audit"
          description="Authentication logs and security events"
          type="security"
          count={auditLogs.length.toString()}
          lastUpdated="Live"
        />
        <ReportCard
          title="System Alerts"
          description="Active and resolved system notifications"
          type="alerts"
          count={alerts.length.toString()}
          lastUpdated="Live"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Audit Log Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Audit Logs
              </span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
            <CardDescription>Latest security and activity events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.slice(0, 10).map((log: any) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
              {auditLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No audit logs available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </span>
              <Badge variant="destructive">{alerts.filter((a: any) => a.status === 'active').length}</Badge>
            </CardTitle>
            <CardDescription>System notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.filter((alert: any) => alert.status === 'active').slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              {alerts.filter((a: any) => a.status === 'active').length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No active alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Scheduling</CardTitle>
          <CardDescription>Download reports or schedule automated delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <Download className="h-6 w-6 mb-2" />
              <span>CSV Export</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>PDF Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span>Schedule Delivery</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;