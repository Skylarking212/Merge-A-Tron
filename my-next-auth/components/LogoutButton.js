'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LogoutButton({ className = '', variant = 'default', children }) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Error logging out:', error);
                return;
            }

            // Redirect to home page after logout
            router.push('/');
        } catch (error) {
            console.error('Unexpected error during logout:', error);
        }
    };

    const getButtonStyles = () => {
        switch (variant) {
            case 'header':
                return 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 px-6 py-3 text-center font-bold rounded-full transition-all focus:outline-none transform hover:scale-105 active:scale-95';
            default:
                return 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95';
        }
    };

    return (
        <button
            onClick={handleLogout}
            className={`${getButtonStyles()} ${className}`}
            type="button"
        >
            {children || 'Logout'}
        </button>
    );
}