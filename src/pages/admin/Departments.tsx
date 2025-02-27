import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    try {
      if (!newDepartment) {
        toast.error('Please enter a department name');
        return;
      }

      const { error } = await supabase
        .from('departments')
        .insert({ name: newDepartment });

      if (error) throw error;

      toast.success('Department added successfully');
      setNewDepartment('');
      setIsAdding(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department');
    }
  };

  const handleEditDepartment = async () => {
    try {
      if (!editDepartment || !editDepartment.name) {
        toast.error('Please enter a department name');
        return;
      }

      const { error } = await supabase
        .from('departments')
        .update({ name: editDepartment.name })
        .eq('id', editDepartment.id);

      if (error) throw error;

      toast.success('Department updated successfully');
      setIsEditing(null);
      setEditDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this department?')) return;

      // Check if department has employees
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);

      if (count && count > 0) {
        toast.error('Cannot delete department with employees');
        return;
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const startEditing = (department: Department) => {
    setIsEditing(department.id);
    setEditDepartment({ ...department });
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
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Add Department Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Department</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Department Name"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="mr-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDepartment}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Department
            </button>
          </div>
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((department) => (
              <tr key={department.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === department.id ? (
                    <input
                      type="text"
                      value={editDepartment?.name || ''}
                      onChange={(e) => setEditDepartment({ ...editDepartment!, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{department.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isEditing === department.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(null);
                          setEditDepartment(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleEditDepartment}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEditing(department)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Departments;