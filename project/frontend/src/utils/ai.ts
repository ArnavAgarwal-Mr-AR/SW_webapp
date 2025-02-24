import { User } from '../types';
import { Language } from '../types/ai';
import { MODAL_API_URL, MODAL_TOKEN, MODAL_SECRET } from '../modal/config';

export const AI_USER: User = {
  id: 'ai-host',
  name: 'AI Host',
  email: 'ai@podcast.com',
  avatar: 'https://unsplash.com/photos/a-man-with-a-beard-wearing-a-plaid-shirt-SoVpY7e4D5A?auto=format&fit=crop&q=80&w=200&h=200'
};

const headers = {
  'Authorization': `Bearer ${MODAL_TOKEN}:${MODAL_SECRET}`,
  'Content-Type': 'application/json'
};

export async function processAudioInput(audioBlob: Blob, language: Language): Promise<string> {
  // Convert Blob to base64
  const buffer = await audioBlob.arrayBuffer();
  const base64Audio = Buffer.from(buffer).toString('base64');
  
  const response = await fetch(`${MODAL_API_URL}/podcast-ai/process_audio`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audio: base64Audio,
      language: language.code
    })
  });
  
  const data = await response.json();
  return data.transcription;
}

export async function generateAIResponse(text: string, language: Language): Promise<string> {
  const response = await fetch(`${MODAL_API_URL}/podcast-ai/process_audio`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text,
      language: language.code
    })
  });
  
  const data = await response.json();
  return data.response;
}

export async function convertTextToSpeech(text: string, language: Language): Promise<ArrayBuffer> {
  const response = await fetch(`${MODAL_API_URL}/podcast-ai/process_audio`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text,
      language: language.code
    })
  });
  
  const data = await response.json();
  return Buffer.from(data.audio, 'base64').buffer;
}