import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Fuel, CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FuelType {
  id: string;
  name: string;
  type: string;
  price_per_liter: number;
  is_available: boolean;
}

const PaymentForm = () => {
  const { employee } = useAuth();
  const { toast } = useToast();
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [formData, setFormData] = useState({
    fuel_type_id: '',
    fuel_amount: '',
    payment_method: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    loadFuelTypes();
  }, []);

  const loadFuelTypes = async () => {
    const { data, error } = await supabase
      .from('fuel_types')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) {
      console.error('Error loading fuel types:', error);
      toast({
        title: "Error",
        description: "Failed to load fuel types",
        variant: "destructive"
      });
    } else {
      setFuelTypes(data || []);
    }
  };

  const selectedFuelType = fuelTypes.find(ft => ft.id === formData.fuel_type_id);
  const totalAmount = selectedFuelType && formData.fuel_amount 
    ? (parseFloat(formData.fuel_amount) * selectedFuelType.price_per_liter).toFixed(2)
    : '0.00';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `GS${timestamp}${random}`;
  };

  const processPayment = async () => {
    if (!employee || !selectedFuelType) return;

    setProcessing(true);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock payment gateway response
      const paymentSuccess = Math.random() > 0.1; // 90% success rate
      
      if (!paymentSuccess) {
        throw new Error('Payment gateway error');
      }

      const receiptNumber = generateReceiptNumber();
      
      // Create transaction record
      const { data, error } = await supabase
        .from('gas_transactions')
        .insert({
          employee_id: employee.id,
          fuel_type_id: formData.fuel_type_id,
          fuel_amount: parseFloat(formData.fuel_amount),
          fuel_price_per_liter: selectedFuelType.price_per_liter,
          total_amount: parseFloat(totalAmount),
          payment_method: formData.payment_method as 'cash' | 'card' | 'qr_code',
          status: 'completed',
          receipt_number: receiptNumber,
          notes: formData.notes || null,
          stripe_payment_intent_id: formData.payment_method !== 'cash' ? `pi_mock_${Date.now()}` : null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.from('audit_logs').insert({
        employee_id: employee.id,
        action: 'payment_processed',
        details: {
          transaction_id: data.id,
          fuel_type: selectedFuelType.name,
          amount: totalAmount,
          payment_method: formData.payment_method,
          receipt_number: receiptNumber
        }
      });

      setLastTransaction(data);
      
      // Reset form
      setFormData({
        fuel_type_id: '',
        fuel_amount: '',
        payment_method: '',
        notes: ''
      });

      toast({
        title: "Payment Successful",
        description: `Transaction completed. Receipt: ${receiptNumber}`,
      });

    } catch (error) {
      console.error('Payment error:', error);
      
      // Log failed payment
      await supabase.from('audit_logs').insert({
        employee_id: employee?.id,
        action: 'payment_processed',
        details: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          fuel_type: selectedFuelType?.name,
          amount: totalAmount,
          payment_method: formData.payment_method
        }
      });

      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.fuel_type_id || !formData.fuel_amount || !formData.payment_method) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (parseFloat(formData.fuel_amount) <= 0 || parseFloat(formData.fuel_amount) > 500) {
      toast({
        title: "Invalid Amount",
        description: "Fuel amount must be between 0 and 500 liters",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    await processPayment();
    setLoading(false);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'qr_code', label: 'QR Code Payment', icon: QrCode }
  ];

  if (lastTransaction) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-success bg-success/5">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success-foreground" />
            </div>
            <CardTitle className="text-success">Payment Successful!</CardTitle>
            <CardDescription>Transaction has been completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number:</span>
                <span className="font-mono font-semibold">{lastTransaction.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Amount:</span>
                <span>{lastTransaction.fuel_amount} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">${lastTransaction.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="capitalize">{lastTransaction.payment_method.replace('_', ' ')}</span>
              </div>
            </div>
            
            <Button 
              onClick={() => setLastTransaction(null)} 
              className="w-full"
            >
              Process New Transaction
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-primary" />
            Fuel Payment Processing
          </CardTitle>
          <CardDescription>
            Process customer fuel purchases securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fuel Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="fuel-type">Fuel Type *</Label>
              <Select 
                value={formData.fuel_type_id} 
                onValueChange={(value) => handleInputChange('fuel_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel) => (
                    <SelectItem key={fuel.id} value={fuel.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{fuel.name}</span>
                        <Badge variant="outline" className="ml-2">
                          ${fuel.price_per_liter}/L
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuel Amount */}
            <div className="space-y-2">
              <Label htmlFor="fuel-amount">Fuel Amount (Liters) *</Label>
              <Input
                id="fuel-amount"
                type="number"
                step="0.01"
                min="0"
                max="500"
                placeholder="0.00"
                value={formData.fuel_amount}
                onChange={(e) => handleInputChange('fuel_amount', e.target.value)}
              />
            </div>

            {/* Total Amount Display */}
            {selectedFuelType && formData.fuel_amount && (
              <Alert>
                <AlertDescription className="text-lg font-semibold">
                  Total Amount: ${totalAmount}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formData.fuel_amount}L × ${selectedFuelType.price_per_liter}/L)
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {paymentMethods.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={formData.payment_method === value ? 'default' : 'outline'}
                    onClick={() => handleInputChange('payment_method', value)}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional transaction notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold"
              disabled={loading || processing}
            >
              {processing ? 'Processing Payment...' : loading ? 'Validating...' : 'Process Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;