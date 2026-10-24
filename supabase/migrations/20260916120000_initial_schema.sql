-- TallerIQ — esquema inicial (Fase 1)
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'RECEPCIONISTA', 'MECANICO');
CREATE TYPE public.work_order_status AS ENUM (
  'RECEIVED',
  'DIAGNOSIS',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_REPAIR',
  'COMPLETED',
  'DELIVERED',
  'CANCELLED'
);
CREATE TYPE public.work_order_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE public.diagnostic_item_status AS ENUM ('OK', 'REVIEW', 'REPLACE');
CREATE TYPE public.evidence_type AS ENUM ('BEFORE', 'DURING', 'AFTER');
CREATE TYPE public.budget_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED');
CREATE TYPE public.budget_item_type AS ENUM ('PART', 'LABOR', 'OTHER');
CREATE TYPE public.maintenance_reminder_status AS ENUM ('PENDING', 'DUE', 'OVERDUE', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.notification_type AS ENUM (
  'MAINTENANCE_REMINDER',
  'STATUS_CHANGE',
  'BUDGET_UPDATE',
  'VEHICLE_READY',
  'SYSTEM'
);

-- updated_at reutilizable
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'RECEPCIONISTA',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helpers de rol (SECURITY DEFINER; no usar user_metadata para autorización)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RECEPCIONISTA', 'MECANICO')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_clients()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RECEPCIONISTA')
  );
$$;

-- Crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''),
    'RECEPCIONISTA'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Solo ADMIN puede cambiar roles / email de perfiles ajenos
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'No tienes permiso para cambiar el rol.';
    END IF;
    IF NEW.id <> auth.uid() THEN
      RAISE EXCEPTION 'No puedes modificar el perfil de otro usuario.';
    END IF;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  phone TEXT NOT NULL CHECK (char_length(trim(phone)) >= 8),
  email TEXT,
  address TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT clients_email_format CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

CREATE INDEX idx_clients_full_name ON public.clients(full_name);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX idx_clients_active ON public.clients(id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (char_length(trim(brand)) >= 1),
  model TEXT NOT NULL CHECK (char_length(trim(model)) >= 1),
  year INTEGER NOT NULL CHECK (year >= 1950 AND year <= EXTRACT(YEAR FROM timezone('utc', now()))::INTEGER + 1),
  color TEXT,
  mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  vin TEXT,
  photo_url TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT vehicles_plate_unique UNIQUE (plate)
);

CREATE OR REPLACE FUNCTION public.normalize_vehicle_plate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.plate := upper(regexp_replace(trim(NEW.plate), '\s+', '', 'g'));
  IF char_length(NEW.plate) < 3 THEN
    RAISE EXCEPTION 'La placa es obligatoria y debe tener al menos 3 caracteres.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_normalize_plate
  BEFORE INSERT OR UPDATE OF plate ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_vehicle_plate();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- work_orders
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  assigned_mechanic_id UUID REFERENCES public.profiles(id),
  reported_problem TEXT NOT NULL CHECK (char_length(trim(reported_problem)) >= 5),
  current_mileage INTEGER NOT NULL CHECK (current_mileage >= 0),
  status public.work_order_status NOT NULL DEFAULT 'RECEIVED',
  priority public.work_order_priority NOT NULL DEFAULT 'MEDIUM',
  estimated_delivery_date DATE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  internal_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE SEQUENCE public.work_order_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val BIGINT;
  year_val TEXT;
BEGIN
  IF NEW.order_number IS NULL OR trim(NEW.order_number) = '' THEN
    seq_val := nextval('public.work_order_seq');
    year_val := to_char(timezone('utc', now()), 'YYYY');
    NEW.order_number := 'OT-' || year_val || '-' || lpad(seq_val::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_work_orders_number
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_work_order_number();

CREATE TRIGGER trg_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_vehicle_id ON public.work_orders(vehicle_id);
CREATE INDEX idx_work_orders_client_id ON public.work_orders(client_id);
CREATE INDEX idx_work_orders_mechanic ON public.work_orders(assigned_mechanic_id);
CREATE INDEX idx_work_orders_created_at ON public.work_orders(created_at DESC);
CREATE INDEX idx_work_orders_order_number ON public.work_orders(order_number);

-- diagnostics
CREATE TABLE public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  general_notes TEXT,
  ai_summary TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_diagnostics_work_order_id ON public.diagnostics(work_order_id);

CREATE TRIGGER trg_diagnostics_updated_at
  BEFORE UPDATE ON public.diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.diagnostic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  component TEXT NOT NULL,
  status public.diagnostic_item_status NOT NULL DEFAULT 'OK',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_diagnostic_items_diagnostic_id ON public.diagnostic_items(diagnostic_id);

CREATE TRIGGER trg_diagnostic_items_updated_at
  BEFORE UPDATE ON public.diagnostic_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- evidence
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  diagnostic_id UUID REFERENCES public.diagnostics(id) ON DELETE SET NULL,
  type public.evidence_type NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_evidence_work_order_id ON public.evidence(work_order_id);
CREATE INDEX idx_evidence_diagnostic_id ON public.evidence(diagnostic_id);

-- services catalog
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  description TEXT,
  base_labor_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (base_labor_price >= 0),
  estimated_minutes INTEGER NOT NULL DEFAULT 30 CHECK (estimated_minutes > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_services_active ON public.services(active);
CREATE INDEX idx_services_name ON public.services(name);

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  status public.budget_status NOT NULL DEFAULT 'DRAFT',
  subtotal_parts NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal_parts >= 0),
  subtotal_labor NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal_labor >= 0),
  additional_costs NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (additional_costs >= 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  internal_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (internal_cost >= 0),
  estimated_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_budgets_work_order_id ON public.budgets(work_order_id);
CREATE INDEX idx_budgets_status ON public.budgets(status);

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  item_type public.budget_item_type NOT NULL,
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 1),
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION public.calculate_budget_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.subtotal := round(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_budget_items_subtotal
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_budget_item_subtotal();

CREATE TRIGGER trg_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_budget_items_budget_id ON public.budget_items(budget_id);

-- maintenance reminders
CREATE TABLE public.maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  last_service_date DATE,
  last_service_mileage INTEGER CHECK (last_service_mileage IS NULL OR last_service_mileage >= 0),
  next_service_date DATE,
  next_service_mileage INTEGER CHECK (next_service_mileage IS NULL OR next_service_mileage >= 0),
  status public.maintenance_reminder_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_maintenance_vehicle_id ON public.maintenance_reminders(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_reminders(status);

CREATE TRIGGER trg_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- internal notifications (arquitectura preparada)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
