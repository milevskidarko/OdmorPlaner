-- Add company field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company TEXT;

-- Update existing profiles to have a default company if needed
-- UPDATE profiles SET company = 'Default Company' WHERE company IS NULL;
