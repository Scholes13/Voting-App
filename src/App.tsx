import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import VotingForm from './pages/VotingForm';
import LiveVoting from './pages/LiveVoting';
import VotedList from './pages/VotedList';
import PendingVotes from './pages/PendingVotes';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Departments from './pages/admin/Departments';
import Groups from './pages/admin/Groups';
import Schedules from './pages/admin/Schedules';
import Reports from './pages/admin/Reports';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<VotingForm />} />
          <Route path="/live" element={<LiveVoting />} />
          <Route path="/voted" element={<VotedList />} />
          <Route path="/pending" element={<PendingVotes />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="departments" element={<Departments />} />
              <Route path="groups" element={<Groups />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;