import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fuel, Shield, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN (minimum 4 characters)');
      setLoading(false);
      return;
    }

    const result = await login(pin);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Fuel className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Gas Station POS</h1>
          <p className="text-muted-foreground mt-2">Secure Employee Access</p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Employee Login
            </CardTitle>
            <CardDescription>
              Enter your PIN or scan your RFID to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Employee PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={10}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>

            {/* Demo credentials info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Admin: PIN <span className="font-mono">1234</span></div>
                <div>Manager: PIN <span className="font-mono">5678</span></div>
                <div>Cashier: PIN <span className="font-mono">9999</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>All activities are logged for security purposes</p>
        </div>
      </div>
    </div>
  );
};

export default Login;