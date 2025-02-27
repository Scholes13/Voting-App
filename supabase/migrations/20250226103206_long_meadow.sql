/*
  # Add admin user

  1. Changes
    - Create admin user with email admin@werkudara.com
    - Set up initial authentication for the admin user
*/

-- Create admin user if it doesn't exist
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
SELECT 
  gen_random_uuid(),
  'admin@werkudara.com',
  crypt('werkudara88', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@werkudara.com'
);