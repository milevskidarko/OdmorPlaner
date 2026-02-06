-- Fix profile reading by creating a SECURITY DEFINER function
-- This bypasses RLS issues when auth.uid() is not available in server components

-- Function to get user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  "position" TEXT,
  company TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p."position",
    p.company,
    p.created_at
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
