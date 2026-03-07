import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: {
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWE5MGM3Y2M4ZTY5ZjljMThhNTYzOGIiLCJlbWFpbCI6Im5pdGluc2Vtd2FsQGdtYWlsLmNvbSIsInNlc3Npb25JZCI6IjljMmUwMjA2LWM0YjktNDQ0Zi1hNzNmLWExMTFmYzhlZmNkYiIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3NzI3OTQzNjksImV4cCI6MTc3MzM5OTE2OX0.4h6VVIRKNjBrMGde-P7snDA15LWyooo5KNbvAItnAu8',
  },
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  socket.emit('chat:send', {
    projectId: '69aa556d0149c3221a9fccfe',
    content: 'Hello from Nitin Semwal',
  });
});

socket.on('chat:receive', (msg) => {
  console.log('Message received:', msg);
});
