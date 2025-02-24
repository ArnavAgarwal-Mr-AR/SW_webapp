import { create } from 'zustand';
import { socket } from '../utils/socket';

// Define the base Session type from the database
interface Session {
  id: string;
  room_id: string;
  title: string;
  host_id: string;
  status: string;
}

// Extended Session type for frontend use
interface ExtendedSession extends Session {
  recording?: boolean;
  inviteKey?: string;
  host?: string;
  participants?: string[];
  isAISession?: boolean;
  endTime?: Date;
}

interface Participant {
  id: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  isMuted: boolean;
}

interface PodcastState {
  currentSession: ExtendedSession | null;
  savedPodcasts: ExtendedSession[];
  participants: Participant[];
  createSession: (title: string) => Promise<boolean>;
  joinSession: (session: Session) => boolean;
  leaveSession: () => void;
  endSession: () => void;
  toggleRecording: () => void;
  savePodcast: (session: ExtendedSession) => void;
  deletePodcast: (sessionId: string) => void;
}

export const usePodcastStore = create<PodcastState>((set, get) => ({
  currentSession: null,
  savedPodcasts: [],
  participants: [],

  createSession: async (title: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      set({ currentSession: session });
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  },

  joinSession: (session: Session) => {
    try {
      socket.emit('join-room', session.room_id);
      set({ currentSession: session });
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      return false;
    }
  },

  leaveSession: () => {
    if (socket) {
      socket.emit('leave-room');
    }
    set({ currentSession: null, participants: [] });
  },

  endSession: () => {
    const session = get().currentSession;
    if (session) {
      const endedSession: ExtendedSession = {
        ...session,
        endTime: new Date(),
        status: 'ended'
      };
      get().savePodcast(endedSession);
      set({ currentSession: null, participants: [] });
    }
  },

  toggleRecording: () => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          recording: !session.recording
        }
      });
    }
  },

  savePodcast: (session: ExtendedSession) => {
    set((state) => ({
      savedPodcasts: [...state.savedPodcasts, session],
    }));
  },

  deletePodcast: (sessionId: string) => {
    set((state) => ({
      savedPodcasts: state.savedPodcasts.filter((podcast) => podcast.id !== sessionId),
    }));
  },
}));