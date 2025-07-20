# Gas Station Management System

## Overview
A comprehensive gas station management system with employee authentication, fuel transaction processing, and audit logging. Successfully migrated from Lovable/Supabase to Replit environment with proper security practices and client/server separation.

## Project Architecture
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: PIN-based employee login system
- **Styling**: Tailwind CSS with shadcn/ui components

## Key Features
- Employee authentication with PIN codes
- Fuel type management with pricing
- Transaction processing with multiple payment methods (cash, card, QR code)
- Audit logging for security and compliance
- Real-time transaction receipts
- Role-based access (cashier, manager, admin)

## Database Schema
- **employees**: Employee records with roles and authentication
- **fuel_types**: Available fuel products with pricing
- **gas_transactions**: Complete transaction records
- **audit_logs**: Security and activity logging
- **alerts**: Fraud detection and monitoring

## API Endpoints
- `POST /api/auth/login` - Employee authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/fuel-types` - Available fuel products
- `POST /api/transactions` - Process new transactions
- `GET /api/audit-logs` - Security audit trails (admin only)
- `GET /api/alerts` - System alerts (admin only)

## Recent Changes
- **2025-01-20**: Successfully migrated from Supabase to Neon PostgreSQL
- **2025-01-20**: Implemented Drizzle ORM for type-safe database operations
- **2025-01-20**: Created secure API routes with proper validation
- **2025-01-20**: Removed all Supabase dependencies and client-side database calls
- **2025-01-20**: Added seed data for fuel types and test employees

## Security Features
- Server-side authentication and authorization
- Secure API endpoints with request validation
- Audit logging for all critical operations
- No direct database access from frontend
- Environment variable protection for sensitive data

## Test Credentials
- Admin: PIN 1234
- Manager: PIN 5678  
- Cashier: PIN 9999

## User Preferences
None specified yet.

## Development Notes
- All database operations handled server-side for security
- Frontend uses React Query for efficient API state management
- Full TypeScript coverage for type safety
- Follows Replit deployment best practices