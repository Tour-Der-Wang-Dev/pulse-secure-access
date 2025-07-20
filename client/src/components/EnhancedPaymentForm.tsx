import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { Fuel, CheckCircle, ArrowLeft, Receipt, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PaymentMethodSelector, { PaymentMethod } from './payments/PaymentMethodSelector';
import ThaiQRPayment from './payments/ThaiQRPayment';

interface FuelType {
  id: string;
  name: string;
  type: string;
  pricePerLiter: string;
  isAvailable: boolean;
}

type PaymentStep = 'selection' | 'method' | 'processing' | 'success';

const EnhancedPaymentForm = () => {
  const { employee } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState<PaymentStep>('selection');
  const [formData, setFormData] = useState({
    fuelTypeId: '',
    fuelAmount: '',
    paymentMethod: '' as PaymentMethod,
    notes: ''
  });
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Fetch fuel types
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
      setCurrentStep('success');
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employee?.id}/transactions`] });
      
      toast({
        title: t('paymentSuccessful'),
        description: `${t('receiptNumber')}: ${data.receiptNumber}`,
      });
    },
    onError: (error: any) => {
      console.error('Transaction failed:', error);
      toast({
        title: t('paymentFailed'),
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Calculate total when fuel type or amount changes
  React.useEffect(() => {
    if (formData.fuelTypeId && formData.fuelAmount) {
      const selectedFuel = fuelTypes.find((f: FuelType) => f.id === formData.fuelTypeId);
      if (selectedFuel) {
        const amount = parseFloat(formData.fuelAmount);
        const price = parseFloat(selectedFuel.pricePerLiter);
        setCalculatedTotal(amount * price);
      }
    }
  }, [formData.fuelTypeId, formData.fuelAmount, fuelTypes]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleProceedToPayment = () => {
    if (!formData.fuelTypeId || !formData.fuelAmount || !employee) {
      toast({
        title: t('error'),
        description: t('required'),
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.fuelAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t('error'),
        description: t('invalidAmount'),
        variant: 'destructive',
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: t('error'),
        description: t('minimumAmount'),
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep('method');
  };

  const handleProcessPayment = async () => {
    if (!employee) return;

    const selectedFuel = fuelTypes.find((f: FuelType) => f.id === formData.fuelTypeId);
    if (!selectedFuel) return;

    const transactionData = {
      employeeId: employee.id,
      fuelTypeId: formData.fuelTypeId,
      fuelAmount: parseFloat(formData.fuelAmount),
      fuelPricePerLiter: parseFloat(selectedFuel.pricePerLiter),
      totalAmount: calculatedTotal,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || null,
    };

    if (formData.paymentMethod === 'qr_code' || formData.paymentMethod === 'promptpay') {
      setCurrentStep('processing');
    } else {
      // For cash and card payments, process immediately
      createTransactionMutation.mutate(transactionData);
    }
  };

  const handleQRPaymentSuccess = (transactionId: string) => {
    if (!employee) return;

    const selectedFuel = fuelTypes.find((f: FuelType) => f.id === formData.fuelTypeId);
    if (!selectedFuel) return;

    const transactionData = {
      employeeId: employee.id,
      fuelTypeId: formData.fuelTypeId,
      fuelAmount: parseFloat(formData.fuelAmount),
      fuelPricePerLiter: parseFloat(selectedFuel.pricePerLiter),
      totalAmount: calculatedTotal,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || null,
      externalTransactionId: transactionId,
    };

    createTransactionMutation.mutate(transactionData);
  };

  const handleQRPaymentError = (error: string) => {
    toast({
      title: t('paymentFailed'),
      description: error,
      variant: 'destructive',
    });
    setCurrentStep('method');
  };

  const handleStartNewTransaction = () => {
    setFormData({
      fuelTypeId: '',
      fuelAmount: '',
      paymentMethod: '' as PaymentMethod,
      notes: ''
    });
    setCalculatedTotal(0);
    setLastTransaction(null);
    setCurrentStep('selection');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (fuelTypesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (fuelTypesError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load fuel types. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  // QR Payment Processing Step
  if (currentStep === 'processing' && (formData.paymentMethod === 'qr_code' || formData.paymentMethod === 'promptpay')) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('method')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('cancel')}
          </Button>
        </div>
        
        <ThaiQRPayment
          amount={calculatedTotal}
          merchantInfo={{
            name: "Gas Station POS",
            promptPayId: "0105558555555", // Mock PromptPay ID
            taxId: "0105558555555"
          }}
          onPaymentSuccess={handleQRPaymentSuccess}
          onPaymentError={handleQRPaymentError}
          onCancel={() => setCurrentStep('method')}
        />
      </div>
    );
  }

  // Success Step
  if (currentStep === 'success' && lastTransaction) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">{t('paymentSuccessful')}</CardTitle>
          <CardDescription>
            {formatAmount(parseFloat(lastTransaction.totalAmount))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('receiptNumber')}:</span>
              <span className="font-mono font-semibold">{lastTransaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Amount:</span>
              <span>{lastTransaction.fuelAmount}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="capitalize">{lastTransaction.paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>{t('total')}:</span>
              <span>{formatAmount(parseFloat(lastTransaction.totalAmount))}</span>
            </div>
          </div>

          <Button 
            onClick={handleStartNewTransaction}
            className="w-full"
          >
            <Receipt className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Payment Method Selection Step
  if (currentStep === 'method') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('selection')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {formData.fuelAmount}L • {formatAmount(calculatedTotal)}
          </div>
        </div>

        <PaymentMethodSelector
          selectedMethod={formData.paymentMethod}
          onMethodChange={handlePaymentMethodChange}
          amount={calculatedTotal}
        />

        {formData.paymentMethod && (
          <Button
            onClick={handleProcessPayment}
            disabled={createTransactionMutation.isPending}
            className="w-full"
            size="lg"
          >
            {createTransactionMutation.isPending ? t('loading') : t('processPayment')}
          </Button>
        )}
      </div>
    );
  }

  // Fuel Selection Step (default)
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          {t('payment')} - {employee?.full_name}
        </CardTitle>
        <CardDescription>
          Fill in fuel details to process payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fuel Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="fuelType">{t('selectFuelType')}</Label>
          <Select 
            value={formData.fuelTypeId} 
            onValueChange={(value) => handleInputChange('fuelTypeId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectFuelType')} />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map((fuel: FuelType) => (
                <SelectItem key={fuel.id} value={fuel.id} disabled={!fuel.isAvailable}>
                  <div className="flex items-center justify-between w-full">
                    <span>{fuel.name} ({fuel.type})</span>
                    <Badge variant={fuel.isAvailable ? "default" : "secondary"} className="ml-2">
                      {formatAmount(parseFloat(fuel.pricePerLiter))}/L
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Amount */}
        <div className="space-y-2">
          <Label htmlFor="fuelAmount">{t('fuelAmount')}</Label>
          <Input
            id="fuelAmount"
            type="number"
            step="0.01"
            min="1"
            value={formData.fuelAmount}
            onChange={(e) => handleInputChange('fuelAmount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Total Calculation Display */}
        {calculatedTotal > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold text-primary">
                {formatAmount(calculatedTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleProceedToPayment}
          disabled={!formData.fuelTypeId || !formData.fuelAmount || calculatedTotal <= 0}
          className="w-full"
          size="lg"
        >
          Continue to Payment • {formatAmount(calculatedTotal)}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedPaymentForm;