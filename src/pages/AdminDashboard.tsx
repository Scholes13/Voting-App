import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

interface Schedule {
  id: string;
  date: string;
  group: Group;
}

function AdminDashboard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [newEmployee, setNewEmployee] = useState({ name: '', departmentId: '' });
  const [newDepartment, setNewDepartment] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', theme: '' });
  const [newSchedule, setNewSchedule] = useState({ groupId: '', date: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [depsData, groupsData, schedulesData] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('groups').select('*'),
      supabase.from('schedules').select('*, group:groups(*)')
    ]);

    if (depsData.data) setDepartments(depsData.data);
    if (groupsData.data) setGroups(groupsData.data);
    if (schedulesData.data) setSchedules(schedulesData.data);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('departments')
      .insert({ name: newDepartment });

    if (error) {
      toast.error('Failed to add department');
      return;
    }

    toast.success('Department added successfully');
    setNewDepartment('');
    fetchData();
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('employees')
      .insert({
        name: newEmployee.name,
        department_id: newEmployee.departmentId
      });

    if (error) {
      toast.error('Failed to add employee');
      return;
    }

    toast.success('Employee added successfully');
    setNewEmployee({ name: '', departmentId: '' });
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('groups')
      .insert(newGroup);

    if (error) {
      toast.error('Failed to add group');
      return;
    }

    toast.success('Group added successfully');
    setNewGroup({ name: '', theme: '' });
    fetchData();
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('schedules')
      .insert({
        group_id: newSchedule.groupId,
        date: newSchedule.date
      });

    if (error) {
      toast.error('Failed to add schedule');
      return;
    }

    toast.success('Schedule added successfully');
    setNewSchedule({ groupId: '', date: '' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add Department */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Department</h3>
                <form onSubmit={handleAddDepartment} className="space-y-4">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Department Name"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Department
                  </button>
                </form>
              </div>

              {/* Add Employee */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Employee</h3>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="Employee Name"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={newEmployee.departmentId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Employee
                  </button>
                </form>
              </div>

              {/* Add Group */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Group</h3>
                <form onSubmit={handleAddGroup} className="space-y-4">
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Group Name"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={newGroup.theme}
                    onChange={(e) => setNewGroup({ ...newGroup, theme: e.target.value })}
                    placeholder="Theme"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Group
                  </button>
                </form>
              </div>

              {/* Add Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Schedule</h3>
                <form onSubmit={handleAddSchedule} className="space-y-4">
                  <select
                    value={newSchedule.groupId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, groupId: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Schedule
                  </button>
                </form>
              </div>
            </div>

            {/* Schedules List */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Scheduled Groups</h3>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{schedule.group.name}</div>
                      <div className="text-sm text-gray-500">
                        Theme: {schedule.group.theme}
                      </div>
                    </div>
                    <div className="text-gray-600">
                      {format(new Date(schedule.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;