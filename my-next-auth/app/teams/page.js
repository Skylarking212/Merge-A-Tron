'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [openTeams, setOpenTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestSent, setRequestSent] = useState({});

  // Check if user is logged in and fetch teams
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data && data.session) {
        setIsLoggedIn(true);
        setUser(data.session.user);
        
        // Try to find the corresponding user in your User table
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('email', data.session.user.email);
        
        if (!userError && userData && userData.length > 0) {
          setDbUser(userData[0]);
        }
      }
    };
    
    const fetchTeams = async () => {
      try {
        console.log("Attempting to fetch teams from Supabase");
        
        // Fetch teams from the database
        const { data, error } = await supabase
          .from('Team')
          .select(`
            team_id,
            name,
            description,
            max_members,
            current_member_count,
            owner
          `)
          .eq('is_private', false);
        
        if (error) {
          console.error("Query error:", error);
          throw error;
        }
        
        console.log("Fetched teams:", data);
        
        // Also fetch existing join requests for the current user
        let userRequests = {};
        if (dbUser) {
          // Check for existing requests in the Requests table
          const { data: requestData, error: requestError } = await supabase
            .from('Requests')
            .select('team_id')
            .eq('requester_id', dbUser.user_id)
            .in('status', ['pending', 'accepted']);
          
          if (!requestError && requestData) {
            requestData.forEach(request => {
              userRequests[request.team_id] = true;
            });
          }
        }
        
        setRequestSent(userRequests);
        setOpenTeams(data || []);
      } catch (error) {
        console.error("Error fetching teams:", error);
        
        // Fallback data for development
        setOpenTeams([
          { team_id: 1, name: "Coding Cats", description: "Team members", current_member_count: 2, max_members: 5 },
          { team_id: 2, name: "The Wild Dogs", description: "Team members", current_member_count: 1, max_members: 5 },
          { team_id: 3, name: "The Perfectly Sane Hamsters", description: "Team members", current_member_count: 2, max_members: 5 },
          { team_id: 4, name: "Big Team Gang", description: "Team members", current_member_count: 1, max_members: 5 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
    // Fetch teams after getting user info
    setTimeout(() => {
      fetchTeams();
    }, 500);
  }, []);

  // Request to join a team
  const handleJoinRequest = async (teamId, ownerId) => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }
    
    try {
      if (!dbUser) {
        // Try to find the user in the database again
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('email', user.email);
        
        if (userError || !userData || userData.length === 0) {
          // If user doesn't exist, create one
          const { data: newUser, error: createError } = await supabase
            .from('User')
            .insert([{
              email: user.email,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || ''
            }])
            .select();
          
          if (createError || !newUser || newUser.length === 0) {
            console.error("Failed to create user:", createError);
            alert("Failed to send join request. Please try again.");
            return;
          }
          
          setDbUser(newUser[0]);
        } else {
          setDbUser(userData[0]);
        }
      }
      
      // Create a request in the Requests table
      const { error } = await supabase
        .from('Requests')
        .insert([{ 
          team_id: teamId,
          requester_id: dbUser.user_id,
          owner_id: ownerId,
          status: 'pending'
        }]);
      
      if (error) {
        console.error("Error sending join request:", error);
        alert('Failed to send join request. Please try again.');
        return;
      }
      
      // Update UI to show request sent
      setRequestSent(prev => ({
        ...prev,
        [teamId]: true
      }));
      
      alert('Join request sent successfully!');
    } catch (error) {
      console.error("Error handling join request:", error);
      alert('Something went wrong. Please try again.');
    }
  };

  // Navigation tab component
  const NavTab = ({ label, isActive, onClick }) => (
    <div onClick={onClick} className="cursor-pointer">
      <div className={`bg-black px-6 py-1 text-center font-bold border border-black ${isActive ? 'bg-black' : ''}`}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-300">
      {/* Header with navigation */}
      <header className="bg-red-800">
        <nav className="container mx-auto flex justify-around px-4 py-4">
          <NavTab label="INFO" onClick={() => router.push('/')} />
          <NavTab label="SCHEDULE" onClick={() => router.push('/')} />
          <NavTab label="PRIZES" onClick={() => router.push('/')} />
          <NavTab label="TEAMS" isActive={true} />
          <NavTab label="SPONSORS" onClick={() => router.push('/')} />
          <NavTab label="WORKSHOPS" onClick={() => router.push('/')} />
          <NavTab label="PROFILE" onClick={() => router.push('/')} />
        </nav>
      </header>

      {/* Main Teams Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-red-800">Open Teams Looking for Members</h1>
          <button 
            onClick={() => router.push('/create-team')}
            className="flex items-center px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create a Team
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
          </div>
        ) : openTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {openTeams.map(team => (
              <div key={team.team_id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-red-800">{team.name}</h2>
                    <p className="text-gray-600 mt-1">
                      {team.current_member_count}/{team.max_members} members · Looking for: {team.description}
                    </p>
                  </div>
                  <button
                    onClick={() => !requestSent[team.team_id] && handleJoinRequest(team.team_id, team.owner)}
                    disabled={requestSent[team.team_id] || (dbUser && team.owner === dbUser.user_id)}
                    className={`px-4 py-2 ${
                      requestSent[team.team_id] 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : (dbUser && team.owner === dbUser.user_id)
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-red-800 hover:bg-red-700'
                    } text-white rounded-md`}
                  >
                    {requestSent[team.team_id] 
                      ? 'Request Sent' 
                      : (dbUser && team.owner === dbUser.user_id)
                        ? 'Your Team'
                        : 'Request to Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-10 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-red-800 mb-4">No Teams Available</h2>
            <p className="mb-6">Be the first to create a team and start recruiting hackers!</p>
            <button 
              onClick={() => router.push('/create-team')}
              className="px-6 py-3 bg-red-800 text-white rounded-md hover:bg-red-700"
            >
              Create a Team
            </button>
          </div>
        )}
      </main>
    </div>
  );
}