-- Fix profile insertion for registration
-- This ensures users can create their profile during registration

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public insert for new users" ON profiles;

-- Recreate the policy to allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update the trigger function to include company field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::TEXT,
    COALESCE(NEW.raw_user_meta_data->>'company', NULL)::TEXT
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    company = COALESCE(EXCLUDED.company, profiles.company);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
