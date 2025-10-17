'use client';

import { useState, useEffect } from 'react';
import AITutor from '@/components/AITutor';
import Onboarding from '@/components/Onboarding';
import type { User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUserId = localStorage.getItem('ai_tutor_user_id');
    if (storedUserId) {
      fetchUser(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/user?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('ai_tutor_user_id');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('ai_tutor_user_id');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('ai_tutor_user_id', newUser.user_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? (
        <AITutor user={user} />
      ) : (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
    </main>
  );
}