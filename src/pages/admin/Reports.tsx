import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { BarChart, FileText, Download } from 'lucide-react';

interface GroupRating {
  group_id: string;
  group_name: string;
  average_rating: number;
  vote_count: number;
}

interface VoteDetail {
  id: string;
  rating: number;
  description: string;
  created_at: string;
  employee: {
    name: string;
  };
  group: {
    name: string;
    theme: string;
  };
}

function Reports() {
  const [groupRatings, setGroupRatings] = useState<GroupRating[]>([]);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupRatings();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchVoteDetails(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchGroupRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          group:groups(id, name),
          rating
        `);

      if (error) throw error;

      // Process data to calculate average ratings by group
      const groupMap = new Map<string, { sum: number; count: number; name: string }>();
      
      data.forEach((vote) => {
        const groupId = vote.group.id;
        const groupName = vote.group.name;
        const rating = vote.rating;
        
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, { sum: 0, count: 0, name: groupName });
        }
        
        const group = groupMap.get(groupId)!;
        group.sum += rating;
        group.count += 1;
      });
      
      const ratings = Array.from(groupMap.entries()).map(([groupId, { sum, count, name }]) => ({
        group_id: groupId,
        group_name: name,
        average_rating: sum / count,
        vote_count: count
      }));
      
      setGroupRatings(ratings);
      setLoading(false);
      
      // Select the first group by default if available
      if (ratings.length > 0 && !selectedGroup) {
        setSelectedGroup(ratings[0].group_id);
      }
    } catch (error) {
      console.error('Error fetching group ratings:', error);
      setLoading(false);
    }
  };

  const fetchVoteDetails = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          rating,
          description,
          created_at,
          employee:employees(name),
          group:groups(name, theme)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoteDetails(data || []);
    } catch (error) {
      console.error('Error fetching vote details:', error);
    }
  };

  const exportToCSV = (groupId: string | null) => {
    // If no group is selected, export all groups
    if (!groupId) {
      exportAllGroupsToCSV();
      return;
    }

    // Export specific group data
    const selectedGroupData = groupRatings.find(g => g.group_id === groupId);
    const groupName = selectedGroupData?.group_name || 'Unknown Group';
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Employee Name,Rating,Date,Description\n";
    
    // Data rows
    voteDetails.forEach(vote => {
      const formattedDate = format(new Date(vote.created_at), 'yyyy-MM-dd HH:mm:ss');
      // Escape quotes in description
      const safeDescription = vote.description ? `"${vote.description.replace(/"/g, '""')}"` : "";
      csvContent += `${vote.employee.name},${vote.rating},${formattedDate},${safeDescription}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${groupName}_Ratings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllGroupsToCSV = async () => {
    try {
      // Fetch all votes with details
      const { data, error } = await supabase
        .from('votes')
        .select(`
          rating,
          description,
          created_at,
          employee:employees(name),
          group:groups(name, theme)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += "Group Name,Group Theme,Employee Name,Rating,Date,Description\n";
      
      // Data rows
      data.forEach(vote => {
        const formattedDate = format(new Date(vote.created_at), 'yyyy-MM-dd HH:mm:ss');
        // Escape quotes in description
        const safeDescription = vote.description ? `"${vote.description.replace(/"/g, '""')}"` : "";
        csvContent += `${vote.group.name},${vote.group.theme},${vote.employee.name},${vote.rating},${formattedDate},${safeDescription}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `All_Groups_Ratings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting all groups data:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => exportToCSV(selectedGroup)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected Group
          </button>
          <button
            onClick={() => exportAllGroupsToCSV()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Groups
          </button>
        </div>
      </div>
      
      {/* Group Ratings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Group Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupRatings.map((group) => (
              <div 
                key={group.group_id}
                className={`bg-gray-50 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedGroup === group.group_id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedGroup(group.group_id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{group.group_name}</h3>
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-gray-500">{group.vote_count} votes</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-blue-600">
                    {group.average_rating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
              </div>
            ))}
            {groupRatings.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-8">
                No ratings data available
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Vote Details */}
      {selectedGroup && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Vote Details</h2>
            <button
              onClick={() => exportToCSV(selectedGroup)}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {voteDetails.length > 0 ? (
              voteDetails.map((vote) => (
                <div key={vote.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{vote.employee.name}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(vote.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
                      Rating: {vote.rating}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-700">
                      {vote.description || <span className="text-gray-400 italic">No description provided</span>}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No vote details available for this group
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;