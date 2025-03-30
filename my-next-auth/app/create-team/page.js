'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        max_members: 5
    });

    // Navigation tab component
    const NavTab = ({ label, isActive, onClick }) => (
        <div onClick={onClick} className="cursor-pointer">
            <div className={`bg-yellow-400 px-6 py-1 text-center font-bold border border-yellow-500 ${isActive ? 'bg-yellow-500' : ''}`}>
                {label}
            </div>
        </div>
    );

    // Check if user is logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data && data.session) {
                setIsLoggedIn(true);
                setUser(data.session.user);
            } else {
                // Redirect to homepage if not logged in
                router.push('/');
            }
        };

        checkUser();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!isLoggedIn || !user) {
                throw new Error("You must be logged in to create a team");
            }

            console.log("Current auth user:", user);

            // Check if user exists in User table
            let { data: userData, error: userError } = await supabase
                .from('User')
                .select('user_id')
                .eq('email', user.email);

            if (userError) {
                console.error("User lookup error:", userError);
                throw userError;
            }

            let dbUser;

            // If user doesn't exist in the database, create one
            if (!userData || userData.length === 0) {
                console.log("User not found in database, creating user record");

                // Create a new user record
                const { data: newUser, error: createUserError } = await supabase
                    .from('User')
                    .insert([
                        {
                            email: user.email,
                            first_name: user.user_metadata?.first_name || '',
                            last_name: user.user_metadata?.last_name || ''
                        }
                    ])
                    .select();

                if (createUserError) {
                    console.error("Error creating user:", createUserError);
                    throw createUserError;
                }

                if (!newUser || newUser.length === 0) {
                    throw new Error("Failed to create user record");
                }

                dbUser = newUser[0];
            } else {
                dbUser = userData[0];
            }

            console.log("Database user:", dbUser);

            // Find event_id (assuming there's only one active event)
            let { data: eventData, error: eventError } = await supabase
                .from('Event')
                .select('event_id')
                .eq('can_have_teams', true);

            if (eventError) {
                console.error("Event lookup error:", eventError);
                throw eventError;
            }

            let event;

            if (!eventData || eventData.length === 0) {
                // If no event exists, create a default one
                console.log("No event found, creating default event");

                const { data: newEvent, error: createEventError } = await supabase
                    .from('Event')
                    .insert([{
                        name: 'HackPSU 2025',
                        can_have_teams: true,
                        start_time: new Date().toISOString(),
                        end_time: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
                    }])
                    .select();

                if (createEventError) {
                    console.error("Error creating event:", createEventError);
                    throw createEventError;
                }

                if (!newEvent || newEvent.length === 0) {
                    throw new Error("Failed to create default event");
                }

                event = newEvent[0];
            } else {
                event = eventData[0];
            }

            console.log("Event:", event);

            // Create the team
            const { data: teamData, error: teamError } = await supabase
                .from('Team')
                .insert([
                    {
                        name: formData.name,
                        description: formData.description,
                        max_members: parseInt(formData.max_members),
                        current_member_count: 1,
                        is_private: false,
                        owner: dbUser.user_id
                    }
                ])
                .select();

            if (teamError) {
                console.error("Team creation error:", teamError);
                throw teamError;
            }

            console.log("Team created successfully:", teamData);

            if (!teamData || teamData.length === 0) {
                throw new Error("Failed to create team - no team data returned");
            }

            const team = teamData[0];
            console.log("Created team:", team);

            // Add user as a member
            const { error: memberError } = await supabase
                .from('Member')
                .insert([
                    {
                        user_id: dbUser.user_id,
                        team_id: team.team_id,
                        event_id: event.event_id,
                        wants_team: false // Already a member, not requesting
                    }
                ]);

            if (memberError) {
                console.error("Member creation error:", memberError);
                throw memberError;
            }

            // Redirect to teams page
            router.push('/teams');
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Failed to create team: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sky-300">
            {/* Header with navigation */}
            <header className="bg-red-800">
                <nav className="container mx-auto flex justify-around px-4 py-4">
                    <NavTab label="INFO" onClick={() => router.push('/')} />
                    <NavTab label="SCHEDULE" onClick={() => router.push('/')} />
                    <NavTab label="PRIZES" onClick={() => router.push('/')} />
                    <NavTab label="TEAMS" onClick={() => router.push('/teams')} />
                    <NavTab label="SPONSORS" onClick={() => router.push('/')} />
                    <NavTab label="WORKSHOPS" onClick={() => router.push('/')} />
                    <NavTab label="PROFILE" onClick={() => router.push('/')} />
                </nav>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-10">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold text-red-800 mb-6">Create a Team</h1>

                    <div className="bg-white rounded-xl p-8 shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="name" className="block text-gray-700 text-lg font-medium mb-2">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800"
                                    placeholder="Enter a creative team name"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Choose a name that represents your team's skills or interests.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-gray-700 text-lg font-medium mb-2">
                                    Team Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800"
                                    placeholder="Describe your team and what kind of members you're looking for"
                                    required
                                ></textarea>
                                <p className="text-sm text-gray-500 mt-1">
                                    Be specific about the skills or roles you're looking for in teammates.
                                </p>
                            </div>

                            <div className="mb-8">
                                <label htmlFor="max_members" className="block text-gray-700 text-lg font-medium mb-2">
                                    Maximum Team Size
                                </label>
                                <select
                                    id="max_members"
                                    name="max_members"
                                    value={formData.max_members}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800"
                                >
                                    <option value="2">2 members</option>
                                    <option value="3">3 members</option>
                                    <option value="4">4 members</option>
                                    <option value="5">5 members</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-1">
                                    Most hackathon teams have 3-4 members.
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => router.push('/teams')}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-red-800 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}