import QRCode from 'qrcode';
import { promisify } from 'util';
import * as crypto from 'crypto';

// Mock PromptPay QR generation (using promptpay-qr logic)
function generatePromptPayQR(promptPayId: string, amount?: number): string {
  // EMV QR Code format for PromptPay
  const payload = {
    '00': '01', // Payload Format Indicator
    '01': '12', // Point of Initiation Method (12 = QR Code shown on a customer device)
    '29': {
      '00': 'A000000677010111', // Application identifier
      '01': promptPayId.length.toString().padStart(2, '0') + promptPayId, // PromptPay ID
      '02': amount ? amount.toFixed(2) : undefined
    },
    '53': '764', // Transaction Currency (764 = THB)
    '54': amount ? amount.toFixed(2) : undefined, // Transaction Amount
    '58': 'TH', // Country Code
    '62': {
      '07': 'REFNO001' // Reference Label
    }
  };

  // Convert to EMV QR format
  let qrString = '';
  Object.entries(payload).forEach(([tag, value]) => {
    if (value !== undefined) {
      if (typeof value === 'object') {
        let subString = '';
        Object.entries(value).forEach(([subTag, subValue]) => {
          if (subValue !== undefined) {
            const subValueStr = subValue.toString();
            subString += subTag + subValueStr.length.toString().padStart(2, '0') + subValueStr;
          }
        });
        qrString += tag + subString.length.toString().padStart(2, '0') + subString;
      } else {
        const valueStr = value.toString();
        qrString += tag + valueStr.length.toString().padStart(2, '0') + valueStr;
      }
    }
  });

  // Add CRC (simplified - in real implementation, use proper CRC-16 CCITT)
  qrString += '6304';
  const crc = crypto.createHash('md5').update(qrString).digest('hex').substring(0, 4).toUpperCase();
  qrString += crc;

  return qrString;
}

export class ThaiPaymentService {
  private static instance: ThaiPaymentService;
  private scbApiKey: string | null = null;
  private scbApiSecret: string | null = null;
  private kbankMerchantId: string | null = null;
  
  public static getInstance(): ThaiPaymentService {
    if (!ThaiPaymentService.instance) {
      ThaiPaymentService.instance = new ThaiPaymentService();
    }
    return ThaiPaymentService.instance;
  }

  private constructor() {
    // Load credentials from environment variables
    this.scbApiKey = process.env.SCB_API_KEY || null;
    this.scbApiSecret = process.env.SCB_API_SECRET || null;
    this.kbankMerchantId = process.env.KBANK_MERCHANT_ID || null;
  }

  // Generate PromptPay QR Code
  async generatePromptPayQR(promptPayId: string, amount: number, ref1?: string): Promise<{
    qrData: string;
    qrImageBase64: string;
    transactionRef: string;
  }> {
    try {
      const transactionRef = `TXN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Generate QR payload
      const qrData = generatePromptPayQR(promptPayId, amount);
      
      // Generate QR code image
      const qrImageBase64 = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrData,
        qrImageBase64,
        transactionRef
      };
    } catch (error) {
      console.error('Error generating PromptPay QR:', error);
      throw new Error('Failed to generate PromptPay QR code');
    }
  }

  // Generate Thai QR30 payment
  async generateThaiQR30(merchantInfo: {
    merchantId: string;
    terminalId: string;
    amount: number;
    ref1?: string;
    ref2?: string;
  }): Promise<{
    qrData: string;
    qrImageBase64: string;
    transactionRef: string;
  }> {
    try {
      const transactionRef = `QR30${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Thai QR30 EMV format
      const qrData = this.generateQR30Payload(merchantInfo);
      
      // Generate QR code image
      const qrImageBase64 = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrData,
        qrImageBase64,
        transactionRef
      };
    } catch (error) {
      console.error('Error generating Thai QR30:', error);
      throw new Error('Failed to generate Thai QR30 code');
    }
  }

  private generateQR30Payload(merchantInfo: {
    merchantId: string;
    terminalId: string;
    amount: number;
    ref1?: string;
    ref2?: string;
  }): string {
    // Simplified QR30 payload generation
    const payload = {
      '00': '01', // Payload Format Indicator
      '01': '11', // Point of Initiation Method
      '30': {
        '00': 'A000000677010112', // Thai QR Payment identifier
        '01': merchantInfo.merchantId,
        '02': merchantInfo.terminalId,
        '03': merchantInfo.ref1 || '',
        '04': merchantInfo.ref2 || ''
      },
      '53': '764', // THB Currency
      '54': merchantInfo.amount.toFixed(2),
      '58': 'TH',
      '62': {
        '07': `REF${Date.now()}`
      }
    };

    // Convert to string format (simplified)
    return JSON.stringify(payload); // In real implementation, use proper EMV format
  }

  // Check payment status (mock implementation)
  async checkPaymentStatus(transactionRef: string): Promise<{
    status: 'pending' | 'success' | 'failed' | 'timeout';
    transactionId?: string;
    amount?: number;
    timestamp?: Date;
  }> {
    // Mock payment status check - in real implementation, this would call bank APIs
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        // Mock random success (20% chance)
        const success = Math.random() < 0.2;
        
        if (success) {
          resolve({
            status: 'success',
            transactionId: `TH${Date.now()}`,
            amount: 100, // Mock amount
            timestamp: new Date()
          });
        } else {
          resolve({
            status: 'pending'
          });
        }
      }, 1000);
    });
  }

  // Process SCB payment (if API credentials available)
  async processSCBPayment(paymentData: {
    amount: number;
    currency: string;
    reference: string;
  }): Promise<any> {
    if (!this.scbApiKey || !this.scbApiSecret) {
      throw new Error('SCB API credentials not configured');
    }

    // Mock SCB API call
    console.log('Processing SCB payment:', paymentData);
    
    // In real implementation, call SCB API here
    return {
      success: true,
      transactionId: `SCB${Date.now()}`,
      status: 'completed'
    };
  }

  // Process KBank payment (if merchant ID available)
  async processKBankPayment(paymentData: {
    amount: number;
    orderId: string;
    description: string;
  }): Promise<any> {
    if (!this.kbankMerchantId) {
      throw new Error('KBank merchant ID not configured');
    }

    // Mock KBank payment processing
    console.log('Processing KBank payment:', paymentData);
    
    return {
      success: true,
      transactionId: `KBANK${Date.now()}`,
      redirectUrl: 'https://payment.kasikornbank.com/mock-redirect'
    };
  }
}

export const thaiPaymentService = ThaiPaymentService.getInstance();