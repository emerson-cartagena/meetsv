-- Add full_name column to users table
ALTER TABLE public.users
ADD COLUMN full_name text;
