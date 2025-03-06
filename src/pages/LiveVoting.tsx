import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { fetchEmployeeNames } from "../api/employees";
import CountUp from "../components/CountUp";

interface Employee {
  id: string;
  name: string;
}

interface Vote {
  id: string;
  rating: number;
  employee_id?: string;
  employee: {
    name: string;
  };
}

interface Group {
  id: string;
  name: string;
  theme: string;
}

interface ScheduleWithGroup {
  group: Group;
}

function LiveVoting() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [todayGroup, setTodayGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeNames, setEmployeeNames] = useState<Employee[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [previousVoteCount, setPreviousVoteCount] = useState(0);
  const prevAverageRef = useRef("0.0");
  const [isRatingIncreasing, setIsRatingIncreasing] = useState(true);
  const [suspenseMode, setSuspenseMode] = useState(false);
  const [suspenseTimerId, setSuspenseTimerId] = useState<number | null>(null);
  const [newVoteName, setNewVoteName] = useState<string | null>(null);

  // Calculate average rating with useMemo
  const averageRating = useMemo(() => {
    return votes.length > 0
      ? (votes.reduce((acc, vote) => acc + vote.rating, 0) / votes.length).toFixed(1)
      : "0.0";
  }, [votes]);

  // Detect rating direction change (up or down)
  useEffect(() => {
    if (votes.length > 0 && prevAverageRef.current !== "0.0") {
      setIsRatingIncreasing(parseFloat(averageRating) >= parseFloat(prevAverageRef.current));
    }
    
    // Only update previous average after comparing
    if (votes.length > 0) {
      prevAverageRef.current = averageRating;
    }
  }, [averageRating, votes.length]);

  // Fetch employee names
  const loadEmployeeNames = useCallback(async () => {
    try {
      const employees = await fetchEmployeeNames();
      setEmployeeNames(employees);
    } catch (error) {
      console.error("Error loading employee names:", error);
    }
  }, []);

  // Fetch votes for a specific group
  const fetchVotes = useCallback(async (groupId: string) => {
    if (!groupId) {
      console.warn("Invalid groupId provided to fetchVotes");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id, rating, employee_id, employee:employees(name)")
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching votes:", error);
        return;
      }

      // Capture previous vote count to determine if we need to animate
      const prevCount = votes.length;

      // Map the result to the correct Vote[] type
      const mappedVotes: Vote[] = (data || []).map((item: any) => ({
        id: item.id,
        rating: item.rating,
        employee_id: item.employee_id,
        employee: {
          name: item.employee?.name || "Unknown"
        }
      }));

      setVotes(mappedVotes);
      
      // If vote count has changed, trigger the animation
      if (prevCount !== mappedVotes.length) {
        setPreviousVoteCount(prevCount);
        setTriggerAnimation(prev => !prev); // Toggle to trigger animation
      }
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  }, [votes.length]);

  // Fetch today's group
  const fetchTodayGroup = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("schedules")
        .select("group:groups(id, name, theme)")
        .eq("date", today)
        .maybeSingle<ScheduleWithGroup>();

      if (error) {
        console.error("Error fetching today\'s group:", error);
        setLoading(false);
        return;
      }

      if (data?.group) {
        setTodayGroup(data.group);
        if (data.group.id) {
          fetchVotes(data.group.id);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  }, [fetchVotes]);

  // Start suspense animation (dramatic pause before revealing new rating)
  const startSuspenseAnimation = useCallback((employeeName: string) => {
    // Clear any existing timer
    if (suspenseTimerId !== null) {
      clearTimeout(suspenseTimerId);
    }

    setNewVoteName(employeeName);
    setSuspenseMode(true);
    
    // Set timer for suspense duration (3 seconds)
    const timerId = window.setTimeout(() => {
      setSuspenseMode(false);
      setIsAnimating(true);
      
      // Slight delay before clearing employee name
      setTimeout(() => {
        setNewVoteName(null);
      }, 2000);
    }, 3000);
    
    setSuspenseTimerId(timerId as unknown as number);
  }, [suspenseTimerId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!todayGroup?.id) return;

    const channel = supabase
      .channel("votes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "votes",
        filter: `group_id=eq.${todayGroup.id}`
      }, async (payload) => {
        try {
          const newVote = payload.new as any;
          
          if (!newVote.employee_id) {
            console.warn("employee_id is undefined in payload.new:", newVote);
            
            // Start suspense animation even without employee name
            startSuspenseAnimation("Anonymous");
            
            // Delay vote fetch to create suspense
            setTimeout(() => {
              fetchVotes(todayGroup.id);
            }, 3000);
            return;
          }

          // Fetch employee details to get the name
          const { data: employeeData, error: employeeError } = await supabase
            .from("employees")
            .select("name")
            .eq("id", newVote.employee_id)
            .single();

          let employeeName = "Anonymous";
          
          if (employeeError) {
            console.error("Error fetching employee name:", employeeError);
          } else {
            employeeName = employeeData?.name || "Anonymous";
          }
          
          // Start suspense animation
          startSuspenseAnimation(employeeName);
          
          // Delay vote fetch to create suspense
          setTimeout(() => {
            fetchVotes(todayGroup.id);
          }, 3000);
        } catch (error) {
          console.error("Error processing new vote:", error);
        }
      })
      .subscribe();

    // Cleanup subscription when component unmounts or group changes
    return () => {
      if (suspenseTimerId !== null) {
        clearTimeout(suspenseTimerId);
      }
      channel.unsubscribe();
    };
  }, [todayGroup, fetchVotes, startSuspenseAnimation, suspenseTimerId]);

  // Initialize component
  useEffect(() => {
    fetchTodayGroup();
    loadEmployeeNames();
  }, [fetchTodayGroup, loadEmployeeNames]);

  // Reset animation state after a short delay
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Calculate animation starting value
  const getFromValue = () => {
    // Jika tidak ada vote, mulai dari 0
    if (votes.length === 0) {
      return 0;
    }
    
    // Jika nilai turun, mulai dari nilai yang lebih tinggi
    if (!isRatingIncreasing) {
      return parseFloat(averageRating) + 0.5;
    }
    
    // Jika nilai naik (default), mulai dari nilai yang lebih rendah
    return parseFloat(averageRating) - 0.5;
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

  // Determine the animation class based on rating direction
  const getRatingClass = () => {
    if (votes.length <= 1) return "";
    return isRatingIncreasing ? "rating-up" : "rating-down";
  };

  // Generate random heartbeat values for suspense animation
  const getHeartbeatScale = () => {
    return suspenseMode ? [1, 1.1, 1, 1.08, 1, 1.06, 1] : [1];
  };

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url('/background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="tetris-background grid grid-cols-5 gap-2">
        {employeeNames.map((employee, index) => (
          <motion.div
            key={employee.id || index}
            className="tetris-block bg-gray-400 p-2 rounded text-center"
            animate={isAnimating && index === 0 ? { y: 300 } : { y: 0 }}
            transition={{ duration: 1, type: 'spring', stiffness: 50 }}
            onAnimationComplete={() => {
              if (index === 0) setIsAnimating(false);
            }}
          >
            {employee.name}
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-48">
        <div className="bg-transparent rounded-xl shadow-md overflow-hidden backdrop-filter backdrop-blur-lg">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Live Voting Results
            </h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200">
                {todayGroup.name}
              </h3>
              <p className="text-gray-400">Theme: {todayGroup.theme}</p>
            </div>

            {/* New vote notification */}
            <AnimatePresence>
              {newVoteName && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4 p-3 rounded-lg bg-yellow-500 bg-opacity-20 text-center"
                >
                  <p className="text-yellow-300 font-semibold">
                    {suspenseMode
                      ? `${newVoteName} just voted! Rating update in...`
                      : `${newVoteName}'s vote has been recorded!`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className={`mb-8 text-center ${getRatingClass()}`}
              animate={{
                scale: suspenseMode
                  ? getHeartbeatScale()
                  : isAnimating
                  ? [1, 1.1, 1]
                  : 1,
                y: !suspenseMode && isAnimating ? (isRatingIncreasing ? [-10, 0] : [10, 0]) : 0,
              }}
              transition={{
                duration: suspenseMode ? 2.5 : 0.5,
                repeat: suspenseMode ? Infinity : 0,
                repeatType: 'loop',
              }}
            >
              {suspenseMode ? (
                // Suspense animation with question marks
                <div className="relative">
                  <div className="text-4xl font-bold text-yellow-400 animate-pulse">??.?</div>
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-full flex items-center justify-center"
                    animate={{ opacity: [0, 0.7, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="text-4xl font-bold text-yellow-200 opacity-70">{averageRating}</div>
                  </motion.div>
                </div>
              ) : (
                // Normal rating display
                <div className={`text-4xl font-bold text-yellow-400`}>
                  {votes.length === 0 ? (
                    <span className="text-4xl font-bold">0.0</span>
                  ) : (
                    <CountUp
                      from={getFromValue()}
                      to={parseFloat(averageRating)}
                      duration={1.5}
                      className="text-4xl font-bold"
                      startWhen={triggerAnimation}
                      decimals={1}
                      direction={isRatingIncreasing ? 'up' : 'down'}
                    />
                  )}
                </div>
              )}
              <div className="text-gray-300 mt-2">Average Rating</div>
              <div className="mt-4 text-sm text-gray-400">
                Total Votes:
                {suspenseMode ? (
                  <span className="ml-2 font-bold animate-pulse">
                    {votes.length} <span className="text-yellow-300">+1</span>
                  </span>
                ) : votes.length === 0 ? (
                  <span className="ml-2 font-bold">0</span>
                ) : (
                  <CountUp
                    from={previousVoteCount}
                    to={votes.length}
                    duration={1}
                    className="ml-2 font-bold"
                    startWhen={triggerAnimation}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveVoting;