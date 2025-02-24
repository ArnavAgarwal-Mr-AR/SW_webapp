import { Play, Edit, Trash2 } from 'lucide-react';

export const PodcastList = () => {
  const mockPodcasts = [
    {
      id: '1',
      title: 'Tech Talk #1',
      date: '2024-01-20',
      duration: '45:30',
      participants: 3,
    },
    // Add more mock podcasts as needed
  ];

  return (
    <div className="space-y-4">
      {mockPodcasts.map((podcast) => (
        <div
          key={podcast.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <button title="Play" className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              <Play className="h-5 w-5" />
            </button>
            <div>
              <h3 className="font-semibold">{podcast.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {podcast.date} • {podcast.duration} • {podcast.participants} participants
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Edit className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};