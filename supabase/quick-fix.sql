-- Quick fix: Temporarily disable RLS to test login
-- WARNING: This is only for testing! Re-enable RLS after fixing policies.

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public insert for new users" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own vacations" ON vacations;
DROP POLICY IF EXISTS "Users can insert own vacations" ON vacations;
DROP POLICY IF EXISTS "Users can update own pending vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can view all vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can update all vacations" ON vacations;
DROP POLICY IF EXISTS "Admins can delete vacations" ON vacations;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create function to check if user is admin (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies (using function to avoid recursion)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Allow users to insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Vacations policies
CREATE POLICY "Users can view own vacations"
  ON vacations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vacations"
  ON vacations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending vacations"
  ON vacations FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacations"
  ON vacations FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all vacations"
  ON vacations FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete vacations"
  ON vacations FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
