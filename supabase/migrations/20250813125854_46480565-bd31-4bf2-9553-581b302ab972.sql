-- Fix security warning: Set search_path for function
alter function public.update_updated_at_column() set search_path = public;