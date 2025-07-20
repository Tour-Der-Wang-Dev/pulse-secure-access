import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from 'react-i18next';
import { QrCode, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

interface ThaiQRPaymentProps {
  amount: number;
  merchantInfo: {
    name: string;
    promptPayId: string;
    taxId?: string;
  };
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const ThaiQRPayment: React.FC<ThaiQRPaymentProps> = ({
  amount,
  merchantInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'generating' | 'waiting' | 'success' | 'failed' | 'timeout'>('generating');
  const [transactionId, setTransactionId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timeout

  useEffect(() => {
    generateQRCode();
  }, [amount, merchantInfo]);

  useEffect(() => {
    if (paymentStatus === 'waiting' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPaymentStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, timeLeft]);

  useEffect(() => {
    if (paymentStatus === 'waiting') {
      // Poll for payment status every 3 seconds
      const pollInterval = setInterval(checkPaymentStatus, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [paymentStatus]);

  const generateQRCode = async () => {
    try {
      setPaymentStatus('generating');
      
      // Generate PromptPay QR payload
      const promptPayQR = require('promptpay-qr');
      const payload = promptPayQR(merchantInfo.promptPayId, amount);
      
      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
      setPaymentStatus('waiting');
      
      // Generate mock transaction ID
      const mockTransactionId = `TH${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      setTransactionId(mockTransactionId);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      onPaymentError('Failed to generate QR code');
      setPaymentStatus('failed');
    }
  };

  const checkPaymentStatus = async () => {
    // Mock payment status check - in real implementation, this would call your backend
    // which would check with the bank's API
    try {
      // Simulate random payment success for demo (20% chance per check)
      if (Math.random() < 0.2) {
        setPaymentStatus('success');
        onPaymentSuccess(transactionId);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const StatusIcon = () => {
    switch (paymentStatus) {
      case 'generating':
        return <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />;
      case 'waiting':
        return <Clock className="h-6 w-6 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <QrCode className="h-6 w-6" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'generating':
        return t('loading');
      case 'waiting':
        return t('waitingForPayment');
      case 'success':
        return t('paymentSuccessful');
      case 'failed':
        return t('paymentFailed');
      case 'timeout':
        return t('paymentTimeout');
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <StatusIcon />
          {t('promptPay')} / {t('thaiQr30')}
        </CardTitle>
        <CardDescription>
          {merchantInfo.name}
        </CardDescription>
        <div className="text-2xl font-bold text-primary">
          {formatAmount(amount)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {paymentStatus === 'generating' && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">{t('loading')}</p>
            </div>
          </div>
        )}

        {(paymentStatus === 'waiting' || paymentStatus === 'success') && qrCodeUrl && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <img 
                src={qrCodeUrl} 
                alt="PromptPay QR Code" 
                className="max-w-full h-auto"
                style={{ maxWidth: '280px' }}
              />
            </div>
            
            {paymentStatus === 'waiting' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('qrPaymentInstructions')}
                </p>
                <Badge variant="outline" className="text-lg font-mono">
                  {formatTime(timeLeft)}
                </Badge>
              </div>
            )}
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-semibold text-green-800">{t('paymentSuccessful')}</p>
            <p className="text-sm text-green-600">
              {t('receiptNumber')}: {transactionId}
            </p>
          </div>
        )}

        {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
          <div className="text-center space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="font-semibold text-red-800">{getStatusMessage()}</p>
          </div>
        )}

        <div className="flex gap-2">
          {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
            <Button 
              onClick={generateQRCode}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          
          {paymentStatus !== 'success' && (
            <Button 
              onClick={onCancel}
              className={paymentStatus === 'failed' || paymentStatus === 'timeout' ? 'flex-1' : 'w-full'}
              variant="outline"
            >
              {t('cancel')}
            </Button>
          )}
        </div>

        {/* Payment provider logos */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground mb-2">
            Supported by Thai banks
          </p>
          <div className="flex justify-center items-center gap-2 opacity-60">
            <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">SCB</div>
            <div className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">KBANK</div>
            <div className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-800 rounded">BBL</div>
            <div className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 rounded">KTB</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThaiQRPayment;