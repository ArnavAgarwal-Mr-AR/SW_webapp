import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Camera } from 'lucide-react';

export const UserProfile = () => {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <Camera className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-500"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};