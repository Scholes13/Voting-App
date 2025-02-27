import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  theme: string;
}

function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', theme: '' });
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    try {
      if (!newGroup.name || !newGroup.theme) {
        toast.error('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('groups')
        .insert(newGroup);

      if (error) throw error;

      toast.success('Group added successfully');
      setNewGroup({ name: '', theme: '' });
      setIsAdding(false);
      fetchGroups();
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error('Failed to add group');
    }
  };

  const handleEditGroup = async () => {
    try {
      if (!editGroup || !editGroup.name || !editGroup.theme) {
        toast.error('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('groups')
        .update({
          name: editGroup.name,
          theme: editGroup.theme
        })
        .eq('id', editGroup.id);

      if (error) throw error;

      toast.success('Group updated successfully');
      setIsEditing(null);
      setEditGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this group?')) return;

      // Check if group has schedules
      const { count } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', id);

      if (count && count > 0) {
        toast.error('Cannot delete group with schedules');
        return;
      }

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const startEditing = (group: Group) => {
    setIsEditing(group.id);
    setEditGroup({ ...group });
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
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </button>
      </div>

      {/* Add Group Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Group</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Group Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <input
                type="text"
                value={newGroup.theme}
                onChange={(e) => setNewGroup({ ...newGroup, theme: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Theme"
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
              onClick={handleAddGroup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Group
            </button>
          </div>
        </div>
      )}

      {/* Groups Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
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
            {groups.map((group) => (
              <tr key={group.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === group.id ? (
                    <input
                      type="text"
                      value={editGroup?.name || ''}
                      onChange={(e) => setEditGroup({ ...editGroup!, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{group.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === group.id ? (
                    <input
                      type="text"
                      value={editGroup?.theme || ''}
                      onChange={(e) => setEditGroup({ ...editGroup!, theme: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{group.theme}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isEditing === group.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(null);
                          setEditGroup(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleEditGroup}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEditing(group)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No groups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Groups;