'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function InvitationsNotification() {
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvitations = async () => {
            const { data: session } = await supabase.auth.getSession();

            if (session && session.session) {
                const { data: userData, error: userError } = await supabase
                    .from('User')
                    .select('user_id')
                    .eq('email', session.session.user.email)
                    .single();

                if (userError || !userData) {
                    console.error("User not found:", userError);
                    setIsLoading(false);
                    return;
                }

                // Get pending invitations for the current user
                const { data: invitations, error: invitationError } = await supabase
                    .from('Requests')
                    .select(`
                        request_id,
                        team_id,
                        owner_id,
                        status,
                        created_at,
                        Team(name),
                        User!owner_id(first_name, last_name, email)
                    `)
                    .eq('requester_id', userData.user_id)
                    .eq('status', 'pending');

                if (invitationError) {
                    console.error("Error fetching invitations:", invitationError);
                } else {
                    setPendingInvitations(invitations || []);
                }
            }

            setIsLoading(false);
        };

        fetchInvitations();

        // Set up real-time subscription for new invitations
        const invitationsSubscription = supabase
            .channel('invitations_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'Requests',
                filter: 'status=eq.pending'
            }, (payload) => {
                fetchInvitations();
            })
            .subscribe();

        return () => {
            invitationsSubscription.unsubscribe();
        };
    }, []);

    const handleAction = async (requestId, accept) => {
        try {
            if (accept) {
                // Accept invitation
                const { data: request, error: fetchError } = await supabase
                    .from('Requests')
                    .select('team_id')
                    .eq('request_id', requestId)
                    .single();

                if (fetchError) {
                    console.error("Error fetching invitation:", fetchError);
                    throw fetchError;
                }

                console.log("Invitation to accept:", request);

                // Update request status
                const { error: updateError } = await supabase
                    .from('Requests')
                    .update({ status: 'accepted', updated_at: new Date().toISOString() })
                    .eq('request_id', requestId);

                if (updateError) {
                    console.error("Error updating invitation status:", updateError);
                    throw updateError;
                }

                // Find active event
                const { data: eventData, error: eventError } = await supabase
                    .from('Event')
                    .select('event_id')
                    .eq('can_have_teams', true);

                if (eventError) {
                    console.error("Error finding event:", eventError);
                    throw eventError;
                }

                if (!eventData || eventData.length === 0) {
                    throw new Error("No active event found");
                }

                const event = eventData[0];

                // Get current user id
                const { data: session } = await supabase.auth.getSession();
                const { data: userData, error: userError } = await supabase
                    .from('User')
                    .select('user_id')
                    .eq('email', session.session.user.email)
                    .single();

                if (userError || !userData) {
                    throw new Error("User not found");
                }

                // Add user to team as member
                const { error: memberError } = await supabase
                    .from('Member')
                    .insert([{
                        user_id: userData.user_id,
                        team_id: request.team_id,
                        event_id: event.event_id,
                        wants_team: false
                    }]);

                if (memberError) {
                    console.error("Error adding member:", memberError);
                    throw memberError;
                }

                // Increment the team's member count
                const { data: teamData, error: teamFetchError } = await supabase
                    .from('Team')
                    .select('current_member_count')
                    .eq('team_id', request.team_id)
                    .single();

                if (teamFetchError) {
                    console.error("Error fetching team:", teamFetchError);
                    throw teamFetchError;
                }

                const newCount = (teamData.current_member_count || 0) + 1;

                const { error: teamUpdateError } = await supabase
                    .from('Team')
                    .update({ current_member_count: newCount })
                    .eq('team_id', request.team_id);

                if (teamUpdateError) {
                    console.error("Error updating team count:", teamUpdateError);
                    throw teamUpdateError;
                }

                console.log("Successfully accepted invitation");
            } else {
                // Reject invitation
                const { error } = await supabase
                    .from('Requests')
                    .update({ status: 'rejected', updated_at: new Date().toISOString() })
                    .eq('request_id', requestId);

                if (error) {
                    console.error("Error rejecting invitation:", error);
                    throw error;
                }

                console.log("Successfully rejected invitation");
            }

            // Remove from UI
            setPendingInvitations(prev => prev.filter(r => r.request_id !== requestId));
        } catch (error) {
            console.error("Error handling invitation:", error);
            alert("Failed to process invitation. Please try again.");
        }
    };

    if (isLoading || pendingInvitations.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 shadow-lg bg-white rounded-lg overflow-hidden">
            <div
                className="bg-red-800 text-white p-3 cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-bold">Team Invitations ({pendingInvitations.length})</h3>
                <span>{isOpen ? '▼' : '▲'}</span>
            </div>

            {isOpen && (
                <div className="max-h-80 overflow-y-auto">
                    {pendingInvitations.map(invitation => (
                        <div key={invitation.request_id} className="p-4 border-b">
                            <p className="font-medium">{invitation.User.first_name} {invitation.User.last_name}</p>
                            <p className="text-sm text-gray-600">invites you to join {invitation.Team.name}</p>
                            <div className="mt-2 flex justify-end space-x-2">
                                <button
                                    onClick={() => handleAction(invitation.request_id, false)}
                                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => handleAction(invitation.request_id, true)}
                                    className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}