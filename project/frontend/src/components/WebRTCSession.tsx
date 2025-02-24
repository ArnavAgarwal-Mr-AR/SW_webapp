import React, { useRef, useEffect, useState } from 'react';
import './WebRTCSession.css';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface WebRTCSessionProps {
  roomId?: string;
}

interface Participant {
  id: string;
  stream: MediaStream;
  name: string;
}

const WebRTCSession: React.FC<WebRTCSessionProps> = ({ roomId = 'default-room' }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startWebRTC = async () => {
      try {
        // Initialize socket connection
        socketRef.current = io('http://localhost:3001');
        const socket = socketRef.current;

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true 
        });
        localStreamRef.current = stream;
        
        // Add local participant
        setParticipants([{
          id: 'local',
          stream,
          name: 'You'
        }]);

        // Join room
        socket.emit('join-room', roomId);

        // Handle new participant joining
        socket.on('user-connected', async (userId: string) => {
          const peerConnection = createPeerConnection(userId, stream);
          peerConnectionsRef.current.set(userId, peerConnection);
          
          // Create and send offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', { offer, roomId, targetId: userId });
        });

        // Handle participant leaving
        socket.on('user-disconnected', (userId: string) => {
          if (peerConnectionsRef.current.has(userId)) {
            peerConnectionsRef.current.get(userId)?.close();
            peerConnectionsRef.current.delete(userId);
          }
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });

      } catch (error) {
        console.error('Error starting WebRTC:', error);
      }
    };

    startWebRTC();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const createPeerConnection = (userId: string, stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local tracks
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          targetId: userId
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        if (prev.some(p => p.id === userId)) return prev;
        return [...prev, {
          id: userId,
          stream: remoteStream,
          name: `Participant ${prev.length}`
        }];
      });
    };

    return peerConnection;
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const handleEndCall = () => {
    cleanup();
    // Navigate away or handle end call
  };

  return (
    <div className="studio-container">
      <div className="studio-background" />
      <div className="studio-overlay">
        <div className="studio-circle">
          {participants.map((participant, index) => (
            <div key={participant.id} className="participant-seat">
              <div className="seat-container">
                <div className="chair" />
                <div className="video-container">
                  <video
                    className="video-stream"
                    ref={el => {
                      if (el) {
                        el.srcObject = participant.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={participant.id === 'local'}
                  />
                </div>
                <div className="participant-name">{participant.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button 
          className={`control-button ${isAudioMuted ? 'active' : ''}`}
          onClick={toggleAudio}
        >
          {isAudioMuted ? <MicOff /> : <Mic />}
        </button>
        <button 
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff /> : <Video />}
        </button>
        <button 
          className="control-button active"
          onClick={handleEndCall}
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default WebRTCSession;