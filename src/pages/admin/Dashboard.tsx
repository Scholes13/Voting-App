import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { BarChart, Users, Building2, Group, Calendar } from 'lucide-react';

interface Stats {
  employeeCount: number;
  departmentCount: number;
  groupCount: number;
  scheduleCount: number;
  voteCount: number;
}

interface RecentVote {
  id: string;
  rating: number;
  created_at: string;
  employee: { name: string };
  group: { name: string };
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    employeeCount: 0,
    departmentCount: 0,
    groupCount: 0,
    scheduleCount: 0,
    voteCount: 0
  });
  const [recentVotes, setRecentVotes] = useState<RecentVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentVotes();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: employeeCount }, 
        { count: departmentCount }, 
        { count: groupCount }, 
        { count: scheduleCount },
        { count: voteCount }
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('schedules').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        employeeCount: employeeCount || 0,
        departmentCount: departmentCount || 0,
        groupCount: groupCount || 0,
        scheduleCount: scheduleCount || 0,
        voteCount: voteCount || 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchRecentVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id, rating, created_at, employee:employees(name), group:groups(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentVotes(data || []);
    } catch (error) {
      console.error('Error fetching recent votes:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Employees</p>
            <p className="text-2xl font-bold">{stats.employeeCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Departments</p>
            <p className="text-2xl font-bold">{stats.departmentCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <Group className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Groups</p>
            <p className="text-2xl font-bold">{stats.groupCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Schedules</p>
            <p className="text-2xl font-bold">{stats.scheduleCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <BarChart className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Votes</p>
            <p className="text-2xl font-bold">{stats.voteCount}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Votes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Votes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentVotes.length > 0 ? (
            recentVotes.map((vote) => (
              <div key={vote.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{vote.employee.name}</p>
                  <p className="text-sm text-gray-500">
                    Voted for {vote.group.name} on {format(new Date(vote.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
                  Rating: {vote.rating}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">No votes recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;