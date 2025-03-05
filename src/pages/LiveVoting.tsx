import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fetchEmployeeNames } from '../api/employees'; // Import fetchEmployeeNames

interface Vote {
  id: string;
  rating: number;
  employee: {
    name: string;
  };
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

function LiveVoting() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [todayGroup, setTodayGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeNames, setEmployeeNames] = useState<string[]>([]); // State for employee names
  const [isAnimating, setIsAnimating] = useState(false); // Animation state

  useEffect(() => {
    fetchTodayGroup();
    loadEmployeeNames(); // Load employee names on component mount
  }, []);

  const loadEmployeeNames = async () => {
    const names = await fetchEmployeeNames();
    setEmployeeNames(names.map(emp => emp.name)); // Extract names from fetched data
  };


  const fetchTodayGroup = async () => {
    const setupRealtimeSubscription = (groupId: string) => {
      const subscription = supabase
        .channel('votes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        }, async (payload) => { // Make the callback async
          const newVote = payload.new as Vote;

          if (!payload.new.employee_id) {
            console.warn("employee_id is undefined in payload.new:", payload.new);
            toast.success(`Terimakasih telah memberikan nilai!`);
            fetchVotes(groupId);
            return;
          }
          const employeeId = payload.new.employee_id;

          console.log("employeeId before query:", employeeId); // Log employeeId

          // Fetch employee details to get the name - Using .single() again
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('name')
            .eq('id', payload.new.employee_id as string) // Use payload.new.employee_id
            .single(); // Using .single()

          console.log("employeeData after query:", employeeData); // Log employeeData
          console.log("employeeError after query:", employeeError); // Log employeeError

          if (employeeError) {
            console.error('Error fetching employee name:', employeeError);
            toast.success(`Terimakasih telah memberikan nilai!`); // Display generic message if name fetch fails
            fetchVotes(groupId);
            return;
          }

          const employeeName = employeeData?.name || 'Unknown Employee'; // Access name from employeeData.name
          toast.success(`Terimakasih ${employeeName} telah memberikan nilai!`);
          fetchVotes(groupId);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('schedules')
        .select('group:groups(id, name, theme)')
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today\'s group:', error);
        return;
      }

      if (data?.group) {
        setTodayGroup(data.group as Group); // Explicitly cast to Group
        if (data.group.id) {
          fetchVotes(data.group.id);
          setupRealtimeSubscription(data.group.id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchVotes = async (groupId: string) => {
    if (!groupId || groupId === '') { // Check if groupId is empty or invalid
      console.warn("Invalid groupId provided to fetchVotes:", groupId);
      return; // Return early if groupId is invalid
    }
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id, rating, employee:employees(name)')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }

      setVotes(data as Vote[] || []); // Explicitly cast to Vote[]
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!todayGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">
          Silahkan tunggu penampilan selanjutnya
        </div>
      </div>
    );
  }

  const averageRating = votes.length > 0
    ? (votes.reduce((acc, vote) => acc + vote.rating, 0) / votes.length).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="tetris-background grid grid-cols-5 gap-2"> {/* Tetris background moved here */}
        {employeeNames.map((name, index) => (
          <motion.div
            key={index}
            className="tetris-block bg-gray-400 p-2 rounded text-center"
            animate={isAnimating && index === 0 ? { y: 300 } : { y: 0 }} // Animate first block if isAnimating
            transition={{ duration: 1, type: "spring", stiffness: 50 }} // Example transition
            onAnimationComplete={() => { if (index === 0) setIsAnimating(false); }} // Reset animation state
          >
            {name}
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Live Voting Results
            </h2>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700">
                {todayGroup.name}
              </h3>
              <p className="text-gray-600">Theme: {todayGroup.theme}</p>
            </div>
            <motion.div // Use motion.div for animation
              className="mb-8 text-center"
              animate={{ scale: 1.2 }} // Example animation: scale up
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <div className="text-4xl font-bold text-blue-600">
                {averageRating}
              </div>
              <div className="text-gray-600">Average Rating</div>
              <div className="mt-2 text-sm text-gray-500">
                Total Votes: {votes.length}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveVoting;