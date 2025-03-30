'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Changed from ../../lib/supabase

export default function RequestNotification() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
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

                // Get pending requests for teams you own
                const { data: requests, error: requestError } = await supabase
                    .from('Requests')
                    .select(`
            request_id,
            team_id,
            requester_id,
            status,
            created_at,
            Team(name),
            User!requester_id(first_name, last_name, email)
          `)
                    .eq('owner_id', userData.user_id)
                    .eq('status', 'pending');

                if (requestError) {
                    console.error("Error fetching requests:", requestError);
                } else {
                    setPendingRequests(requests || []);
                }
            }

            setIsLoading(false);
        };

        fetchRequests();

        // Set up real-time subscription for new requests
        const requestsSubscription = supabase
            .channel('requests_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'Requests',
                filter: 'status=eq.pending'
            }, (payload) => {
                fetchRequests();
            })
            .subscribe();

        return () => {
            requestsSubscription.unsubscribe();
        };
    }, []);

    const handleAction = async (requestId, accept) => {
        try {
            if (accept) {
                // Accept request
                const { data: request, error: fetchError } = await supabase
                    .from('Requests')
                    .select('team_id, requester_id')
                    .eq('request_id', requestId)
                    .single();

                if (fetchError) {
                    console.error("Error fetching request:", fetchError);
                    throw fetchError;
                }

                console.log("Request to accept:", request);

                // Update request status
                const { error: updateError } = await supabase
                    .from('Requests')
                    .update({ status: 'accepted', updated_at: new Date().toISOString() })
                    .eq('request_id', requestId);

                if (updateError) {
                    console.error("Error updating request status:", updateError);
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
                console.log("Found event:", event);

                // Add user to team as member
                const { error: memberError } = await supabase
                    .from('Member')
                    .insert([{
                        user_id: request.requester_id,
                        team_id: request.team_id,
                        event_id: event.event_id,
                        wants_team: false
                    }]);

                if (memberError) {
                    console.error("Error adding member:", memberError);
                    throw memberError;
                }

                // Manually increment the team's member count instead of using RPC
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

                console.log("Successfully accepted request");
            } else {
                // Reject request
                const { error } = await supabase
                    .from('Requests')
                    .update({ status: 'rejected', updated_at: new Date().toISOString() })
                    .eq('request_id', requestId);

                if (error) {
                    console.error("Error rejecting request:", error);
                    throw error;
                }

                console.log("Successfully rejected request");
            }

            // Remove from UI
            setPendingRequests(prev => prev.filter(r => r.request_id !== requestId));
        } catch (error) {
            console.error("Error handling request:", error);
            alert("Failed to process request. Please try again.");
        }
    };

    if (isLoading || pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 shadow-lg bg-white rounded-lg overflow-hidden">
            <div
                className="bg-red-800 text-white p-3 cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-bold">Join Requests ({pendingRequests.length})</h3>
                <span>{isOpen ? '▼' : '▲'}</span>
            </div>

            {isOpen && (
                <div className="max-h-80 overflow-y-auto">
                    {pendingRequests.map(request => (
                        <div key={request.request_id} className="p-4 border-b">
                            <p className="font-medium">{request.User.first_name} {request.User.last_name}</p>
                            <p className="text-sm text-gray-600">wants to join {request.Team.name}</p>
                            <div className="mt-2 flex justify-end space-x-2">
                                <button
                                    onClick={() => handleAction(request.request_id, false)}
                                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(request.request_id, true)}
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