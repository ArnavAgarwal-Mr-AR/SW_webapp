import React from 'react';
import { User } from '../../types';
import { UserAvatar } from '../shared/UserAvatar';

interface ParticipantListProps {
  host: User;
  participants: User[];
}

export const ParticipantList = ({ host, participants }: ParticipantListProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Participants</h2>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <UserAvatar user={host} />
          <div>
            <p className="font-medium">{host.name}</p>
            <span className="text-xs text-primary-600 dark:text-primary-400">Host</span>
          </div>
        </div>
        
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center space-x-3">
            <UserAvatar user={participant} />
            <div>
              <p className="font-medium">{participant.name}</p>
              <span className="text-xs text-gray-500">Participant</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};