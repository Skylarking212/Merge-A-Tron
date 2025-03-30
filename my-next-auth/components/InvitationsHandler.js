'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function InvitationsHandler({ teamId, teamName, onClose }) {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [invitedUsers, setInvitedUsers] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSkills, setUserSkills] = useState({});
    const [teamSkills, setTeamSkills] = useState([]);
    const [teamAcademicLevel, setTeamAcademicLevel] = useState('');
    const [compatibilityScores, setCompatibilityScores] = useState({});

    // Fetch current user and team data
    useEffect(() => {
        const fetchCurrentUserAndTeam = async () => {
            const { data: session } = await supabase.auth.getSession();
            if (session && session.session) {
                const { data: userData, error: userError } = await supabase
                    .from('User')
                    .select('*')
                    .eq('email', session.session.user.email)
                    .single();

                if (!userError && userData) {
                    setCurrentUser(userData);

                    // Fetch team academic level (get average from team members)
                    const { data: teamMembers, error: teamMemberError } = await supabase
                        .from('Member')
                        .select(`
              User(user_id, academic_level)
            `)
                        .eq('team_id', teamId);

                    if (!teamMemberError && teamMembers && teamMembers.length > 0) {
                        const academicLevels = teamMembers
                            .map(member => member.User?.academic_level)
                            .filter(level => level); // Filter out null/undefined

                        if (academicLevels.length > 0) {
                            // Get the most common academic level in the team
                            const levelCounts = {};
                            let maxCount = 0;
                            let mostCommonLevel = '';

                            academicLevels.forEach(level => {
                                levelCounts[level] = (levelCounts[level] || 0) + 1;
                                if (levelCounts[level] > maxCount) {
                                    maxCount = levelCounts[level];
                                    mostCommonLevel = level;
                                }
                            });

                            setTeamAcademicLevel(mostCommonLevel);
                        }
                    }

                    // Fetch skills of team members
                    const { data: memberIds, error: memberIdError } = await supabase
                        .from('Member')
                        .select('user_id')
                        .eq('team_id', teamId);

                    if (!memberIdError && memberIds && memberIds.length > 0) {
                        const userIds = memberIds.map(member => member.user_id);

                        const { data: skills, error: skillsError } = await supabase
                            .from('Skills')
                            .select('skill_name, skill_level')
                            .in('user_id', userIds);

                        if (!skillsError && skills) {
                            // Aggregate skills across team members
                            const skillMap = {};
                            skills.forEach(skill => {
                                if (!skillMap[skill.skill_name]) {
                                    skillMap[skill.skill_name] = {
                                        count: 1,
                                        totalLevel: skill.skill_level
                                    };
                                } else {
                                    skillMap[skill.skill_name].count += 1;
                                    skillMap[skill.skill_name].totalLevel += skill.skill_level;
                                }
                            });

                            // Convert to array and sort by frequency and average skill level
                            const teamSkillsArray = Object.entries(skillMap).map(([name, data]) => ({
                                name,
                                count: data.count,
                                avgLevel: data.totalLevel / data.count
                            })).sort((a, b) => {
                                // Sort by count first, then by average level
                                if (b.count !== a.count) return b.count - a.count;
                                return b.avgLevel - a.avgLevel;
                            });

                            setTeamSkills(teamSkillsArray);
                        }
                    }
                }
            }
        };

        if (teamId) {
            fetchCurrentUserAndTeam();
        }
    }, [teamId]);

    // Fetch available users and their skills
    useEffect(() => {
        if (!currentUser || !teamId) return;

        const fetchUsersAndSkills = async () => {
            setIsLoading(true);
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

                // Exclude the current user
                let filteredUsers = allUsers.filter(user =>
                    user.user_id !== currentUser.user_id
                );

                // Fetch existing team members to exclude them
                const { data: members, error: memberError } = await supabase
                    .from('Member')
                    .select('user_id')
                    .eq('team_id', teamId);

                if (!memberError && members && members.length > 0) {
                    const memberIds = members.map(m => m.user_id);
                    filteredUsers = filteredUsers.filter(user =>
                        !memberIds.includes(user.user_id)
                    );
                }

                setAvailableUsers(filteredUsers || []);

                // Check for existing invitations
                const { data: existingInvitations, error: inviteError } = await supabase
                    .from('Requests')
                    .select('requester_id')
                    .eq('team_id', teamId)
                    .eq('status', 'pending');

                if (!inviteError && existingInvitations) {
                    const invitedMap = {};
                    existingInvitations.forEach(invite => {
                        invitedMap[invite.requester_id] = true;
                    });
                    setInvitedUsers(invitedMap);
                }

                // Fetch skills for all users
                const userIds = filteredUsers.map(user => user.user_id);
                if (userIds.length > 0) {
                    const { data: skillsData, error: skillsError } = await supabase
                        .from('Skills')
                        .select('user_id, skill_name, skill_level')
                        .in('user_id', userIds);

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

                        setUserSkills(skillsByUser);

                        // Calculate compatibility scores if team skills are available
                        if (teamSkills.length > 0) {
                            calculateCompatibilityScores(filteredUsers, skillsByUser);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching users:", error);
                alert("Failed to load users.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsersAndSkills();
    }, [currentUser, teamId, teamSkills]);

    // Calculate compatibility scores between users and the team
    const calculateCompatibilityScores = (users, userSkillsMap) => {
        const scores = {};

        users.forEach(user => {
            let score = 0;
            const userSkillList = userSkillsMap[user.user_id] || [];

            // 1. Skills overlap score (max 50 points)
            const userSkillNames = new Set(userSkillList.map(s => s.name.toLowerCase()));
            const teamSkillNames = new Set(teamSkills.map(s => s.name.toLowerCase()));

            // Check for complementary skills (skills the team doesn't have)
            let complementarySkillsCount = 0;
            userSkillNames.forEach(skill => {
                if (!teamSkillNames.has(skill)) {
                    complementarySkillsCount++;
                }
            });

            // Calculate skill overlap
            let skillMatchCount = 0;
            teamSkills.forEach(teamSkill => {
                if (userSkillNames.has(teamSkill.name.toLowerCase())) {
                    skillMatchCount++;

                    // Find the user's level for this skill
                    const userSkill = userSkillList.find(s =>
                        s.name.toLowerCase() === teamSkill.name.toLowerCase()
                    );

                    if (userSkill) {
                        // Award more points for higher skill levels
                        score += Math.min(userSkill.level, 10) * 0.5; // Max 5 points per matching skill
                    }
                }
            });

            // Award points for complementary skills
            score += complementarySkillsCount * 2; // 2 points per complementary skill

            // 2. Academic level match (max 30 points)
            if (user.academic_level && teamAcademicLevel) {
                // Exact match gets full points
                if (user.academic_level === teamAcademicLevel) {
                    score += 30;
                } else {
                    // Partial match for close academic levels
                    const levels = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
                    const userLevelIndex = levels.indexOf(user.academic_level);
                    const teamLevelIndex = levels.indexOf(teamAcademicLevel);

                    if (userLevelIndex !== -1 && teamLevelIndex !== -1) {
                        const levelDifference = Math.abs(userLevelIndex - teamLevelIndex);
                        // 20 points for 1 level difference, 10 for 2 levels, 0 for more
                        score += Math.max(0, 30 - (levelDifference * 10));
                    }
                }
            }

            // 3. Has skills score (max 20 points)
            if (userSkillList.length > 0) {
                // Award points for having skills at all (up to a max of 20)
                score += Math.min(userSkillList.length * 4, 20);
            }

            scores[user.user_id] = Math.round(score);
        });

        setCompatibilityScores(scores);
    };

    const handleInviteUser = async (userId) => {
        if (!teamId || !currentUser) return;

        try {
            // First check if an invitation already exists
            const { data: existingRequest, error: checkError } = await supabase
                .from('Requests')
                .select('request_id')
                .eq('team_id', teamId)
                .eq('requester_id', userId)
                .eq('status', 'pending');

            if (checkError) throw checkError;

            // If invitation already exists, update UI but don't show alert
            if (existingRequest && existingRequest.length > 0) {
                setInvitedUsers(prev => ({
                    ...prev,
                    [userId]: true
                }));
                return;
            }

            // Create a request in the Requests table
            const { error } = await supabase
                .from('Requests')
                .insert([{
                    team_id: teamId,
                    requester_id: userId,
                    owner_id: currentUser.user_id,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            // Update UI to show user has been invited
            setInvitedUsers(prev => ({
                ...prev,
                [userId]: true
            }));

        } catch (error) {
            console.error("Error sending invitation:", error);
            alert('Failed to send invitation. Please try again.');
        }
    };

    // Filter and sort users based on compatibility and search query
    const getFilteredAndSortedUsers = () => {
        // First filter by search query if any
        const filtered = searchQuery
            ? availableUsers.filter(user =>
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.academic_level && user.academic_level.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            : availableUsers;

        // Then sort by compatibility score (highest first)
        return [...filtered].sort((a, b) => {
            const scoreA = compatibilityScores[a.user_id] || 0;
            const scoreB = compatibilityScores[b.user_id] || 0;
            return scoreB - scoreA;
        });
    };

    const sortedUsers = getFilteredAndSortedUsers();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-red-800">Invite Users to {teamName}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search users by name, email, or academic level..."
                        className="w-full p-2 border border-gray-300 rounded"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="p-4 overflow-y-auto flex-grow">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-800"></div>
                        </div>
                    ) : sortedUsers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {sortedUsers.map(user => (
                                <div
                                    key={user.user_id}
                                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div className="flex-grow">
                                        <div className="flex justify-between">
                                            <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                                            {compatibilityScores[user.user_id] > 0 && (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                    Match: {compatibilityScores[user.user_id]}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{user.academic_level || 'No academic level set'}</p>

                                        {/* Show top skills if available */}
                                        {userSkills[user.user_id] && userSkills[user.user_id].length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Top Skills:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {userSkills[user.user_id]
                                                        .sort((a, b) => b.level - a.level)
                                                        .slice(0, 3)
                                                        .map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-2 py-1 rounded text-xs font-medium ${teamSkills.some(ts => ts.name.toLowerCase() === skill.name.toLowerCase())
                                                                    ? 'bg-blue-100 text-blue-800' // Matching skill
                                                                    : 'bg-green-100 text-green-800' // Complementary skill
                                                                    }`}
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
                                        onClick={() => !invitedUsers[user.user_id] && handleInviteUser(user.user_id)}
                                        disabled={invitedUsers[user.user_id]}
                                        className={`ml-4 px-3 py-1 ${invitedUsers[user.user_id]
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-red-800 hover:bg-red-700'
                                            } text-white rounded flex-shrink-0 transition-colors duration-200`}
                                    >
                                        {invitedUsers[user.user_id] ? 'Invited' : 'Invite'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-600">
                                {searchQuery
                                    ? 'No users found matching your search criteria.'
                                    : 'No users available to invite.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}