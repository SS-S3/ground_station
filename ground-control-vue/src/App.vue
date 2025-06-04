<template>
  <div class="mission-control">
    <HeaderComponent 
      :mission-timer="missionTimer"
      :current-phase="currentPhase"
      :current-time="currentTime"
    />
    
    <div class="main-content">
      <LeftPanel 
        :checklist="prelaunchChecklist"
        :system-health="systemHealth"
        :is-armed="isArmed"
        :is-launched="isLaunched"
        @arm-system="armSystem"
        @launch-rocket="showLaunchConfirmation"
        @toggle-checklist="toggleChecklistItem"
      />
      
      <CenterPanel 
        :telemetry-data="telemetryData"
        :flight-data="flightData"
        :is-launched="isLaunched"
        :current-phase="currentPhase"
      />
      
      <RightPanel 
        :telemetry-data="telemetryData"
        :performance-metrics="performanceMetrics"
        @emergency-action="handleEmergencyAction"
      />
    </div>
    
    <StatusBar :communication-data="telemetryData.communication" />
    
    <Transition name="fade">
      <ConfirmDialog 
        v-if="showDialog"
        :title="dialogTitle"
        :message="dialogMessage"
        @confirm="handleDialogConfirm"
        @cancel="hideDialog"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import HeaderComponent from './components/HeaderComponent.vue'
import LeftPanel from './components/LeftPanel.vue'
import CenterPanel from './components/CenterPanel.vue'
import RightPanel from './components/RightPanel.vue'
import StatusBar from './components/StatusBar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useSocket } from './composables/useSocket'
import { checklistService } from './services/checklistService'

// Socket connection
const { socket, isConnected } = useSocket('http://localhost:3001')

// Reactive state
const missionStartTime = ref(null)
const currentPhase = ref('Pre-launch')
const isLaunched = ref(false)
const isArmed = ref(false)
const missionTimer = ref('T- 00:00:00')
const currentTime = ref(new Date().toLocaleTimeString())
const showDialog = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogCallback = ref(null)

const telemetryData = reactive({
  altitude: 920,
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  attitude: { roll: 0, pitch: 0, yaw: 0 },
  gps: { lat: 12.9716, lon: 77.5946, alt: 920 },
  temperature: { external: 25, internal: 30, motor: 25 },
  pressure: 1013.25,
  battery: { voltage: 12.6, current: 2.1, percentage: 95 },
  communication: { signalStrength: -45, packetRate: 10, quality: 98 }
})

const systemHealth = reactive({
  navigation: 'good',
  communication: 'good',
  power: 'good',
  propulsion: 'good',
  recovery: 'good',
  payload: 'good'
})

const performanceMetrics = reactive({
  maxAltitude: 920,
  peakVelocity: 0,
  flightDuration: 0,
  range: 0
})

const prelaunchChecklist = reactive([
  { id: 1, text: 'Rocket physical inspection complete', completed: false },
  { id: 2, text: 'Motor installation verified', completed: false },
  { id: 3, text: 'Recovery system armed', completed: false },
  { id: 4, text: 'Electronics & battery check', completed: false },
  { id: 5, text: 'Communication link verified', completed: false },
  { id: 6, text: 'Launch pad clear', completed: false },
  { id: 7, text: 'Weather conditions acceptable', completed: false },
  { id: 8, text: 'RSO approval received', completed: false }
])

const flightData = reactive({
  time: [],
  altitude: [],
  velocity: [],
  acceleration: { x: [], y: [], z: [] },
  temperature: [],
  pressure: []
})

// Socket event handlers
const setupSocketListeners = () => {
  if (!socket.value) return

  // Clean up any existing listeners first
  socket.value.removeAllListeners()

  socket.value.on('checklist-update', (updatedChecklist) => {
    // Update the checklist items one by one
    updatedChecklist.forEach(updatedItem => {
      const index = prelaunchChecklist.findIndex(item => item.id === updatedItem.id)
      if (index !== -1) {
        prelaunchChecklist[index].completed = updatedItem.completed
      }
    })
    
    // Check arming conditions after update
    checkArmingConditions()
  })

  socket.value.on('system-armed', () => {
    isArmed.value = true
  })

  socket.value.on('launch-sequence-initiated', () => {
    if (!isArmed.value) return
    currentPhase.value = 'Launch Sequence'
    startLaunchSequence()
  })

  socket.value.on('telemetry-update', (data) => {
    Object.assign(telemetryData, data)
    updateFlightData(data)
    updatePerformanceMetrics(data)
  })
}

// Add launch sequence handler
const startLaunchSequence = () => {
  if (!isArmed.value) return
  
  let countdown = 5
  showDialog.value = true
  dialogTitle.value = 'Launch Sequence'
  
  const countdownInterval = setInterval(() => {
    if (countdown > 0) {
      dialogMessage.value = `Launch in ${countdown}...`
      countdown--
    } else {
      clearInterval(countdownInterval)
      hideDialog()
      executeLaunch()
    }
  }, 1000)
}

const executeLaunch = () => {
  if (!isArmed.value) return
  
  try {
    socket.value?.emit('launch-rocket')
    isLaunched.value = true
    missionStartTime.value = Date.now()
    currentPhase.value = 'Powered Ascent'
    startTelemetrySimulation()
  } catch (error) {
    console.error('Launch failed:', error)
    isLaunched.value = false
    currentPhase.value = 'Pre-launch'
  }
}

// Update the toggleChecklistItem method
const toggleChecklistItem = async (id) => {
  console.log('App: Toggle checklist item:', id)
  try {
    const itemIndex = prelaunchChecklist.findIndex(item => item.id === id)
    if (itemIndex === -1) {
      console.error('Item not found:', id)
      return
    }

    const currentState = prelaunchChecklist[itemIndex].completed
    
    // Optimistically update UI
    prelaunchChecklist[itemIndex].completed = !currentState
    
    // Simulate system check
    await simulateSystemCheck(id)
    
    // Update backend
    const result = await checklistService.toggleItem(id)
    console.log('Toggle result:', result)
    
    // Update checklist state based on server response
    prelaunchChecklist[itemIndex].completed = result.completed
    
    // Check arming conditions
    if (prelaunchChecklist.every(item => item.completed)) {
      console.log('All items completed, checking arm conditions')
      checkArmingConditions()
    }
  } catch (error) {
    console.error('Checklist toggle failed:', error)
    // Revert optimistic update on failure
    const itemIndex = prelaunchChecklist.findIndex(item => item.id === id)
    if (itemIndex !== -1) {
      prelaunchChecklist[itemIndex].completed = !prelaunchChecklist[itemIndex].completed
    }
  }
}

// Update the armSystem method
const armSystem = async () => {
  console.log('App: Arming system requested')
  try {
    if (!prelaunchChecklist.every(item => item.completed)) {
      console.log('Cannot arm: checklist incomplete')
      return
    }

    socket.value?.emit('arm-system')
    isArmed.value = true
    console.log('System armed successfully')
    
    showConfirmDialog(
      'System Armed',
      'System is armed and ready for launch. Verify launch conditions.',
      null
    )
  } catch (error) {
    console.error('System arming failed:', error)
    isArmed.value = false
    showConfirmDialog(
      'Arming Failed',
      'Failed to arm the system. Please try again.',
      null
    )
  }
}

const showLaunchConfirmation = () => {
  if (isArmed.value) {
    showConfirmDialog('Launch Confirmation', 'Are you sure you want to launch the rocket? This action cannot be undone.', launchRocket)
  }
}

const handleEmergencyAction = (action) => {
  const actions = {
    'emergency-stop': () => showConfirmDialog('Emergency Stop', 'This will immediately abort the mission. Continue?', () => socket.value?.emit('emergency-stop')),
    'flight-termination': () => showConfirmDialog('Flight Termination', 'This will terminate the flight. Continue?', () => socket.value?.emit('flight-termination')),
    'deploy-recovery': () => showConfirmDialog('Deploy Recovery', 'Deploy recovery system now?', () => socket.value?.emit('deploy-recovery')),
    'return-to-launch': () => showConfirmDialog('Return to Launch', 'Command return to launch site?', () => socket.value?.emit('return-to-launch'))
  }
  
  actions[action]?.()
}

const showConfirmDialog = (title, message, callback) => {
  // Clear any existing dialog first
  hideDialog()
  
  // Set new dialog properties
  dialogTitle.value = title
  dialogMessage.value = message
  dialogCallback.value = callback
  showDialog.value = true
}

const handleDialogConfirm = () => {
  const callback = dialogCallback.value
  hideDialog()
  if (callback) {
    setTimeout(callback, 0) // Execute callback after dialog is hidden
  }
}

const hideDialog = () => {
  showDialog.value = false
  dialogTitle.value = ''
  dialogMessage.value = ''
  dialogCallback.value = null
}

const updateFlightData = (data) => {
  if (!isLaunched.value) return
  
  const currentTime = ((Date.now() - missionStartTime.value) / 1000).toFixed(1)
  flightData.time.push(currentTime)
  flightData.altitude.push(data.altitude)
  flightData.velocity.push(Math.sqrt(data.velocity.x ** 2 + data.velocity.y ** 2 + data.velocity.z ** 2))
  flightData.acceleration.x.push(data.acceleration.x)
  flightData.acceleration.y.push(data.acceleration.y)
  flightData.acceleration.z.push(data.acceleration.z)
  flightData.temperature.push(data.temperature.external)
  flightData.pressure.push(data.pressure)
  
  // Keep only last 100 points for performance
  const maxPoints = 100
  Object.keys(flightData).forEach(key => {
    if (key === 'acceleration') {
      Object.keys(flightData.acceleration).forEach(axis => {
        if (flightData.acceleration[axis].length > maxPoints) {
          flightData.acceleration[axis].shift()
        }
      })
    } else if (Array.isArray(flightData[key]) && flightData[key].length > maxPoints) {
      flightData[key].shift()
    }
  })
}

const updatePerformanceMetrics = (data) => {
  const totalVelocity = Math.sqrt(data.velocity.x ** 2 + data.velocity.y ** 2 + data.velocity.z ** 2)
  performanceMetrics.maxAltitude = Math.max(performanceMetrics.maxAltitude, data.altitude)
  performanceMetrics.peakVelocity = Math.max(performanceMetrics.peakVelocity, totalVelocity)
  
  if (missionStartTime.value) {
    performanceMetrics.flightDuration = (Date.now() - missionStartTime.value) / 1000
  }
  
  // Calculate range (simplified)
  if (data.gps && data.gps.lat && data.gps.lon) {
    const baseLat = 12.9716
    const baseLon = 77.5946
    const deltaLat = data.gps.lat - baseLat
    const deltaLon = data.gps.lon - baseLon
    performanceMetrics.range = Math.sqrt(deltaLat ** 2 + deltaLon ** 2) * 111000 // Rough conversion to meters
  }
}

// Timer updates
const updateTimers = () => {
  currentTime.value = new Date().toLocaleTimeString()
  
  if (missionStartTime.value) {
    const elapsed = Date.now() - missionStartTime.value
    const seconds = Math.floor(elapsed / 1000) % 60
    const minutes = Math.floor(elapsed / 60000) % 60
    const hours = Math.floor(elapsed / 3600000)
    missionTimer.value = `T+ ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    missionTimer.value = 'T- 00:00:00'
  }
}

// Check arming conditions
const checkArmingConditions = () => {
  const allCompleted = prelaunchChecklist.every(item => item.completed)
  if (allCompleted && !isArmed.value) {
    showConfirmDialog(
      'System Ready',
      'All checks complete. Proceed with system arming?',
      armSystem
    )
  }
}

// Lifecycle hooks
onMounted(() => {
  setupSocketListeners()
  setInterval(updateTimers, 1000)
})

onUnmounted(() => {
  socket.value?.disconnect()
})
</script>






