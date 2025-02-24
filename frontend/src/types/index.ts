export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PodcastSession {
  id: string;
  inviteKey: string;
  host: User;
  participants: User[];
  isAISession: boolean;
  recording: boolean;
  startTime?: Date;
  endTime?: Date;
  title?: string;
  duration?: string;
}