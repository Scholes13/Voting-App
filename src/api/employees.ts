import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const fetchEmployeeNames = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, department:departments(name)')
    .order('name');

  if (error) {
    console.error('Error fetching employee names:', error);
    return [];
  }

  return data || [];
};

export const submitVote = async (
  employee_id: string,
  schedule_id: string,
  rating: number
) => {
  try {
    const { error } = await supabase
      .from('votes')
      .insert([{ employee_id, schedule_id, rating }])
      .select();

    if (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
      throw error;
    } else {
      toast.success('Vote submitted successfully');
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    toast.error('Failed to submit vote');
    throw error;
  }
};
