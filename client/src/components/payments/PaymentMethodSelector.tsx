import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { CreditCard, Banknote, QrCode, Smartphone } from 'lucide-react';

export type PaymentMethod = 'cash' | 'card' | 'qr_code' | 'promptpay';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  amount
}) => {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: t('cash'),
      icon: Banknote,
      description: 'เงินสด',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-500'
    },
    {
      id: 'card' as PaymentMethod,
      name: t('card'),
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500'
    },
    {
      id: 'qr_code' as PaymentMethod,
      name: t('thaiQr30'),
      icon: QrCode,
      description: 'Thai QR Payment',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-500'
    },
    {
      id: 'promptpay' as PaymentMethod,
      name: t('promptPay'),
      icon: Smartphone,
      description: 'พร้อมเพย์',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      selectedColor: 'bg-orange-100 border-orange-500'
    }
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-1">{t('paymentMethod')}</h3>
        <p className="text-2xl font-bold text-primary">{formatAmount(amount)}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? method.selectedColor : method.color
              }`}
              onClick={() => onMethodChange(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-white shadow-sm' : 'bg-white/50'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      isSelected ? 'text-primary' : 'text-foreground'
                    }`}>
                      {method.name}
                    </h4>
                    <p className={`text-sm ${
                      isSelected ? 'text-primary/80' : 'text-muted-foreground'
                    }`}>
                      {method.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick amount buttons for cash payments */}
      {selectedMethod === 'cash' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Quick Cash Amounts:</p>
          <div className="flex flex-wrap gap-2">
            {[100, 200, 500, 1000].map((cashAmount) => (
              <Button
                key={cashAmount}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {/* Handle quick cash amount selection */}}
              >
                ฿{cashAmount}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* QR Code benefits */}
      {(selectedMethod === 'qr_code' || selectedMethod === 'promptpay') && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <QrCode className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Instant & Secure Payment</p>
              <p className="text-blue-600">
                • No cash handling required<br/>
                • Real-time confirmation<br/>
                • Works with all Thai banking apps
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;