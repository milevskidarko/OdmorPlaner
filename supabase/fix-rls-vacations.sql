-- Fix RLS policies for vacations table
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own vacations" ON vacations;
DROP POLICY IF EXISTS "Users can insert own vacations" ON vacations;
DROP POLICY IF EXISTS "Users can update own pending vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can view all vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can update all vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can delete vacations" ON vacations;

-- Ensure is_admin function exists (from fix-rls-profiles.sql)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vacations policies
-- Users can view their own vacations
CREATE POLICY "Users can view own vacations"
  ON vacations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vacations
CREATE POLICY "Users can insert own vacations"
  ON vacations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending vacations
CREATE POLICY "Users can update own pending vacations"
  ON vacations FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all vacations (using function to avoid recursion)
CREATE POLICY "Admins can view all vacations"
  ON vacations FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all vacations
CREATE POLICY "Admins can update all vacations"
  ON vacations FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete vacations
CREATE POLICY "Admins can delete vacations"
  ON vacations FOR DELETE
  USING (public.is_admin(auth.uid()));
