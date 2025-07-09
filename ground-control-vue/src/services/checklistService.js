import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

export const checklistService = {
  toggleItem(id) {
    return new Promise((resolve, reject) => {
      console.log('Sending toggle request for item:', id)
      
      // Add timeout to prevent hanging promises
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out after 5 seconds'));
      }, 5000);
      
      socket.emit('checklist-toggle', id, (response) => {
        // Clear timeout since we got a response
        clearTimeout(timeout);
        
        if (response && response.success) {
          console.log('Toggle successful:', response.data)
          resolve(response.data)
        } else {
          const errorMsg = response?.error || 'Unknown server error';
          console.error('Toggle failed:', errorMsg)
          reject(new Error(errorMsg))
        }
      })
    })
  },

  getChecklist() {
    return new Promise((resolve, reject) => {
      socket.emit('get-checklist', (response) => {
        if (response.success) {
          resolve(response.data)
        } else {
          reject(response.error)
        }
      })
    })
  }
}