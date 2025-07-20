
-- Create enum types for better data integrity
CREATE TYPE employee_role AS ENUM ('cashier', 'admin', 'manager');
CREATE TYPE fuel_type AS ENUM ('gasoline', 'diesel', 'premium', 'super', 'ethanol');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'qr_code');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'failed');
CREATE TYPE audit_action AS ENUM ('login', 'logout', 'transaction_created', 'transaction_cancelled', 'payment_processed', 'alert_created');
CREATE TYPE alert_type AS ENUM ('suspicious_activity', 'excessive_cancellations', 'unusual_amount', 'failed_payments');
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'dismissed');

-- Employees table (extends existing functionality)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin TEXT NOT NULL UNIQUE,
  rfid_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role employee_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel types table
CREATE TABLE fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type fuel_type NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gas station transactions table (modify existing transactions table structure)
CREATE TABLE gas_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id),
  fuel_amount DECIMAL(10,2) NOT NULL, -- in liters
  fuel_price_per_liter DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL, -- in currency
  payment_method payment_method NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs table for fraud prevention
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  action audit_action NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts table for suspicious activities
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  type alert_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status alert_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES employees(id)
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Employees can view their own data" ON employees
  FOR SELECT USING (id = (current_setting('app.current_employee_id', true))::UUID OR 
                   (SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

CREATE POLICY "Admins can manage all employees" ON employees
  FOR ALL USING ((SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

-- Create policies for fuel_types table
CREATE POLICY "All employees can view fuel types" ON fuel_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fuel types" ON fuel_types
  FOR ALL USING ((SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

-- Create policies for gas_transactions table
CREATE POLICY "Employees can view their own transactions" ON gas_transactions
  FOR SELECT USING (employee_id = (current_setting('app.current_employee_id', true))::UUID OR 
                   (SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

CREATE POLICY "Employees can create transactions" ON gas_transactions
  FOR INSERT WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::UUID);

CREATE POLICY "Only admins can update transactions" ON gas_transactions
  FOR UPDATE USING ((SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

-- No delete policy for transactions (fraud prevention)

-- Create policies for audit_logs table
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING ((SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create policies for alerts table
CREATE POLICY "Admins can manage alerts" ON alerts
  FOR ALL USING ((SELECT role FROM employees WHERE id = (current_setting('app.current_employee_id', true))::UUID) IN ('admin', 'manager'));

-- Insert default fuel types
INSERT INTO fuel_types (name, type, price_per_liter) VALUES
  ('Regular Gasoline', 'gasoline', 1.45),
  ('Premium Gasoline', 'premium', 1.65),
  ('Diesel', 'diesel', 1.55),
  ('Super Unleaded', 'super', 1.75),
  ('E85 Ethanol', 'ethanol', 1.25);

-- Insert default admin employee
INSERT INTO employees (pin, full_name, role) VALUES
  ('1234', 'Admin User', 'admin'),
  ('5678', 'Manager User', 'manager'),
  ('9999', 'Cashier User', 'cashier');

-- Create indexes for better performance
CREATE INDEX idx_gas_transactions_employee_id ON gas_transactions(employee_id);
CREATE INDEX idx_gas_transactions_created_at ON gas_transactions(created_at);
CREATE INDEX idx_audit_logs_employee_id ON audit_logs(employee_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_alerts_employee_id ON alerts(employee_id);
CREATE INDEX idx_alerts_status ON alerts(status);

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fuel_types_updated_at BEFORE UPDATE ON fuel_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gas_transactions_updated_at BEFORE UPDATE ON gas_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
