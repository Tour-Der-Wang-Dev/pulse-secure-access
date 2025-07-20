import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import { 
  employees, 
  fuelTypes, 
  gasTransactions, 
  auditLogs, 
  alerts,
  type Employee, 
  type InsertEmployee,
  type FuelType,
  type InsertFuelType,
  type GasTransaction,
  type InsertGasTransaction,
  type AuditLog,
  type InsertAuditLog,
  type Alert,
  type InsertAlert
} from "@shared/schema";

// Database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByPin(pin: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  
  // Fuel type methods
  getFuelTypes(): Promise<FuelType[]>;
  getAvailableFuelTypes(): Promise<FuelType[]>;
  getFuelType(id: string): Promise<FuelType | undefined>;
  
  // Transaction methods
  createTransaction(transaction: InsertGasTransaction): Promise<GasTransaction>;
  getTransaction(id: string): Promise<GasTransaction | undefined>;
  getEmployeeTransactions(employeeId: string): Promise<GasTransaction[]>;
  
  // Audit log methods
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(employeeId?: string): Promise<AuditLog[]>;
  
  // Alert methods
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlerts(status?: string): Promise<Alert[]>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    return result[0];
  }

  async getEmployeeByPin(pin: string): Promise<Employee | undefined> {
    const result = await db
      .select()
      .from(employees)
      .where(and(eq(employees.pin, pin), eq(employees.isActive, true)))
      .limit(1);
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(employee).returning();
    return result[0];
  }

  // Fuel type methods
  async getFuelTypes(): Promise<FuelType[]> {
    return await db.select().from(fuelTypes).orderBy(fuelTypes.name);
  }

  async getAvailableFuelTypes(): Promise<FuelType[]> {
    return await db
      .select()
      .from(fuelTypes)
      .where(eq(fuelTypes.isAvailable, true))
      .orderBy(fuelTypes.name);
  }

  async getFuelType(id: string): Promise<FuelType | undefined> {
    const result = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id)).limit(1);
    return result[0];
  }

  // Transaction methods
  async createTransaction(transaction: InsertGasTransaction): Promise<GasTransaction> {
    const result = await db.insert(gasTransactions).values(transaction).returning();
    return result[0];
  }

  async getTransaction(id: string): Promise<GasTransaction | undefined> {
    const result = await db.select().from(gasTransactions).where(eq(gasTransactions.id, id)).limit(1);
    return result[0];
  }

  async getEmployeeTransactions(employeeId: string): Promise<GasTransaction[]> {
    return await db
      .select()
      .from(gasTransactions)
      .where(eq(gasTransactions.employeeId, employeeId))
      .orderBy(gasTransactions.createdAt);
  }

  // Audit log methods
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(auditLog).returning();
    return result[0];
  }

  async getAuditLogs(employeeId?: string): Promise<AuditLog[]> {
    const query = db.select().from(auditLogs);
    if (employeeId) {
      return await query.where(eq(auditLogs.employeeId, employeeId)).orderBy(auditLogs.createdAt);
    }
    return await query.orderBy(auditLogs.createdAt);
  }

  // Alert methods
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async getAlerts(status?: string): Promise<Alert[]> {
    const query = db.select().from(alerts);
    if (status) {
      return await query.where(eq(alerts.status, status as any)).orderBy(alerts.createdAt);
    }
    return await query.orderBy(alerts.createdAt);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const result = await db.update(alerts).set(updates).where(eq(alerts.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
