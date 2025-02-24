import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const CreatePodcast = () => {
  const [title, setTitle] = useState('');
  const [inviteKey, setInviteKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setInviteKey(data.inviteKey);
      navigate(`/session/${data.inviteKey}`); // Navigate to session page
    } catch (error) {
      console.error('Create session error:', error);
      setError('Failed to create session');
    }
  };

  return (
    <div className="max-w-md mx-auto pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Create Podcast</h1>
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Podcast Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full pl-3 pr-3 py-2 border rounded-md bg-white text-black"
              placeholder="Enter podcast title"
              required
            />
          </div>
          {inviteKey && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Invite Key</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={inviteKey}
                  readOnly
                  className="block w-full pl-3 pr-3 py-2 border rounded-md"
                  placeholder="Invite Key"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(inviteKey)}
                  className="ml-2 p-2 bg-gray-200 rounded-md"
                  title="Copy Invite Key"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700"
          >
            Create Session
          </button>
        </form>
      </div>
    </div>
  );
};