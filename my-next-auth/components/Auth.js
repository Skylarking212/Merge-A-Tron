'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ closeModal }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setMessage('Signed in successfully!');
        if (closeModal) closeModal();
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {authMode === 'signin' ? 'Sign In to HackPSU' : 'Register for HackPSU'}
      </h2>

      <form onSubmit={handleAuth}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Register'}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">{message}</div>
      )}

      <div className="mt-4 text-center">
        {authMode === 'signin' ? (
          <p>
            Don't have an account?{' '}
            <button
              className="text-blue-600 font-medium"
              onClick={() => setAuthMode('signup')}
            >
              Register Now
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              className="text-blue-600 font-medium"
              onClick={() => setAuthMode('signin')}
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
