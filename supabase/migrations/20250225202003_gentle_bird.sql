/*
  # Add initial test data

  1. Test Data
    - Add a test department
    - Add test employees
    - Add a test group
    - Add today's schedule
*/

-- Add test department
INSERT INTO departments (name)
VALUES ('IT Department')
ON CONFLICT (name) DO NOTHING;

-- Add test employees
WITH dept AS (
  SELECT id FROM departments WHERE name = 'IT Department'
)
INSERT INTO employees (name, department_id)
VALUES 
  ('John Doe', (SELECT id FROM dept)),
  ('Jane Smith', (SELECT id FROM dept))
ON CONFLICT DO NOTHING;

-- Add test group
INSERT INTO groups (name, theme)
VALUES ('Group A', 'Indonesian Traditional Food')
ON CONFLICT DO NOTHING;

-- Add today's schedule
WITH test_group AS (
  SELECT id FROM groups WHERE name = 'Group A'
)
INSERT INTO schedules (group_id, date)
VALUES (
  (SELECT id FROM test_group),
  CURRENT_DATE
)
ON CONFLICT DO NOTHING;