import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchTodayGroup();
    setupRealtimeSubscription();
  }, []);

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

      if (data) {
        setTodayGroup(data.group);
        fetchVotes(data.group.id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchVotes = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id, rating, employee:employees(name)')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }

      setVotes(data || []);
    } catch (error) {
      console.error('Error:', error);
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
        const newVote = payload.new as Vote;
        toast.success(`Terimakasih ${newVote.employee?.name} telah memberikan nilai!`);
        fetchVotes(todayGroup?.id || '');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
            <div className="mb-8 text-center">
              <div className="text-4xl font-bold text-blue-600">
                {averageRating}
              </div>
              <div className="text-gray-600">Average Rating</div>
              <div className="mt-2 text-sm text-gray-500">
                Total Votes: {votes.length}
              </div>
            </div>
            <div className="space-y-4">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="text-gray-700">{vote.employee.name}</div>
                  <div className="text-blue-600 font-semibold">
                    Rating: {vote.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveVoting;