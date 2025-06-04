import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store checklist state
let checklist = [
  { id: 1, text: 'Rocket physical inspection complete', completed: false },
  { id: 2, text: 'Motor installation verified', completed: false },
  { id: 3, text: 'Recovery system armed', completed: false },
  { id: 4, text: 'Electronics & battery check', completed: false },
  { id: 5, text: 'Communication link verified', completed: false },
  { id: 6, text: 'Launch pad clear', completed: false },
  { id: 7, text: 'Weather conditions acceptable', completed: false },
  { id: 8, text: 'RSO approval received', completed: false }
];

io.on('connection', (socket) => {
  console.log('Client connected with ID:', socket.id);

  // Send initial checklist state to new clients
  socket.emit('checklist-update', checklist);

  socket.on('get-checklist', (callback) => {
    console.log('Get checklist requested');
    callback({ success: true, data: checklist });
  });

  socket.on('checklist-toggle', (id, callback) => {
    console.log('Toggle requested for item:', id);
    const item = checklist.find(item => item.id === id);
    if (item) {
      item.completed = !item.completed;
      console.log('Item updated:', item);
      // Broadcast to all clients including sender
      io.emit('checklist-update', checklist);
      callback({ success: true, data: item });
    } else {
      console.error('Item not found:', id);
      callback({ success: false, error: 'Item not found' });
    }
  });

  socket.on('checklist-updated', (updatedChecklist) => {
    console.log('Checklist update received:', updatedChecklist);
    checklist = updatedChecklist;
    // Broadcast to all other clients
    socket.broadcast.emit('checklist-update', checklist);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});