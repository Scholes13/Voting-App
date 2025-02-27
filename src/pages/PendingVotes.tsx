import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Employee {
  name: string;
}

function PendingVotes() {
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEmployees();
  }, []);

  const fetchPendingEmployees = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all employees
    const { data: allEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('name');

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return;
    }

    // Get employees who have voted today
    const { data: votedEmployees, error: votedError } = await supabase
      .from('votes')
      .select('employee:employees(name)')
      .eq('created_at::date', today);

    if (votedError) {
      console.error('Error fetching voted employees:', votedError);
      return;
    }

    // Filter out employees who have already voted
    const votedNames = new Set(votedEmployees.map(v => v.employee.name));
    const pending = allEmployees.filter(emp => !votedNames.has(emp.name));

    setPendingEmployees(pending);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Employees Yet to Vote
            </h2>
            <div className="space-y-2">
              {pendingEmployees.map((employee, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="text-gray-700">{employee.name}</div>
                </div>
              ))}
            </div>
            {pendingEmployees.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                All employees have voted today!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingVotes;