import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const socket = ref(null)
  const isConnected = ref(false)
  const error = ref(null)

  const connect = () => {
    try {
      socket.value = io(url, {
        transports: ['websocket'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      socket.value.on('connect', () => {
        isConnected.value = true
        error.value = null
        console.log('Connected to mission control server')
      })

      socket.value.on('disconnect', () => {
        isConnected.value = false
        console.log('Disconnected from mission control server')
      })

      socket.value.on('connect_error', (err) => {
        error.value = err.message
        isConnected.value = false
        console.error('Connection error:', err)
      })

    } catch (err) {
      error.value = err.message
      console.error('Socket initialization error:', err)
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect
  }
}
// Usage example in a Vue component:
// <template>
//   <div>                                                                                    
//     <p v-if="isConnected">Connected to server</p>
//     <p v-else>Disconnected from server</p>
//     <p v-if="error">Error: {{ error }}</p>
//   </div> 
// </template>
//
// <script>
// import { useSocket } from '@/composables/useSocket'
// export default {
//   setup() {
//     const { socket, isConnected, error, connect, disconnect } = useSocket('http://localhost:3000')   
//     return { socket, isConnected, error, connect, disconnect }
//   }
// }
// </script>
// This code defines a Vue composable function `useSocket` that manages a WebSocket connection using Socket.IO.
// It provides reactive properties for the socket instance, connection status, and any errors that occur.
// The composable handles connection and disconnection logic, including error handling.
// It can be used in Vue components to easily manage WebSocket connections and display connection status.
// The composable uses Vue's `ref` for reactivity and lifecycle hooks `onMounted` and `onUnmounted` to manage the socket connection lifecycle.
// The `useSocket` function can be imported and used in any Vue component to establish a WebSocket connection
// to a specified URL, handle connection events, and manage the connection state.