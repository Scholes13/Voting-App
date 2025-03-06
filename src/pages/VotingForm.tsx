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
  group?: Group | null;
  group_id: string;
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
  const [error, setError] = useState<string | null>(null);
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

  // Fetch department for selected employee with better error handling
  const fetchDepartmentForEmployee = async (employeeId: string) => {
    if (!employeeId) return;
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('department:departments(name)')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error("Error fetching department:", error);
        toast.error("Failed to fetch department information");
        setDepartment('');
        return;
      }

      if (data?.department && typeof data.department === 'object' && data.department !== null && 'name' in data.department) {
        setDepartment(data.department.name as string);
      } else {
        setDepartment('Department not found');
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to fetch department information");
      setDepartment('');
    }
  };

  // Fetch all employees with retry logic
  const fetchEmployees = async (retryCount = 0) => {
    setFetchingEmployees(true);
    setError(null);
    
    try {
      const employees = await fetchEmployeeNames();
      
      if (!employees || !Array.isArray(employees)) {
        throw new Error("Invalid employee data received");
      }
      
      setEmployeeNames(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      
      if (retryCount < 3) {
        console.log(`Retrying employee fetch (${retryCount + 1}/3)...`);
        setTimeout(() => fetchEmployees(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setError("Failed to fetch employees after multiple attempts. Please refresh the page.");
        toast.error("Failed to fetch employees");
      }
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch today's scheduled group with better date handling
  const fetchTodayGroup = async () => {
    setLoading(true);
    
    try {
      // Format today's date in YYYY-MM-DD format for database query
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('schedules')
        .select('id, date, group_id, group:groups(id, name, theme)')
        .eq('date', todayFormatted)
        .maybeSingle();

      if (error) {
        console.error("Error fetching today's group:", error);
        toast.error("Failed to load today's group");
        return;
      }

      if (data && data.group) {
        // Proper handling of group data regardless of whether it's an array or object
        const group = Array.isArray(data.group) ? data.group[0] : data.group;
        setTodayGroup({
          ...data,
          group: group || null,
        });
      } else {
        setTodayGroup(data);
      }
    } catch (error) {
      console.error('Error fetching today\'s group:', error);
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

  // Handle rating change with validation
  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = Number(e.target.value);
    if (!isNaN(newRating) && newRating >= 1 && newRating <= 10) {
      setRating(newRating);
    }
  };

  // Handle form submission with improved validation and error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Prevent multiple submissions

    // Comprehensive validation checks
    if (!todayGroup) {
      toast.error('No group scheduled for today');
      return;
    }

    if (!todayGroup.group || !todayGroup.group.id) {
      toast.error('Group information is missing');
      return;
    }

    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (isNaN(rating) || rating < 1 || rating > 10) {
      toast.error('Please select a valid rating between 1 and 10');
      return;
    }

    setSubmitting(true);

    try {
      // Check for existing vote with improved error handling
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('employee_id', selectedEmployeeId)
        .eq('group_id', todayGroup.group.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing vote:", checkError);
        throw new Error('Failed to check existing votes');
      }

      if (existingVote) {
        toast.error('You have already voted for today\'s group.');
        setSubmitting(false);
        return;
      }

      // Submit the vote
      const { error: submitError } = await supabase
        .from('votes')
        .insert({
          employee_id: selectedEmployeeId,
          group_id: todayGroup.group.id,
          rating,
          created_at: new Date().toISOString() // Add timestamp for audit
        });

      if (submitError) {
        console.error("Error submitting vote:", submitError);
        throw new Error('Failed to submit vote');
      }

      toast.success('Vote submitted successfully');
      
      // Reset form
      setSelectedEmployeeId('');
      setDepartment('');
      setRating(5);
      
      // Navigate to thank you page
      navigate('/thankyou');
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  // Show error message if there's a critical error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-red-800 mb-3">Error</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner when fetching data
  if (loading || fetchingEmployees) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  // Show message when no group is scheduled for today
  if (!todayGroup || !todayGroup.group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 p-6 bg-white bg-opacity-80 rounded-lg">
          Silahkan tunggu penampilan selanjutnya
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url('/background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-md mx-auto mt-24">
        <div className="backdrop-blur-md bg-black/30 rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Voting Form</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-200">
                Today's Group: {todayGroup?.group?.name || 'No group today'}
              </h3>
              <p className="text-gray-400">Theme: {todayGroup?.group?.theme || 'No theme'}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-200">
                  Name
                </label>
                <select
                  id="employee"
                  value={selectedEmployeeId}
                  onChange={handleNameChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-700"
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
                <label htmlFor="department" className="block text-sm font-medium text-gray-200">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-700"
                />
              </div>
              <div>
                <p className="block text-sm text-gray-200 mb-2">
                  Berapakah Skor yang akan kamu berikan untuk keseluruhan penilaian baik dari rasa, plating, hosting, history, presentasi, sustainability, efisiensi budget dan nilai kepraktisan?
                </p>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-200">
                  Rating (1-10): <span className="font-semibold text-white">{rating}</span>
                </label>
                <input
                  id="rating"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rating}
                  onChange={handleRatingChange}
                  className="mt-1 block w-full"
                  disabled={submitting}
                />
                <div className="flex justify-between text-xs text-gray-400">
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
    </div>
  );
}

export default VotingForm;