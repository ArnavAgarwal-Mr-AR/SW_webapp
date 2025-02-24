import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, KeyRound } from 'lucide-react';

const options = [
  {
    id: 'create-human',
    title: 'Create Podcast with Person',
    description: 'Start a podcast session and invite others to join',
    icon: Users,
    path: '/create-podcast',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'create-ai',
    title: 'Create Podcast with AI',
    description: 'Start a podcast session with an AI co-host',
    icon: Bot,
    path: '/create-ai-podcast',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'join',
    title: 'Join Podcast',
    description: 'Join an existing podcast session with an invite key',
    icon: KeyRound,
    path: '/join-podcast',
    gradient: 'from-green-500 to-emerald-600',
  },
];

export const PodcastOptions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-12">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => navigate(option.path)}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute inset-0 opacity-0 bg-gradient-to-r ${option.gradient} transition-opacity group-hover:opacity-10`} />
            <div className="relative z-10">
              <div className="mb-4 inline-block rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {option.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};