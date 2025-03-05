import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Employee {
  name: string;
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

function PendingVotes() {
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayGroup, setTodayGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchTodayGroup();
  }, []);

  useEffect(() => {
    if (todayGroup) {
      fetchPendingEmployees(todayGroup.id);
    }
  }, [todayGroup]);

  const fetchTodayGroup = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('schedules')
        .select('group:groups(*)')
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today\'s group:', error);
        return;
      }

      if (data?.group) {
        setTodayGroup(data.group);
      } else {
        setTodayGroup(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchPendingEmployees = async (groupId: string) => {
    try {
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
        .eq('group_id', groupId);

      if (votedError) {
        console.error('Error fetching voted employees:', votedError);
        return;
      }

      // Filter out employees who have already voted
      const votedNames = new Set(votedEmployees.map(v => v.employee.name));
      const pending = allEmployees.filter(emp => !votedNames.has(emp.name));

      setPendingEmployees(pending);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('votes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'votes'
      }, (payload) => {
        fetchPendingEmployees(todayGroup?.id || '');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  useEffect(() => {
    if (todayGroup) {
      setupRealtimeSubscription();
    }
    return () => {
      setupRealtimeSubscription()();
    };
  }, [todayGroup]);


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