import React from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PodcastOptions } from './PodcastOptions';
import { PodcastList } from './PodcastList';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name}
          </h1>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Start a New Session
          </h2>
          <PodcastOptions />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Recent Sessions
          </h2>
          <PodcastList />
        </section>
      </div>
    </div>
  );
};