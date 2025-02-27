import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  department_id: string;
  department?: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', department_id: '' });
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, department:departments(name)')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name || !newEmployee.department_id) {
        toast.error('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('employees')
        .insert({
          name: newEmployee.name,
          department_id: newEmployee.department_id
        });

      if (error) throw error;

      toast.success('Employee added successfully');
      setNewEmployee({ name: '', department_id: '' });
      setIsAdding(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleEditEmployee = async () => {
    try {
      if (!editEmployee || !editEmployee.name || !editEmployee.department_id) {
        toast.error('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('employees')
        .update({
          name: editEmployee.name,
          department_id: editEmployee.department_id
        })
        .eq('id', editEmployee.id);

      if (error) throw error;

      toast.success('Employee updated successfully');
      setIsEditing(null);
      setEditEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this employee?')) return;

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const startEditing = (employee: Employee) => {
    setIsEditing(employee.id);
    setEditEmployee({ ...employee });
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
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Add Employee Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Employee</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Employee Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={newEmployee.department_id}
                onChange={(e) => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
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
              onClick={handleAddEmployee}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Employee
            </button>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === employee.id ? (
                    <input
                      type="text"
                      value={editEmployee?.name || ''}
                      onChange={(e) => setEditEmployee({ ...editEmployee!, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing === employee.id ? (
                    <select
                      value={editEmployee?.department_id || ''}
                      onChange={(e) => setEditEmployee({ ...editEmployee!, department_id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500">{employee.department?.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isEditing === employee.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(null);
                          setEditEmployee(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleEditEmployee}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEditing(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Employees;