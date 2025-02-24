import { io } from 'socket.io-client';
import { getToken } from './auth'; // implement this to get token from storage

const { protocol, hostname } = window.location;
const port = 3001; // Your backend server port

export const socket = io(`${protocol}//${hostname}:${port}`, {
  auth: {
    token: getToken()
  }
});