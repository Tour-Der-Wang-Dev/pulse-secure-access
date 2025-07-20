import { pgTable, text, uuid, boolean, decimal, timestamp, pgEnum, jsonb, inet } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const employeeRoleEnum = pgEnum("employee_role", ["cashier", "admin", "manager"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline", "diesel", "premium", "super", "ethanol"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "qr_code"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "cancelled", "failed"]);
export const auditActionEnum = pgEnum("audit_action", ["login", "logout", "transaction_created", "transaction_cancelled", "payment_processed", "alert_created"]);
export const alertTypeEnum = pgEnum("alert_type", ["suspicious_activity", "excessive_cancellations", "unusual_amount", "failed_payments"]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "resolved", "dismissed"]);

// Tables
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  pin: text("pin").notNull().unique(),
  rfidCode: text("rfid_code"),
  fullName: text("full_name").notNull(),
  role: employeeRoleEnum("role").notNull().default("cashier"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fuelTypes = pgTable("fuel_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: fuelTypeEnum("type").notNull(),
  pricePerLiter: decimal("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gasTransactions = pgTable("gas_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  fuelTypeId: uuid("fuel_type_id").notNull().references(() => fuelTypes.id),
  fuelAmount: decimal("fuel_amount", { precision: 10, scale: 2 }).notNull(),
  fuelPricePerLiter: decimal("fuel_price_per_liter", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  receiptNumber: text("receipt_number").unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id),
  action: auditActionEnum("action").notNull(),
  details: jsonb("details").notNull().default({}),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id),
  type: alertTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: uuid("resolved_by").references(() => employees.id),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  transactions: many(gasTransactions),
  auditLogs: many(auditLogs),
  alerts: many(alerts),
  resolvedAlerts: many(alerts, { relationName: "resolved_by" }),
}));

export const fuelTypesRelations = relations(fuelTypes, ({ many }) => ({
  transactions: many(gasTransactions),
}));

export const gasTransactionsRelations = relations(gasTransactions, ({ one }) => ({
  employee: one(employees, {
    fields: [gasTransactions.employeeId],
    references: [employees.id],
  }),
  fuelType: one(fuelTypes, {
    fields: [gasTransactions.fuelTypeId],
    references: [fuelTypes.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [auditLogs.employeeId],
    references: [employees.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  employee: one(employees, {
    fields: [alerts.employeeId],
    references: [employees.id],
  }),
  resolvedByEmployee: one(employees, {
    fields: [alerts.resolvedBy],
    references: [employees.id],
    relationName: "resolved_by",
  }),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFuelTypeSchema = createInsertSchema(fuelTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGasTransactionSchema = createInsertSchema(gasTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fuelAmount: z.coerce.string(),
  fuelPricePerLiter: z.coerce.string(),
  totalAmount: z.coerce.string(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type FuelType = typeof fuelTypes.$inferSelect;
export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type GasTransaction = typeof gasTransactions.$inferSelect;
export type InsertGasTransaction = z.infer<typeof insertGasTransactionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
