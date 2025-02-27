import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Group, 
  Calendar, 
  LogOut,
  FileBarChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          <li>
            <Link
              to="/admin"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/admin/employees"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin/employees') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Employees
            </Link>
          </li>
          <li>
            <Link
              to="/admin/departments"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin/departments') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Building2 className="h-5 w-5 mr-3" />
              Departments
            </Link>
          </li>
          <li>
            <Link
              to="/admin/groups"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin/groups') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Group className="h-5 w-5 mr-3" />
              Groups
            </Link>
          </li>
          <li>
            <Link
              to="/admin/schedules"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin/schedules') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Schedules
            </Link>
          </li>
          <li>
            <Link
              to="/admin/reports"
              className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive('/admin/reports') ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <FileBarChart className="h-5 w-5 mr-3" />
              Reports
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;