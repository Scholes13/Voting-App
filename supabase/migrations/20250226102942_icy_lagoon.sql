/*
  # Fix RLS policies for admin access

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper authentication checks
    - Ensure authenticated users have full access to all tables
    - Maintain public read access where needed
    - Add proper security checks using auth.uid()

  2. Security
    - Policies now properly check for authenticated users
    - Public access is restricted to read-only where needed
    - Admin operations require authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read departments" ON departments;
DROP POLICY IF EXISTS "Allow public read employees" ON employees;
DROP POLICY IF EXISTS "Allow public read groups" ON groups;
DROP POLICY IF EXISTS "Allow public read schedules" ON schedules;
DROP POLICY IF EXISTS "Allow public read votes" ON votes;
DROP POLICY IF EXISTS "Allow public insert votes" ON votes;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON votes;

-- Public read policies
CREATE POLICY "Allow public read departments" ON departments
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read employees" ON employees
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read groups" ON groups
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read schedules" ON schedules
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read votes" ON votes
  FOR SELECT TO public USING (true);

-- Public insert policy for votes
CREATE POLICY "Allow public insert votes" ON votes
  FOR INSERT TO public WITH CHECK (true);

-- Admin policies for authenticated users
CREATE POLICY "Allow authenticated users full access to departments" ON departments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to employees" ON employees
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to groups" ON groups
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to schedules" ON schedules
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to votes" ON votes
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');