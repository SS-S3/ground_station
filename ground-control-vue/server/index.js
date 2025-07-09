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

// Store checklist state with auto-unlock timers
let checklist = [
  { id: 1, text: 'Rocket physical inspection complete', completed: false, unlocked: true },
  { id: 2, text: 'Motor installation verified', completed: false, unlocked: false },
  { id: 3, text: 'Recovery system armed', completed: false, unlocked: false },
  { id: 4, text: 'Electronics & battery check', completed: false, unlocked: false },
  { id: 5, text: 'Communication link verified', completed: false, unlocked: false },
  { id: 6, text: 'Launch pad clear', completed: false, unlocked: false },
  { id: 7, text: 'Weather conditions acceptable', completed: false, unlocked: false },
  { id: 8, text: 'RSO approval received', completed: false, unlocked: false }
];

// Store active timers for unlocking next items
const unlockTimers = {};

io.on('connection', (socket) => {
  console.log('Client connected with ID:', socket.id);

  // Send initial checklist state to new clients
  // Use a deep clone to avoid reference issues
  const checklist_copy = JSON.parse(JSON.stringify(checklist));
  console.log('Sending initial checklist state to new client:', checklist_copy);
  socket.emit('checklist-update', checklist_copy);

  socket.on('get-checklist', (callback) => {
    console.log('Get checklist requested');
    callback({ success: true, data: checklist });
  });

  socket.on('checklist-toggle', (id, callback) => {
    console.log('Toggle requested for item:', id);
    
    try {
      // Find the item and its index
      const item = checklist.find(item => item.id === id);
      const index = checklist.findIndex(item => item.id === id);
      
      if (!item) {
        console.error('Item not found:', id);
        callback({ success: false, error: 'Item not found' });
        return;
      }
      
      // For toggle to true: only allow if the item is unlocked
      // For toggle to false: always allow unchecking items
      const isTogglingToCompleted = !item.completed;
      
      // Debug the state to help troubleshoot
      console.log(`Item ${id} - Current state: ${item.completed}, Toggling to: ${isTogglingToCompleted}`);
      console.log(`Item index: ${index}, Unlocked: ${item.unlocked}`);
      
      // Improved validation logic - check if item is unlocked
      let isValidToggle = item.unlocked || !isTogglingToCompleted;
      
      if (!isValidToggle) {
        callback({ 
          success: false, 
          error: 'This item is locked. Please wait for it to unlock.',
          data: item
        });
        return;
      }
      
      // Toggle the current item's state
      if (isTogglingToCompleted) {
        // We're checking this item
        item.completed = true;
        console.log(`Item ${id} marked as completed`);
        
        // Start a timer to unlock the next item (if there is one)
        const nextIndex = index + 1;
        if (nextIndex < checklist.length) {
          const nextItem = checklist[nextIndex];
          const nextId = nextItem.id;
          
          console.log(`Starting 5-second timer to unlock next item ${nextId}`);
          
          // Clear any existing timer for this next item
          if (unlockTimers[nextId]) {
            clearTimeout(unlockTimers[nextId]);
          }
          
          // Set new timer to unlock the next item after 5 seconds
          unlockTimers[nextId] = setTimeout(() => {
            if (!nextItem.unlocked) {
              nextItem.unlocked = true;
              console.log(`Item ${nextId} automatically unlocked after 5-second delay`);
              
              // Broadcast the updated checklist
              const timerUpdatedChecklist = JSON.parse(JSON.stringify(checklist));
              io.emit('checklist-update', timerUpdatedChecklist);
            }
            
            // Clear the timer reference
            delete unlockTimers[nextId];
          }, 5000); // 5-second delay
        }
      } else {
        // We're unchecking - cascade to uncheck all subsequent items as well
        for (let i = index; i < checklist.length; i++) {
          if (checklist[i].completed) {
            console.log(`Cascading uncheck to item ${checklist[i].id}`);
            checklist[i].completed = false;
          }
          
          // Lock all subsequent items except the current one
          if (i > index) {
            checklist[i].unlocked = false;
            
            // Clear any existing timers for this item
            if (unlockTimers[checklist[i].id]) {
              clearTimeout(unlockTimers[checklist[i].id]);
              delete unlockTimers[checklist[i].id];
            }
          }
        }
      }
      
      // Verify the updated state before broadcasting
      console.log('Updated checklist state:');
      checklist.forEach(item => console.log(`Item ${item.id}: completed=${item.completed}, unlocked=${item.unlocked}`));
      
      // Deep clone the checklist to avoid reference issues
      const updatedChecklist = JSON.parse(JSON.stringify(checklist));
      
      // Use non-recursive approach to avoid stack overflow
      setTimeout(() => {
        // Broadcast to all clients including sender
        io.emit('checklist-update', updatedChecklist);
        
        // Send success response with updated item
        const updatedItem = JSON.parse(JSON.stringify(item)); // Clone to avoid reference issues
        callback({ success: true, data: updatedItem });
      }, 0);
    } catch (error) {
      console.error('Error processing checklist toggle:', error);
      callback({ success: false, error: 'Internal server error' });
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
  
  // Add system arming confirmation handler
  socket.on('arm-system', () => {
    console.log('System arming requested');
    
    // Use non-blocking timeout to avoid stack overflow
    setTimeout(() => {
      // Broadcast to all clients
      io.emit('system-armed');
    }, 0);
  });
  
  // Add launch confirmation handler with delayed processing
  socket.on('launch-rocket', () => {
    console.log('Launch sequence initiated');
    
    // Use non-blocking timeout to avoid stack overflow
    setTimeout(() => {
      // Broadcast to all clients
      io.emit('launch-sequence-initiated');
    }, 0);
  });
});

const PORT = 3001;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});