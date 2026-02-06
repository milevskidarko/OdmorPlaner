-- Create a function to get vacations for a user (bypasses RLS)
-- This function uses SECURITY DEFINER to bypass RLS checks
CREATE OR REPLACE FUNCTION public.get_user_vacations(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  date_from DATE,
  date_to DATE,
  days_total INTEGER,
  comment TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.user_id,
    v.type,
    v.date_from,
    v.date_to,
    v.days_total,
    v.comment,
    v.status,
    v.created_at
  FROM public.vacations v
  WHERE v.user_id = target_user_id
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_vacations(UUID) TO authenticated;
