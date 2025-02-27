/*
  # Fix admin policies

  1. Changes
    - Update RLS policies to properly handle admin operations
    - Add policies for authenticated users to manage all tables
    - Remove previous admin policies that weren't working correctly

  2. Security
    - Ensure authenticated users (admins) have full access
    - Maintain public read access where needed
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Allow admin all on departments" ON departments;
DROP POLICY IF EXISTS "Allow admin all on employees" ON employees;
DROP POLICY IF EXISTS "Allow admin all on groups" ON groups;
DROP POLICY IF EXISTS "Allow admin all on schedules" ON schedules;

-- Create new admin policies for departments
CREATE POLICY "Enable full access for authenticated users" ON departments
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create new admin policies for employees
CREATE POLICY "Enable full access for authenticated users" ON employees
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create new admin policies for groups
CREATE POLICY "Enable full access for authenticated users" ON groups
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create new admin policies for schedules
CREATE POLICY "Enable full access for authenticated users" ON schedules
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create new admin policies for votes
CREATE POLICY "Enable full access for authenticated users" ON votes
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);