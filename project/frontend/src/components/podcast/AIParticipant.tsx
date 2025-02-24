import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic } from 'lucide-react';
import { processAudioInput, generateAIResponse, convertTextToSpeech, AI_USER } from '../../utils/ai';
import { Language, SUPPORTED_LANGUAGES } from '../../types/ai';
import { LanguageSelector } from './LanguageSelector';

export const AIParticipant = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isAI: boolean }>>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    audioContext.current = new AudioContext();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];
        
        const transcription = await processAudioInput(audioBlob, selectedLanguage);
        setMessages(prev => [...prev, { text: transcription, isAI: false }]);
        
        const aiResponse = await generateAIResponse(transcription, selectedLanguage);
        setMessages(prev => [...prev, { text: aiResponse, isAI: true }]);
        
        const audioBuffer = await convertTextToSpeech(aiResponse, selectedLanguage);
        const audioSource = audioContext.current!.createBufferSource();
        audioSource.buffer = await audioContext.current!.decodeAudioData(audioBuffer);
        audioSource.connect(audioContext.current!.destination);
        audioSource.start();
      };
      
      mediaRecorder.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopListening = () => {
    mediaRecorder.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
          <img
            src={AI_USER.avatar}
            alt={AI_USER.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="font-medium">{AI_USER.name}</p>
          <span className="text-sm text-primary-600 dark:text-primary-400">
            {isListening ? 'Listening...' : 'Ready to chat'}
          </span>
        </div>
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageSelect={setSelectedLanguage}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 min-h-[200px] overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isAI
                  ? 'bg-primary-100 dark:bg-primary-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-4 rounded-full ${
            isListening
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400'
              : 'bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-400'
          }`}
        >
          <Mic className={`h-6 w-6 ${isListening ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
};