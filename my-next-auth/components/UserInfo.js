'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function UserInfo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      <p className="mb-4">Email: {user.email}</p>
      <p className="mb-4">ID: {user.id}</p>
      <button
        className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    </div>
  );
}
