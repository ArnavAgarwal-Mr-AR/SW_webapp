import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Bot, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    navigate('/');
    return null;
  }

  const options = [
    {
      title: 'Create Podcast with Person',
      icon: <Users className="h-8 w-8" />,
      description: 'Start a podcast session and invite others to join',
      path: '/create-podcast',
    },
    {
      title: 'Create Podcast with AI',
      icon: <Bot className="h-8 w-8" />,
      description: 'Start a podcast session with an AI co-host',
      path: '/create-ai-podcast',
    },
    {
      title: 'Join Podcast',
      icon: <Mic className="h-8 w-8" />,
      description: 'Join an existing podcast session with an invite key',
      path: '/join-podcast',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pt-16">
      <h1 className="text-4xl font-bold mb-8">Welcome, {user.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
          <button
            key={option.title}
            onClick={() => navigate(option.path)}
            className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <div className="mb-4 text-primary-600 dark:text-primary-400">
              {option.icon}
            </div>
            <h2 className="text-xl font-semibold mb-2">{option.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};