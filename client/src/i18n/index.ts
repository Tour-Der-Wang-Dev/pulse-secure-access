import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      payment: "Payment",
      analytics: "Analytics", 
      reports: "Reports",
      settings: "Settings",
      audit: "Audit",
      logout: "Logout",
      
      // Common
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      total: "Total",
      amount: "Amount",
      
      // Payment
      selectFuelType: "Select Fuel Type",
      fuelAmount: "Fuel Amount (Liters)",
      paymentMethod: "Payment Method",
      cash: "Cash",
      card: "Credit/Debit Card",
      qrCode: "QR Code",
      promptPay: "PromptPay",
      processPayment: "Process Payment",
      paymentSuccessful: "Payment Successful",
      paymentFailed: "Payment Failed",
      receiptNumber: "Receipt Number",
      
      // QR Payment
      scanQrCode: "Scan QR Code to Pay",
      qrPaymentInstructions: "Open your banking app and scan the QR code to complete payment",
      waitingForPayment: "Waiting for payment confirmation...",
      paymentTimeout: "Payment timed out. Please try again.",
      
      // Dashboard
      todayRevenue: "Today's Revenue",
      todayTransactions: "Today's Transactions",
      avgTransaction: "Average Transaction",
      activeAlerts: "Active Alerts",
      recentTransactions: "Recent Transactions",
      
      // Forms
      required: "This field is required",
      invalidAmount: "Please enter a valid amount",
      minimumAmount: "Minimum amount is ฿1.00",
      
      // Employee
      employee: "Employee",
      role: "Role",
      admin: "Administrator",
      manager: "Manager", 
      cashier: "Cashier",
      
      // Thai specific
      baht: "Baht",
      satang: "Satang",
      thaiQr30: "Thai QR30",
      promptPayId: "PromptPay ID"
    }
  },
  th: {
    translation: {
      // Navigation
      dashboard: "แดชบอร์ด",
      payment: "การชำระเงิน",
      analytics: "การวิเคราะห์", 
      reports: "รายงาน",
      settings: "การตั้งค่า",
      audit: "ตรวจสอบ",
      logout: "ออกจากระบบ",
      
      // Common
      loading: "กำลังโหลด...",
      error: "ข้อผิดพลาด",
      success: "สำเร็จ",
      cancel: "ยกเลิก",
      confirm: "ยืนยัน",
      total: "รวม",
      amount: "จำนวนเงิน",
      
      // Payment
      selectFuelType: "เลือกประเภทน้ำมัน",
      fuelAmount: "ปริมาณน้ำมัน (ลิตร)",
      paymentMethod: "วิธีการชำระเงิน",
      cash: "เงินสด",
      card: "บัตรเครดิต/เดบิต",
      qrCode: "คิวอาร์โค้ด",
      promptPay: "พร้อมเพย์",
      processPayment: "ดำเนินการชำระเงิน",
      paymentSuccessful: "ชำระเงินสำเร็จ",
      paymentFailed: "ชำระเงินไม่สำเร็จ",
      receiptNumber: "หมายเลขใบเสร็จ",
      
      // QR Payment
      scanQrCode: "สแกน QR Code เพื่อชำระเงิน",
      qrPaymentInstructions: "เปิดแอปธนาคารและสแกน QR Code เพื่อชำระเงิน",
      waitingForPayment: "รอการยืนยันการชำระเงิน...",
      paymentTimeout: "หมดเวลาการชำระเงิน กรุณาลองใหม่อีกครั้ง",
      
      // Dashboard
      todayRevenue: "รายได้วันนี้",
      todayTransactions: "ธุรกรรมวันนี้",
      avgTransaction: "ธุรกรรมเฉลี่ย",
      activeAlerts: "การแจ้งเตือนที่ใช้งาน",
      recentTransactions: "ธุรกรรมล่าสุด",
      
      // Forms
      required: "ช่องนี้จำเป็น",
      invalidAmount: "กรุณาระบุจำนวนเงินที่ถูกต้อง",
      minimumAmount: "จำนวนเงินขั้นต่ำ ฿1.00",
      
      // Employee
      employee: "พนักงาน",
      role: "บทบาท",
      admin: "ผู้ดูแลระบบ",
      manager: "ผู้จัดการ",
      cashier: "แคชเชียร์",
      
      // Thai specific
      baht: "บาท",
      satang: "สตางค์",
      thaiQr30: "ไทย QR30",
      promptPayId: "หมายเลขพร้อมเพย์"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;