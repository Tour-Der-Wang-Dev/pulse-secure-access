import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Fuel, CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface FuelType {
  id: string;
  name: string;
  type: string;
  pricePerLiter: string;
  isAvailable: boolean;
}

const PaymentForm = () => {
  const { employee } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fuelTypeId: '',
    fuelAmount: '',
    paymentMethod: '',
    notes: ''
  });
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Fetch fuel types using React Query
  const { data: fuelTypes = [], isLoading: fuelTypesLoading, error: fuelTypesError } = useQuery({
    queryKey: ['/api/fuel-types'],
    enabled: true,
  });

  // Transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (transactionData: any) => 
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      }),
    onSuccess: (data) => {
      setLastTransaction(data);
      setFormData({
        fuelTypeId: '',
        fuelAmount: '',
        paymentMethod: '',
        notes: ''
      });
      
      toast({
        title: "Payment Successful",
        description: `Transaction completed. Receipt: ${data.receiptNumber}`,
      });
    },
    onError: (error: any) => {
      console.error('Transaction error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  if (fuelTypesError) {
    toast({
      title: "Error",
      description: "Failed to load fuel types",
      variant: "destructive"
    });
  }

  const selectedFuelType = fuelTypes.find((ft: FuelType) => ft.id === formData.fuelTypeId);
  const totalAmount = selectedFuelType && formData.fuelAmount 
    ? (parseFloat(formData.fuelAmount) * parseFloat(selectedFuelType.pricePerLiter)).toFixed(2)
    : '0.00';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fuelTypeId || !formData.fuelAmount || !formData.paymentMethod) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(formData.fuelAmount) <= 0 || parseFloat(formData.fuelAmount) > 500) {
      toast({
        title: "Invalid Amount",
        description: "Fuel amount must be between 0 and 500 liters",
        variant: "destructive"
      });
      return;
    }

    if (!employee || !selectedFuelType) return;

    // Mock payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock payment gateway response
    const paymentSuccess = Math.random() > 0.1; // 90% success rate
    if (!paymentSuccess) {
      toast({
        title: "Payment Failed",
        description: "Payment gateway error. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const transactionData = {
      employeeId: employee.id,
      fuelTypeId: formData.fuelTypeId,
      fuelAmount: parseFloat(formData.fuelAmount),
      fuelPricePerLiter: parseFloat(selectedFuelType.pricePerLiter),
      totalAmount: parseFloat(totalAmount),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || null,
    };

    createTransactionMutation.mutate(transactionData);
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
                <span className="font-mono font-semibold">{lastTransaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Amount:</span>
                <span>{lastTransaction.fuelAmount} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">${lastTransaction.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="capitalize">{lastTransaction.paymentMethod.replace('_', ' ')}</span>
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
                value={formData.fuelTypeId} 
                onValueChange={(value) => handleInputChange('fuelTypeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel: FuelType) => (
                    <SelectItem key={fuel.id} value={fuel.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{fuel.name}</span>
                        <Badge variant="outline" className="ml-2">
                          ${fuel.pricePerLiter}/L
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
                value={formData.fuelAmount}
                onChange={(e) => handleInputChange('fuelAmount', e.target.value)}
              />
            </div>

            {/* Total Amount Display */}
            {selectedFuelType && formData.fuelAmount && (
              <Alert>
                <AlertDescription className="text-lg font-semibold">
                  Total Amount: ${totalAmount}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formData.fuelAmount}L × ${selectedFuelType.pricePerLiter}/L)
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
                    variant={formData.paymentMethod === value ? 'default' : 'outline'}
                    onClick={() => handleInputChange('paymentMethod', value)}
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
              disabled={createTransactionMutation.isPending || fuelTypesLoading}
            >
              {createTransactionMutation.isPending ? 'Processing Payment...' : fuelTypesLoading ? 'Loading...' : 'Process Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;