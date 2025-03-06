import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { fetchEmployeeNames } from '../api/employees';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  department: any;
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

interface Schedule {
  id: string;
  date: string;
  group?: Group;
  group_id: string; // Changed from groups_id to match the query
}

function VotingForm() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeNames, setEmployeeNames] = useState<Employee[]>([]);
  const [department, setDepartment] = useState('');
  const [rating, setRating] = useState(5);
  const [todayGroup, setTodayGroup] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch today's group on initial load
  useEffect(() => {
    fetchTodayGroup();
  }, []);

  // Fetch employees on initial load
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch department when employee selection changes
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchDepartmentForEmployee(selectedEmployeeId);
    } else {
      setDepartment('');
    }
  }, [selectedEmployeeId]);

  // Fetch department for selected employee
  const fetchDepartmentForEmployee = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('department:departments(name)')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error("Error fetching department:", error);
        toast.error("Failed to fetch department information");
        return;
      }

      if (data?.department && typeof data.department === 'object' && 'name' in data.department) {
        setDepartment(data.department.name as string);
      } else {
        setDepartment('');
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to fetch department information");
    }
  };

  // Fetch all employees
  const fetchEmployees = async () => {
    setFetchingEmployees(true);
    try {
      const employees = await fetchEmployeeNames();
      setEmployeeNames(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch today's scheduled group
  const fetchTodayGroup = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('schedules')
        .select('id, date, group_id, group:groups(id, name, theme)')
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today\'s group:', error);
        toast.error('Failed to load today\'s group');
        return;
      }

      setTodayGroup(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection change
  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmployeeId = e.target.value;
    setSelectedEmployeeId(newEmployeeId);
  };

  // Handle rating change
  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRating(Number(e.target.value));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Prevent multiple submissions

    // Validation checks
    if (!todayGroup?.group?.id) {
      toast.error('No group scheduled for today');
      return;
    }

    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    setSubmitting(true);

    try {
      // Check for existing vote
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('employee_id', selectedEmployeeId)
        .eq('group_id', todayGroup.group.id)
        .maybeSingle();

      if (checkError) {
        throw new Error('Failed to check existing votes');
      }

      if (existingVote) {
        toast.error('You have already voted for today\'s group.');
        return;
      }

      const { error: submitError } = await supabase
        .from('votes')
        .insert({
          employee_id: selectedEmployeeId,
          group_id: todayGroup.group.id,
          rating
        });

      if (submitError) {
        throw new Error('Failed to submit vote');
      }

      toast.success('Vote submitted successfully');
      setSelectedEmployeeId('');
      setDepartment('');
      setRating(5);
      navigate('/thankyou');
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading spinner when fetching data
  if (loading || fetchingEmployees) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show message when no group is scheduled for today
  if (!todayGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">
          Silahkan tunggu penampilan selanjutnya
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Voting Form
          </h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Today's Group: {todayGroup?.group?.name || 'No group today'}
            </h3>
            <p className="text-gray-600">Theme: {todayGroup?.group?.theme || 'No theme'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <select
                id="employee"
                value={selectedEmployeeId}
                onChange={handleNameChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={submitting}
              >
                <option value="">Select an Employee</option>
                {employeeNames.map((employee: Employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>
            <div>
              <p className="block text-sm text-gray-700 mb-2">
                Berapakah Skor yang akan kamu berikan untuk keseluruhan penilaian baik dari rasa, plating, hosting, history, presentasi, sustainability, efisiensi budget dan nilai kepraktisan?
              </p>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                Rating (1-10): <span className="font-semibold">{rating}</span>
              </label>
              <input
                id="rating"
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={handleRatingChange}
                className="mt-1 block w-full"
                disabled={submitting}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {submitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VotingForm;