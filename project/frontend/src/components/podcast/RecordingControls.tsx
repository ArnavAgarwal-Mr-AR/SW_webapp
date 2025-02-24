import React from 'react';
import { Mic, Square } from 'lucide-react';
import { usePodcastStore } from '../../store/podcastStore';

export const RecordingControls = () => {
  const session = usePodcastStore((state) => state.currentSession);
  const toggleRecording = usePodcastStore((state) => state.toggleRecording);

  if (!session) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className={`flex items-center ${session.recording ? 'text-red-500' : 'text-gray-500'}`}>
        <div className={`h-2 w-2 rounded-full ${session.recording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} mr-2`} />
        {session.recording ? 'Recording' : 'Not Recording'}
      </div>
      <button
        onClick={toggleRecording}
        className={`p-3 rounded-full ${
          session.recording
            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {session.recording ? (
          <Square className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};