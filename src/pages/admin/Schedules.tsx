import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Schedule {
  id: string;
  date: string;
  group_id: string;
  group?: {
    id: string;
    name: string;
    theme: string;
  };
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState({ group_id: '', date: '' });
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchGroups();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, group:groups(*)')
        .order('date', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    }
  };

  const handleAddSchedule = async () => {
    try {
      if (!newSchedule.group_id || !newSchedule.date) {
        toast.error('Please fill in all fields');
        return;
      }

      // Check if there's already a schedule for this date
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('date', newSchedule.date)
        .maybeSingle();

      if (existingSchedule) {
        toast.error('There is already a schedule for this date');
        return;
      }

      const { error } = await supabase
        .from('schedules')
        .insert({
          group_id: newSchedule.group_id,
          date: newSchedule.date
        });

      if (error) throw error;

      toast.success('Schedule added successfully');
      setNewSchedule({ group_id: '', date: '' });
      setIsAdding(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  };

  const handleEditSchedule = async () => {
    try {
      if (!editSchedule || !editSchedule.group_id || !editSchedule.date) {
        toast.error('Please fill in all fields');
        return;
      }

      // Check if there's already a schedule for this date (excluding the current one)
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('date', editSchedule.date)
        .neq('id', editSchedule.id)
        .maybeSingle();

      if (existingSchedule) {
        toast.error('There is already a schedule for this date');
        return;
      }

      const { error } = await supabase
        .from('schedules')
        .update({
          group_id: editSchedule.group_id,
          date: editSchedule.date
        })
        .eq('id', editSchedule.id);

      if (error) throw error;

      toast.success('Schedule updated successfully');
      setIsEditing(null);
      setEditSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this schedule?')) return;

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const startEditing = (schedule: Schedule) => {
    setIsEditing(schedule.id);
    setEditSchedule({ ...schedule });
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Add Schedule Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Schedule</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select
                value={newSchedule.group_id}
                onChange={(e) => setNewSchedule({ ...newSchedule, group_id: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="mr-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Schedule
            </button>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Theme
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === schedule.id ? (
                    <input
                      type="date"
                      value={editSchedule?.date || ''}
                      onChange={(e) => setEditSchedule({ ...editSchedule!, date: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(schedule.date), 'MMM d, yyyy')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === schedule.id ? (
                    <select
                      value={editSchedule?.group_id || ''}
                      onChange={(e) => setEditSchedule({ ...editSchedule!, group_id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{schedule.group?.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{schedule.group?.theme}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isEditing === schedule.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(null);
                          setEditSchedule(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleEditSchedule}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEditing(schedule)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No schedules found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Schedules;