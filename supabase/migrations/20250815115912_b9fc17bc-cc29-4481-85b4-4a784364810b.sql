-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for access status
CREATE TYPE public.access_status AS ENUM ('allowed', 'blocked', 'pending');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create access_control table for whitelist/blacklist
CREATE TABLE public.access_control (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status access_status NOT NULL DEFAULT 'allowed',
  reason text,
  controlled_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create access_logs table for tracking user activity
CREATE TABLE public.access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource text,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create function to check access control
CREATE OR REPLACE FUNCTION public.check_user_access(_user_id uuid)
RETURNS access_status
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.access_control WHERE user_id = _user_id),
    'allowed'::access_status
  );
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for access_control
CREATE POLICY "Admins can manage access control" 
ON public.access_control 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own access status" 
ON public.access_control 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for access_logs
CREATE POLICY "Admins can view all access logs" 
ON public.access_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own access logs" 
ON public.access_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert access logs" 
ON public.access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_access_control_updated_at
  BEFORE UPDATE ON public.access_control
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin role for first user (you'll need to update this with actual user ID)
-- This will be handled in the application

-- Enable realtime for tables
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.access_control REPLICA IDENTITY FULL;
ALTER TABLE public.access_logs REPLICA IDENTITY FULL;
ALTER TABLE public.media REPLICA IDENTITY FULL;
ALTER TABLE public.shares REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.user_roles;
ALTER publication supabase_realtime ADD TABLE public.access_control;
ALTER publication supabase_realtime ADD TABLE public.access_logs;
ALTER publication supabase_realtime ADD TABLE public.media;
ALTER publication supabase_realtime ADD TABLE public.shares;
ALTER publication supabase_realtime ADD TABLE public.profiles;