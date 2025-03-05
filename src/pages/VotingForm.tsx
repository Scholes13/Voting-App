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
  groups_id: string;
}

function VotingForm() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeNames, setEmployeeNames] = useState<Employee[]>([]);
  const [department, setDepartment] = useState('');
  const [rating, setRating] = useState(5);
  const [todayGroup, setTodayGroup] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
      fetchTodayGroup();
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchDepartmentForEmployee(selectedEmployeeId);
        } else {
            setDepartment('');
        }
    }, [selectedEmployeeId]);

    const fetchDepartmentForEmployee = async (employeeId: string) => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('department:departments(name)')
                .eq('id', employeeId)
                .single();

            if (error) {
                console.error("Error fetching department:", error);
                return;
            }

            if (data?.department && typeof data.department === 'object' && 'name' in data.department) {
                setDepartment(data.department.name as string);
            } else {
                setDepartment('');
            }
        } catch (error) {
            console.error("Error fetching department:", error);
        }
    };


    const fetchEmployees = async () => {
      try {
          const employees = await fetchEmployeeNames();
          setEmployeeNames(employees);
          setFetchingEmployees(false);
      } catch (error) {
          console.error("Error fetching employees:", error);
          toast.error("Failed to fetch employees");
          setFetchingEmployees(false);
      }
  }

  const fetchTodayGroup = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('schedules')
        .select('id, date, groups_id:group_id, group:groups(id, name, theme)')
        .eq('date', today)
        .maybeSingle<{ id: string; date: string; groups_id: string; group: Group }>();

      if (error) {
        console.error('Error fetching today\'s group:', error);
        return;
      }

      setTodayGroup(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmployeeId = e.target.value;
    setSelectedEmployeeId(newEmployeeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todayGroup) {
      toast.error('No group scheduled for today');
      return;
    }

    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('employee_id', selectedEmployeeId)
      .eq('group_id', todayGroup?.group?.id)
      .single();

    if (existingVote) {
      toast.error('You have already voted for today\'s group.');
      return;
    }

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          employee_id: selectedEmployeeId,
          group_id: todayGroup?.group?.id,
          rating,
        });
  
      if (error) {
        console.error("Error submitting vote:", error); // Log the error for debugging
        toast.error('Failed to submit vote');
        return;
      }
  
      toast.success('Vote submitted successfully');
      setSelectedEmployeeId('');
      setDepartment('');
      setRating(5);
      navigate('/thankyou'); // Redirect to ThankYouPage
    } catch (error) {
      console.error("Error submitting vote:", error); // Log the error for debugging
      toast.error('Failed to submit vote');
    }
  };

  if (loading || fetchingEmployees) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <select
                value={selectedEmployeeId}
                onChange={handleNameChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
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
              <label className="block text-sm font-medium text-gray-700">
                Rating (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRating(Number(e.target.value))}
                className="mt-1 block w-full"
              />
              <div className="text-center font-semibold">{rating}</div>
            </div>
            {/* Description field removed */}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit Vote
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VotingForm;
