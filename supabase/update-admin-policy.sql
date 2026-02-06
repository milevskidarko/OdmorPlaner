-- Update admin policy to include WITH CHECK clause
-- This ensures admins can update vacation status

DROP POLICY IF EXISTS "Admins can update all vacations" ON vacations;

CREATE POLICY "Admins can update all vacations"
  ON vacations FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
