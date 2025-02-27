import { supabase } from '../lib/supabase';

export const fetchEmployeeNames = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching employee names:', error);
    return [];
  }

  return data || [];
};