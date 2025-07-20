# Gas Station Management System

## Project Overview
A comprehensive gas station management system built with React/TypeScript frontend and Node.js/Express backend, using PostgreSQL with Drizzle ORM. The system handles employee authentication, fuel transactions, payment processing, and audit logging with full Thai payment integration including PromptPay and QR30 standards.

## Recent Changes (January 2025)
- ✅ Successfully migrated from Lovable/Supabase to Replit environment
- ✅ Implemented secure client/server separation architecture
- ✅ Replaced Supabase with Neon PostgreSQL database using Drizzle ORM
- ✅ Created comprehensive API routes for authentication and transactions
- ✅ Added proper schema validation and error handling
- ✅ Seeded database with fuel types and test employees
- ✅ **Added Advanced Features**: Dashboard, Analytics, and Reports pages
- ✅ Fixed transaction validation issues with decimal number handling
- ✅ Enhanced navigation with role-based access control
- ✅ **Thai Payment Integration**: Complete PromptPay, QR30, and Thai banking API support
- ✅ **Multi-language Support**: Thai/English interface with i18next
- ✅ **Enhanced UX/UI**: Modern payment flow with QR code generation and real-time status
- ✅ **Thai Banking APIs**: SCB and KBank integration architecture ready

## Current Architecture

### Backend (Server)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: PIN-based employee login system
- **API Routes**: RESTful endpoints under `/api/*`
- **Security**: Input validation with Zod schemas

### Frontend (Client)  
- **Framework**: React with TypeScript
- **Routing**: React Router DOM
- **State Management**: TanStack React Query
- **UI Components**: shadcn/ui with Tailwind CSS
- **Forms**: react-hook-form with Zod validation

### Database Schema
- **employees**: PIN-based authentication, roles (admin/manager/cashier)
- **fuel_types**: Available fuel products with pricing
- **gas_transactions**: Complete transaction records with Thai payment method support
- **audit_logs**: Security and activity logging
- **alerts**: System notifications and warnings

### Thai Payment Integration
- **PromptPay QR**: EMV-compliant QR code generation for bank transfers
- **Thai QR30**: Merchant-presented QR payment standard
- **Banking APIs**: SCB and KBank integration architecture
- **Multi-language**: Thai/English support with professional translations
- **Real-time Status**: Payment confirmation and timeout handling

## Test Credentials
- Admin: PIN `1234`
- Manager: PIN `5678` 
- Cashier: PIN `9999`

## User Preferences
- Communication: Professional, concise, technical explanations
- Code Style: TypeScript strict mode, proper error handling
- Architecture: Strong client/server separation, secure API design
- Focus: Security, fraud prevention, audit trails

## Development Status
Current version is fully functional with:
- Employee authentication with role-based access
- Fuel transaction processing with validation
- **Thai Payment System**: PromptPay, QR30, SCB/KBank integration
- **Multi-language Interface**: Thai/English with language switching
- Real-time payment confirmation and QR code generation
- Comprehensive audit logging
- Transaction receipt generation
- **Advanced Dashboard**: Real-time metrics and performance indicators
- **Analytics Module**: Business intelligence and trend analysis (Admin/Manager only)
- **Reports System**: Detailed reporting with export capabilities (Admin/Manager only)
- Role-based navigation (Dashboard/Payment for all, Analytics/Reports for managers+)

## Advanced Features Details
- **Dashboard**: Shows daily revenue, transaction counts, recent activity, and role-specific insights
- **Analytics**: Revenue trends, fuel type distribution, payment method analysis, peak hours tracking
- **Reports**: Comprehensive reporting with filters, audit log preview, active alerts monitoring
- **Access Control**: Cashiers see dashboard and payment; Managers/Admins access full feature set
- **Thai Payments**: Real-time QR generation, bank integration, EMV compliance, timeout handling
- **UX/UI Enhancements**: Step-by-step payment flow, currency formatting, bank logos, status indicators

## Thai Payment System Features
- **PromptPay Integration**: Generate QR codes for bank transfers using citizen ID/phone numbers
- **Thai QR30 Standard**: EMV-compliant merchant-presented QR payments
- **Banking API Support**: SCB developer platform and KBank payment gateway integration
- **Multi-bank Compatibility**: Works with all major Thai banks (SCB, KBank, BBL, KTB)
- **Real-time Confirmation**: Payment status polling and instant notifications
- **Currency Formatting**: Proper Thai Baht display with internationalization
- **Error Handling**: Timeout management, retry functionality, user-friendly error messages

Next phase: Production deployment with real banking API credentials and enhanced security.