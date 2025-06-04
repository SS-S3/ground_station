import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

export const checklistService = {
  toggleItem(id) {
    return new Promise((resolve, reject) => {
      console.log('Sending toggle request for item:', id)
      socket.emit('checklist-toggle', id, (response) => {
        if (response.success) {
          console.log('Toggle successful:', response.data)
          resolve(response.data)
        } else {
          console.error('Toggle failed:', response.error)
          reject(response.error)
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