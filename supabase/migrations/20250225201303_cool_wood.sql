/*
  # Initial Schema for Real-time Voting System

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `employees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `department_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `theme` (text)
      - `created_at` (timestamp)
    
    - `schedules`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `votes`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `group_id` (uuid, foreign key)
      - `rating` (integer)
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public and authenticated access
*/

-- Create departments table
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id),
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  theme text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create schedules table
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  group_id uuid REFERENCES groups(id),
  rating integer CHECK (rating >= 1 AND rating <= 10),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Allow public insert votes" ON votes
  FOR INSERT TO public WITH CHECK (true);

-- Admin policies (will be restricted by Supabase auth in the frontend)
CREATE POLICY "Allow admin all on departments" ON departments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin all on employees" ON employees
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin all on groups" ON groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin all on schedules" ON schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);