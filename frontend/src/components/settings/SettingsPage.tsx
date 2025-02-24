import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserProfile } from '../dashboard/UserProfile';

export const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
              Profile
            </h2>
            <UserProfile />
          </section>
        </div>
      </div>
    </div>
  );
};