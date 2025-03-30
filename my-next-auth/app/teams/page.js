'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import InvitationsHandler from '../../components/InvitationsHandler';

export default function TeamsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [openTeams, setOpenTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestSent, setRequestSent] = useState({});

  // New state variables for invite feature
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [currentTeamName, setCurrentTeamName] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSkills, setUserSkills] = useState({});

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

  // Fetch all users for invitation
  const fetchAllUsers = async (teamId, teamName) => {
    setIsLoadingUsers(true);
    try {
      // Fetch all users
      const { data: allUsers, error } = await supabase
        .from('User')
        .select(`
          user_id,
          first_name,
          last_name,
          email,
          academic_level,
          description
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Exclude the current user if logged in
      let filteredUsers = allUsers;
      if (dbUser) {
        filteredUsers = allUsers.filter(user =>
          user.user_id !== dbUser.user_id
        );
      }

      setAvailableUsers(filteredUsers || []);

      // Fetch skills for all users
      const userIds = filteredUsers.map(user => user.user_id);
      if (userIds.length > 0) {
        // Fetch skills for all users at once
        const { data: skillsData, error: skillsError } = await supabase
          .from('Skills')
          .select('user_id, skill_name, skill_level')
          .in('user_id', userIds)
          .order('skill_level', { ascending: false });

        if (!skillsError && skillsData) {
          // Group skills by user_id
          const skillsByUser = {};

          userIds.forEach(id => {
            skillsByUser[id] = [];
          });

          skillsData.forEach(skill => {
            if (skillsByUser[skill.user_id]) {
              skillsByUser[skill.user_id].push({
                name: skill.skill_name,
                level: skill.skill_level
              });
            }
          });

          // Sort skills by level and take top 3 for each user
          Object.keys(skillsByUser).forEach(userId => {
            skillsByUser[userId] = skillsByUser[userId]
              .sort((a, b) => b.level - a.level)
              .slice(0, 3);
          });

          setUserSkills(skillsByUser);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Send invitation to a user
  const handleInviteUser = async (userId) => {
    if (!currentTeamId || !dbUser) return;

    try {
      // Create a request in the Requests table
      const { error } = await supabase
        .from('Requests')
        .insert([{
          team_id: currentTeamId,
          requester_id: userId,
          owner_id: dbUser.user_id,
          status: 'pending'
        }]);

      if (error) throw error;

      alert('Invitation sent successfully!');
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  // Navigation tab component
  const NavTab = ({ label, isActive, onClick }) => (
    <div onClick={onClick} className="cursor-pointer">
      <div className={`bg-yellow-400 px-6 py-1 text-center font-bold border border-yellow-500 ${isActive ? 'bg-yellow-500' : ''}`}>
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
          <NavTab label="PROFILE" onClick={() => router.push('/profile')} />
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

                  {dbUser && team.owner === dbUser.user_id ? (
                    // Your team UI with "+" button
                    <div className="flex space-x-2 items-center">
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">
                        Your Team
                      </span>
                      <button
                        onClick={() => {
                          setCurrentTeamId(team.team_id);
                          setCurrentTeamName(team.name);
                          setShowInviteModal(true);
                          fetchAllUsers(team.team_id, team.name);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-red-800 text-white rounded-full hover:bg-red-700"
                        title="Invite Members"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    // Request to join button (existing code)
                    <button
                      onClick={() => !requestSent[team.team_id] && handleJoinRequest(team.team_id, team.owner)}
                      disabled={requestSent[team.team_id] || (dbUser && team.owner === dbUser.user_id)}
                      className={`px-4 py-2 ${requestSent[team.team_id]
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
                  )}
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

      {/* Invite Users Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {showInviteModal && (
            <InvitationsHandler
              teamId={currentTeamId}
              teamName={currentTeamName}
              onClose={() => setShowInviteModal(false)}
            />
          )}
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-red-800">Invite Users to {currentTeamName}</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              {isLoadingUsers ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-800"></div>
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {availableUsers.map(user => (
                    <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-grow">
                        <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-gray-600">{user.academic_level || 'No academic level set'}</p>

                        {/* Show top 3 skills if available */}
                        {userSkills[user.user_id] && userSkills[user.user_id].length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Top Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {userSkills[user.user_id].map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                                >
                                  {skill.name} ({skill.level}/10)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {user.description && (
                          <p className="text-sm mt-2 text-gray-700 line-clamp-2">{user.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleInviteUser(user.user_id)}
                        className="ml-4 px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700 flex-shrink-0"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-600">No users available to invite.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}