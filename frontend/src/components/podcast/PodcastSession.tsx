import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, CircleDot, Share2, Check, UserPlus, X } from 'lucide-react';
import './PodcastSession.css';
import { usePodcastStore } from '../../store/podcastStore';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../utils/socket';

export const PodcastSession = () => {
  const { inviteKey } = useParams();
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const currentSession = usePodcastStore((state) => state.currentSession);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const getVideoContainerClass = () => {
    const count = participants.length + 1; // +1 for local user
    if (count === 1) return 'video-container-full';
    if (count === 2) return 'video-container-split';
    return 'video-container-grid';
  };

  useEffect(() => {
    socket.emit('join-room', inviteKey);

    socket.on('user-connected', async (newUserId: string) => {
      const peerConnection = createPeerConnection(newUserId);
      peerConnectionsRef.current.set(newUserId, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId: inviteKey, targetId: newUserId });

      setParticipants((prev) => [...prev, newUserId]);
    });

    socket.on('existing-participants', (existingIds: string[]) => {
      setParticipants(existingIds);
    });

    socket.on('user-disconnected', (disconnectedId: string) => {
      if (peerConnectionsRef.current.has(disconnectedId)) {
        peerConnectionsRef.current.get(disconnectedId)?.close();
        peerConnectionsRef.current.delete(disconnectedId);
      }
      setParticipants((prev) => prev.filter(id => id !== disconnectedId));
    });

    socket.on('offer', async ({ offer, senderId }) => {
      const peerConnection = createPeerConnection(senderId);
      peerConnectionsRef.current.set(senderId, peerConnection);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId: inviteKey, targetId: senderId });
    });

    socket.on('answer', async ({ answer, senderId }) => {
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      const peerConnection = peerConnectionsRef.current.get(senderId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('participant-count', (count: number) => {
      setParticipantCount(count);
    });

    return () => {
      socket.off('user-connected');
      socket.off('existing-participants');
      socket.off('user-disconnected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('participant-count');
      stopLocalTracks();
    };
  }, [inviteKey]);

  function createPeerConnection(userId: string) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: inviteKey,
          targetId: userId
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const videoElement = document.getElementById(`video-${userId}`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    return peerConnection;
  }

  function stopLocalTracks() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  async function toggleVideo() {
    if (isVideoOn) {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.stop();
      }
      setIsVideoOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: !isMuted,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } catch (err) {
        console.error('Error turning on video:', err);
      }
    }
  }

  async function toggleAudio() {
    if (!isMuted) {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.stop();
      }
      setIsMuted(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsMuted(false);
      } catch (err) {
        console.error('Error turning on audio:', err);
      }
    }
  }

  function handleToggleRecording() {
    if (!isRecording) {
      if (localStreamRef.current) {
        recordedChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, {
          mimeType: 'video/webm; codecs=vp9',
        });

        mediaRecorderRef.current.ondataavailable = (evt) => {
          if (evt.data.size > 0) recordedChunksRef.current.push(evt.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];
          await uploadRecording(blob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);

        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1);
        }, 1000);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }

  async function uploadRecording(blob: Blob) {
    const formData = new FormData();
    const sessionId = currentSession?.id || '';
    const userId = user?.id;

    if (!sessionId || !userId) {
      console.error('Invalid sessionId or userId:', { sessionId, userId });
      return;
    }

    formData.append('video', blob, 'recording.webm');
    formData.append('sessionId', sessionId);
    formData.append('userId', userId);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      const data = await response.json();
      console.log('Recording uploaded:', data);
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  }

  function handleEndSession() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    stopLocalTracks();
    navigate('/dashboard');
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleShare = async (platform: 'whatsapp' | 'email' | 'sms') => {
    const shareUrl = `${window.location.origin}/join-podcast?key=${inviteKey}`;
    const message = `
🎙️ Podcast Invitation!

Hey! ${user.name} would love to have you as a guest on their podcast session "${currentSession?.title || 'Podcast Session'}"!

📝 Session Details:
• Host: ${user.name}
• Invite Key: ${inviteKey}

🔗 Join using this link:
${shareUrl}

Looking forward to having you on the show! 🎧
`;

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          break;
        case 'email':
          const subject = `Join ${user.name}'s Podcast Session`;
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
          break;
        case 'sms':
          window.open(`sms:?&body=${encodeURIComponent(message)}`, '_blank');
          break;
        default:
          console.error('Unsupported sharing platform');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="podcast-studio">
      <div className={getVideoContainerClass()}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="video-stream"
            autoPlay
            playsInline
            muted
          />
        </div>
        
        {participants.map((participantId) => (
          <div key={participantId} className="video-wrapper">
            <video
              id={`video-${participantId}`}
              className="video-stream"
              autoPlay
              playsInline
            />
          </div>
        ))}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <CircleDot className="indicator-icon" />
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
      )}

      <div className="controls">
        <button
          onClick={toggleVideo}
          className={`control-button ${isVideoOn ? 'active' : ''}`}
          title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
        >
          {isVideoOn ? <VideoOff /> : <Video />}
        </button>

        <button
          onClick={toggleAudio}
          className={`control-button ${!isMuted ? 'active' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        <button
          onClick={handleToggleRecording}
          className={`control-button ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <CircleDot />
        </button>

        <button
          onClick={() => setShowInvitePopup(true)}
          className="control-button"
          title="Add Guest"
        >
          <UserPlus />
        </button>

        <button
          onClick={handleEndSession}
          className="control-button end-call"
          title="End Session"
        >
          <PhoneOff />
        </button>
      </div>

      <div className="participant-count">
        Participants: {participantCount}
      </div>

      {showInvitePopup && (
        <div className="invite-popup">
          <div className="invite-popup-content">
            <button 
              className="close-button" 
              onClick={() => setShowInvitePopup(false)}
              title="Close"
            >
              <X />
            </button>
            <h2 className="invite-title">Invite Guest</h2>
            <div className="invite-key-container">
              <p className="invite-key">{inviteKey}</p>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(inviteKey)}
                title="Copy to Clipboard"
              >
                {copied ? (
                  <>
                    <Check className="icon" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="icon" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="share-options">
              <button
                type="button"
                className="share-option whatsapp"
                onClick={() => handleShare('whatsapp')}
              >
                Share via WhatsApp
              </button>
              <button
                type="button"
                className="share-option email"
                onClick={() => handleShare('email')}
              >
                Share via Email
              </button>
              <button
                type="button"
                className="share-option sms"
                onClick={() => handleShare('sms')}
              >
                Share via SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};