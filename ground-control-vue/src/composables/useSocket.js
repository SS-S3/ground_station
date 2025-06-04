import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const socket = ref(null)
  const isConnected = ref(false)

  onMounted(() => {
    console.log('Initializing socket connection to:', url)
    socket.value = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket']
    })

    socket.value.on('connect', () => {
      console.log('Socket connected, ID:', socket.value.id)
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
      isConnected.value = false
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  onUnmounted(() => {
    if (socket.value) {
      console.log('Cleaning up socket connection')
      socket.value.disconnect()
    }
  })

  return {
    socket,
    isConnected
  }
}
// Usage example in a Vue component:
// <template>
//   <div>                                                                                    
//     <p v-if="isConnected">Connected to server</p>
//     <p v-else>Disconnected from server</p>
//   </div> 
// </template>
//
// <script>
// import { useSocket } from '@/composables/useSocket'
// export default {
//   setup() {
//     const { socket, isConnected } = useSocket('http://localhost:3000')   
//     return { socket, isConnected }
//   }
// }
// </script>
// This code defines a Vue composable function `useSocket` that manages a WebSocket connection using Socket.IO.
// It provides reactive properties for the socket instance and connection status.
// The composable handles connection and disconnection logic.
// It can be used in Vue components to easily manage WebSocket connections and display connection status.
// The composable uses Vue's `ref` for reactivity and lifecycle hooks `onMounted` and `onUnmounted` to manage the socket connection lifecycle.
// The `useSocket` function can be imported and used in any Vue component to establish a WebSocket connection
// to a specified URL, handle connection events, and manage the connection state.