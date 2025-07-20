import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGasTransactionSchema, insertAuditLogSchema } from "@shared/schema";
import { z } from "zod";
import { thaiPaymentService } from "./services/ThaiPaymentService";

// Request body validation schemas
const loginSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

const transactionSchema = z.object({
  employeeId: z.string(),
  fuelTypeId: z.string(),
  fuelAmount: z.number().transform(val => val.toString()),
  fuelPricePerLiter: z.number().transform(val => val.toString()),
  totalAmount: z.number().transform(val => val.toString()),
  paymentMethod: z.enum(['cash', 'card', 'qr_code', 'promptpay']),
  notes: z.string().nullable().optional(),
  externalTransactionId: z.string().optional(),
});

const auditLogSchema = insertAuditLogSchema.extend({
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee authentication
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { pin } = loginSchema.parse(req.body);
      
      const employee = await storage.getEmployeeByPin(pin);
      if (!employee) {
        // Log failed login attempt
        await storage.createAuditLog({
          action: "login",
          details: { success: false, pin_attempted: pin },
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
        });
        
        return res.status(401).json({ success: false, error: "Invalid PIN or inactive employee" });
      }

      // Log successful login
      await storage.createAuditLog({
        employeeId: employee.id,
        action: "login",
        details: { success: true, employee_name: employee.fullName },
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip,
      });

      res.json({ success: true, employee });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ success: false, error: "Login failed. Please try again." });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const { employeeId, employeeName } = req.body;
      
      if (employeeId) {
        await storage.createAuditLog({
          employeeId,
          action: "logout",
          details: { employee_name: employeeName },
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(400).json({ success: false, error: "Logout failed" });
    }
  });

  // Fuel types
  app.get("/api/fuel-types", async (req: Request, res: Response) => {
    try {
      const fuelTypes = await storage.getAvailableFuelTypes();
      res.json(fuelTypes);
    } catch (error) {
      console.error("Error fetching fuel types:", error);
      res.status(500).json({ error: "Failed to fetch fuel types" });
    }
  });

  app.get("/api/fuel-types/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const fuelType = await storage.getFuelType(id);
      
      if (!fuelType) {
        return res.status(404).json({ error: "Fuel type not found" });
      }
      
      res.json(fuelType);
    } catch (error) {
      console.error("Error fetching fuel type:", error);
      res.status(500).json({ error: "Failed to fetch fuel type" });
    }
  });

  // Transactions
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = transactionSchema.parse(req.body);
      
      // Generate receipt number
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const receiptNumber = `GS${timestamp}${random}`;
      
      const transaction = await storage.createTransaction({
        ...validatedData,
        receiptNumber,
        status: "completed",
        stripePaymentIntentId: validatedData.paymentMethod !== "cash" ? `pi_mock_${Date.now()}` : null,
      });

      // Log successful transaction
      await storage.createAuditLog({
        employeeId: validatedData.employeeId,
        action: "payment_processed",
        details: {
          transaction_id: transaction.id,
          amount: validatedData.totalAmount.toString(),
          payment_method: validatedData.paymentMethod,
          receipt_number: receiptNumber
        },
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip,
      });

      res.json(transaction);
    } catch (error) {
      console.error("Transaction error:", error);
      
      // Log failed transaction if employee ID is available
      if (req.body.employeeId) {
        await storage.createAuditLog({
          employeeId: req.body.employeeId,
          action: "payment_processed",
          details: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            payment_method: req.body.paymentMethod
          },
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
        });
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      }
      
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.get("/api/employees/:employeeId/transactions", async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const transactions = await storage.getEmployeeTransactions(employeeId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching employee transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Audit logs (admin only)
  app.get("/api/audit-logs", async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.query;
      const logs = await storage.getAuditLogs(employeeId as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Alerts (admin only)
  app.get("/api/alerts", async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const alerts = await storage.getAlerts(status as string);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const alert = await storage.updateAlert(id, updates);
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Thai Payment API Endpoints
  
  // Generate PromptPay QR code
  app.post("/api/payments/promptpay/generate", async (req: Request, res: Response) => {
    try {
      const { promptPayId, amount, ref1 } = req.body;
      
      if (!promptPayId || !amount) {
        return res.status(400).json({ error: "PromptPay ID and amount are required" });
      }

      const result = await thaiPaymentService.generatePromptPayQR(
        promptPayId,
        parseFloat(amount),
        ref1
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error generating PromptPay QR:", error);
      res.status(500).json({ error: error.message || "Failed to generate PromptPay QR" });
    }
  });

  // Generate Thai QR30 code
  app.post("/api/payments/qr30/generate", async (req: Request, res: Response) => {
    try {
      const { merchantId, terminalId, amount, ref1, ref2 } = req.body;
      
      if (!merchantId || !terminalId || !amount) {
        return res.status(400).json({ error: "Merchant ID, Terminal ID, and amount are required" });
      }

      const result = await thaiPaymentService.generateThaiQR30({
        merchantId,
        terminalId,
        amount: parseFloat(amount),
        ref1,
        ref2
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Error generating Thai QR30:", error);
      res.status(500).json({ error: error.message || "Failed to generate Thai QR30" });
    }
  });

  // Check payment status
  app.get("/api/payments/status/:transactionRef", async (req: Request, res: Response) => {
    try {
      const { transactionRef } = req.params;
      
      const status = await thaiPaymentService.checkPaymentStatus(transactionRef);
      res.json(status);
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ error: error.message || "Failed to check payment status" });
    }
  });

  // Process SCB payment
  app.post("/api/payments/scb/process", async (req: Request, res: Response) => {
    try {
      const { amount, currency, reference } = req.body;
      
      if (!amount || !currency || !reference) {
        return res.status(400).json({ error: "Amount, currency, and reference are required" });
      }

      const result = await thaiPaymentService.processSCBPayment({
        amount: parseFloat(amount),
        currency,
        reference
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Error processing SCB payment:", error);
      res.status(500).json({ error: error.message || "Failed to process SCB payment" });
    }
  });

  // Process KBank payment
  app.post("/api/payments/kbank/process", async (req: Request, res: Response) => {
    try {
      const { amount, orderId, description } = req.body;
      
      if (!amount || !orderId) {
        return res.status(400).json({ error: "Amount and order ID are required" });
      }

      const result = await thaiPaymentService.processKBankPayment({
        amount: parseFloat(amount),
        orderId,
        description: description || ""
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Error processing KBank payment:", error);
      res.status(500).json({ error: error.message || "Failed to process KBank payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
