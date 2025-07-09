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
        :test-mode="testMode"
        @arm-system="armSystem"
        @launch-rocket="showLaunchConfirmation"
        @toggle-checklist="toggleChecklistItem"
        @show-confirm="showConfirmationDialog"
      />
      
      <CenterPanel 
        :telemetry-data="telemetryData"
        :flight-data="flightData"
        :is-launched="isLaunched"
        :current-phase="currentPhase"
        :test-mode="testMode"
      />
      
      <RightPanel 
        :telemetry-data="telemetryData"
        :performance-metrics="performanceMetrics"
        :test-mode="testMode"
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
const testMode = ref(true) // Test mode is ON by default for debugging

const telemetryData = reactive({
  altitude: 0,
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  attitude: { roll: 0, pitch: 0, yaw: 0 },
  gps: { lat: 28.5355, lon: 77.3910, alt: 0 },
  temperature: { external: 25, internal: 30, motor: 25 },
  pressure: 1013.25,
  battery: { voltage: 12.6, current: 2.1, percentage: 95 },
  communication: { signalStrength: -45, packetRate: 10, quality: 98 },
  flightPhase: 'Pre-Launch',
  missionTime: 0,
  maxAltitude: 0,
  maxVelocity: 0,
  range: 0
})

const systemHealth = reactive({
  navigation: 'good',
  communication: 'good',
  power: 'good',
  propulsion: 'good',
  recovery: 'good',
  payload: 'good',
  telemetry: 'good',
  avionics: 'good'
})

const performanceMetrics = reactive({
  maxAltitude: 0,
  peakVelocity: 0,
  flightDuration: 0,
  range: 0,
  latitude: 28.5355,
  longitude: 77.3910,
  burnTime: 0,
  coastTime: 0,
  descentTime: 0,
  totalImpulse: 0,
  averageAcceleration: 0,
  maxAcceleration: 0
})

const prelaunchChecklist = reactive([
  { id: 1, text: 'Rocket physical inspection complete', completed: false, unlocked: true },
  { id: 2, text: 'Motor installation verified', completed: false, unlocked: false },
  { id: 3, text: 'Recovery system armed', completed: false, unlocked: false },
  { id: 4, text: 'Electronics & battery check', completed: false, unlocked: false },
  { id: 5, text: 'Communication link verified', completed: false, unlocked: false },
  { id: 6, text: 'Launch pad clear', completed: false, unlocked: false },
  { id: 7, text: 'Weather conditions acceptable', completed: false, unlocked: false },
  { id: 8, text: 'RSO approval received', completed: false, unlocked: false }
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
    console.log('Received checklist update from server:', updatedChecklist);
    
    // Update the checklist items one by one
    updatedChecklist.forEach(updatedItem => {
      const index = prelaunchChecklist.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        // Use direct assignment to avoid reactivity issues
        prelaunchChecklist[index].completed = updatedItem.completed;
        
        // Handle the unlocked property from the server
        if ('unlocked' in updatedItem) {
          prelaunchChecklist[index].unlocked = updatedItem.unlocked;
          console.log(`Updated item ${updatedItem.id}: completed=${updatedItem.completed}, unlocked=${updatedItem.unlocked}`);
        } else {
          console.log(`Updated item ${updatedItem.id} to ${updatedItem.completed}`);
        }
      }
    });
    
    // Verify the local state after update
    console.log('Current checklist state after update:');
    prelaunchChecklist.forEach(item => console.log(`Item ${item.id}: completed=${item.completed}, unlocked=${item.unlocked || false}`));
    
    // Check arming conditions after update
    checkArmingConditions();
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
    // Only update flight data if not in simulation mode
    if (!telemetryInterval) {
      updateFlightData(data)
      updatePerformanceMetrics(data)
    }
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

// System check simulation with timeout
const simulateSystemCheck = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`System check completed for item ${id}`)
      resolve(true)
    }, 500)
  })
}

// Security validation for checklist actions
const validateChecklistAction = (id) => {
  if (testMode.value) return true // Bypass all checks in test mode
  
  // Check if launched - absolute block
  if (isLaunched.value) {
    showConfirmDialog('Action Denied', 'Cannot modify checklist after launch.', null)
    return false
  }
  
  // Check if armed - require confirmation
  if (isArmed.value) {
    const confirmed = confirm('System is armed. Are you sure you want to modify the checklist?\n\nThis may affect launch readiness.')
    if (!confirmed) return false
  }
  
  // Time-based security check - prevent rapid toggling
  const now = Date.now()
  const lastToggleTime = localStorage.getItem(`checklist_${id}_lastToggle`)
  if (lastToggleTime && (now - parseInt(lastToggleTime)) < 2000) {
    showConfirmDialog('Action Denied', 'Please wait 2 seconds between checklist modifications.', null)
    return false
  }
  
  // Store timestamp
  localStorage.setItem(`checklist_${id}_lastToggle`, now.toString())
  
  return true
}

// Enhanced toggleChecklistItem with security checks and improved backend communication
const toggleChecklistItem = async (id) => {
  console.log('App: Toggle checklist item:', id)
  
  // Security validation
  if (!validateChecklistAction(id)) {
    return
  }
  
  try {
    const itemIndex = prelaunchChecklist.findIndex(item => item.id === id)
    if (itemIndex === -1) {
      console.error('Item not found:', id)
      return
    }

    const currentState = prelaunchChecklist[itemIndex].completed
    
    // Show loading state
    const item = prelaunchChecklist[itemIndex]
    const originalText = item.text
    item.text = `${originalText} (Checking...)`
    
    // Simulate system check
    await simulateSystemCheck(id)
    
    // Restore original text
    item.text = originalText
    
    // Don't update local state yet - wait for backend confirmation
    
    // Use checklistService to communicate with backend
    try {
      // This will send a WebSocket message to the server
      await checklistService.toggleItem(id)
      
      // The backend will broadcast the updated checklist to all clients,
      // which will be handled by the socket listener in setupSocketListeners
      
      console.log('Checklist toggle request sent to server successfully')
      
      // Note: Don't check arming conditions here - wait for the server's response
      // The checklist update handler will check arming conditions
      
    } catch (error) {
      console.error('Backend update failed:', error)
      // Revert local state on backend failure
      prelaunchChecklist[itemIndex].completed = currentState
      showConfirmDialog('Update Failed', 'Failed to update checklist item. Please try again.', null)
    }
    
  } catch (error) {
    console.error('Checklist toggle failed:', error)
    showConfirmDialog('System Error', 'System check failed. Please verify hardware connections.', null)
  }
}

// Security validation for arming system
const validateArmingConditions = () => {
  if (testMode.value) return { isValid: true, errors: [] } // Bypass all checks in test mode
  
  const errors = []
  
  // Check if all checklist items are completed
  if (!prelaunchChecklist.every(item => item.completed)) {
    errors.push('All checklist items must be completed')
  }
  
  // Check system health
  const criticalSystems = ['navigation', 'communication', 'power', 'propulsion']
  const failedSystems = criticalSystems.filter(system => systemHealth[system] !== 'good')
  if (failedSystems.length > 0) {
    errors.push(`Critical system failures: ${failedSystems.join(', ')}`)
  }
  
  // Check battery level
  if (telemetryData.battery.percentage < 50) {
    errors.push('Battery level too low for launch (minimum 50%)')
  }
  
  // Check communication quality
  if (telemetryData.communication.quality < 80) {
    errors.push('Communication quality insufficient for arming (minimum 80%)')
  }
  
  // Check if already launched
  if (isLaunched.value) {
    errors.push('System already launched')
  }
  
  // Check if already armed
  if (isArmed.value) {
    errors.push('System already armed')
  }
  
  // Time-based security check - prevent rapid arming attempts
  const now = Date.now()
  const lastArmAttempt = localStorage.getItem('lastArmAttempt')
  if (lastArmAttempt && (now - parseInt(lastArmAttempt)) < 10000) {
    errors.push('Please wait 10 seconds between arming attempts')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Enhanced armSystem method with security checks
const armSystem = async () => {
  console.log('App: Arming system requested')
  
  // Store timestamp for security check
  localStorage.setItem('lastArmAttempt', Date.now().toString())
  
  try {
    // Validate arming conditions
    const validation = validateArmingConditions()
    
    if (!validation.isValid) {
      const errorMessage = `Cannot arm system:\n${validation.errors.join('\n')}`
      showConfirmDialog('Arming Failed', errorMessage, null)
      return
    }
    
    // Double confirmation for arming
    const userConfirmed = await new Promise((resolve) => {
      showConfirmDialog(
        'Confirm System Arming',
        'WARNING: This will arm the rocket system.\n\nAll systems will be live and ready for launch.\n\nProceed with arming?',
        () => resolve(true)
      )
      // Add a cancel option
      setTimeout(() => resolve(false), 10000) // Auto-cancel after 10 seconds
    })
    
    if (!userConfirmed) {
      console.log('System arming cancelled by user')
      return
    }
    
    // Additional security prompt
    const securityCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const userCode = prompt(`Security Check Required\n\nEnter the 3-digit code: ${securityCode}`)
    
    if (userCode !== securityCode) {
      showConfirmDialog('Security Check Failed', 'Incorrect security code. Arming cancelled.', null)
      return
    }
    
    // Simulate arming process
    showConfirmDialog('Arming System', 'Arming system components...', null)
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second arming process
    
    hideDialog()
    
    // Emit arm system event (if socket is available)
    socket.value?.emit('arm-system')
    isArmed.value = true
    
    console.log('System armed successfully')
    
    showConfirmDialog(
      'System Armed',
      '✅ System is now ARMED and ready for launch.\n\n⚠️  WARNING: Launch sequence can now be initiated.\n\nVerify all personnel are clear of launch area.',
      null
    )
    
  } catch (error) {
    console.error('System arming failed:', error)
    isArmed.value = false
    showConfirmDialog(
      'Arming Failed',
      'Failed to arm the system due to technical error.\n\nPlease check system logs and try again.',
      null
    )
  }
}

// Enhanced launch confirmation with security checks
const showLaunchConfirmation = () => {
  // Store timestamp for security check
  localStorage.setItem('lastLaunchAttempt', Date.now().toString())
  
  if (!isArmed.value) {
    showConfirmDialog('Launch Denied', 'System must be armed before launch.', null)
    return
  }
  
  if (isLaunched.value) {
    showConfirmDialog('Already Launched', 'Rocket has already been launched.', null)
    return
  }
  
  // Final pre-launch validation
  const validation = validateLaunchConditions()
  
  if (!validation.isValid) {
    const errorMessage = `Cannot launch:\n${validation.errors.join('\n')}`
    showConfirmDialog('Launch Aborted', errorMessage, null)
    return
  }
  
  // Multi-step launch confirmation
  showConfirmDialog(
    'FINAL LAUNCH CONFIRMATION', 
    '🚀 CRITICAL WARNING 🚀\n\nThis will initiate the rocket launch sequence.\n\nThis action CANNOT be undone.\n\nAre you absolutely certain you want to proceed?', 
    showSecondaryLaunchConfirmation
  )
}

// Secondary launch confirmation for extra security
const showSecondaryLaunchConfirmation = () => {
  // Generate random security phrase
  const securityPhrases = ['LAUNCH READY', 'FIRE ROCKET', 'INITIATE LAUNCH', 'GO FOR LAUNCH']
  const securityPhrase = securityPhrases[Math.floor(Math.random() * securityPhrases.length)]
  
  showConfirmDialog(
    'LAUNCH AUTHORIZATION REQUIRED',
    `🔐 SECURITY VERIFICATION 🔐\n\nType the exact phrase below to confirm launch:\n\n"${securityPhrase}"\n\n⚠️  This is your final chance to abort!`,
    () => {
      const userInput = prompt(`Security Verification:\n\nType "${securityPhrase}" to confirm launch:`)
      if (userInput === securityPhrase) {
        // Additional time delay for final consideration
        showConfirmDialog(
          'LAUNCH SEQUENCE STARTING',
          'Launch sequence will begin in 3 seconds...\n\nClick Cancel to abort!',
          () => {
            setTimeout(() => {
              launchRocket()
            }, 3000)
          }
        )
      } else {
        showConfirmDialog('Launch Cancelled', 'Launch sequence cancelled due to incorrect security phrase.', null)
      }
    }
  )
}

// Validate launch conditions
const validateLaunchConditions = () => {
  if (testMode.value) return { isValid: true, errors: [] } // Bypass all checks in test mode
  
  const errors = []
  
  // Check if system is armed
  if (!isArmed.value) {
    errors.push('System is not armed')
  }
  
  // Check if already launched
  if (isLaunched.value) {
    errors.push('Already launched')
  }
  
  // Check critical system health
  const criticalSystems = ['navigation', 'communication', 'power', 'propulsion', 'recovery']
  const failedSystems = criticalSystems.filter(system => systemHealth[system] === 'error')
  if (failedSystems.length > 0) {
    errors.push(`Critical system errors: ${failedSystems.join(', ')}`)
  }
  
  // Check battery level
  if (telemetryData.battery.percentage < 30) {
    errors.push('Battery level too low for safe launch (minimum 30%)')
  }
  
  // Check communication quality
  if (telemetryData.communication.quality < 70) {
    errors.push('Communication quality too poor for launch (minimum 70%)')
  }
  
  // Check signal strength
  if (telemetryData.communication.signalStrength > -30) {
    errors.push('Signal strength too weak for launch')
  }
  
  // Time-based security check - prevent rapid launch attempts
  const now = Date.now()
  const lastLaunchAttempt = localStorage.getItem('lastLaunchAttempt')
  if (lastLaunchAttempt && (now - parseInt(lastLaunchAttempt)) < 30000) {
    errors.push('Please wait 30 seconds between launch attempts')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Secure launch rocket method
const launchRocket = async () => {
  console.log('App: Executing launch sequence')
  
  try {
    // Final validation just before launch
    const validation = validateLaunchConditions()
    if (!validation.isValid) {
      showConfirmDialog('Launch Aborted', `Last-second abort:\n${validation.errors.join('\n')}`, null)
      return
    }
    
    // Start launch sequence
    startLaunchSequence()
    
  } catch (error) {
    console.error('Launch failed:', error)
    showConfirmDialog('Launch Failed', 'Launch sequence failed due to technical error.', null)
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

// Optimized confirmation dialog handling with reduced stack usage
const showConfirmationDialog = (params) => {
  // Use setTimeout to avoid deep call stacks
  setTimeout(() => {
    showDialog.value = true
    dialogTitle.value = params.title
    dialogMessage.value = params.message
    
    // Store action in data attribute instead of callback function to reduce stack usage
    dialogCallback.value = () => {
      hideDialog()
      
      // Use setTimeout to break the call stack chain
      setTimeout(() => {
        // Dispatch the correct action based on string identifier
        switch (params.action) {
          case 'arm-system':
            armSystem()
            break
          case 'launch-rocket':
            showLaunchConfirmation()
            break
          default:
            console.error('Unknown action:', params.action)
        }
      }, 0)
    }
  }, 0)
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

// Optimized flight data update to prevent circular references
const updateFlightData = (data) => {
  if (!isLaunched.value || !missionStartTime.value) return
  
  try {
    const currentTime = ((Date.now() - missionStartTime.value) / 1000).toFixed(1)
    const timeNum = parseFloat(currentTime)
    
    // Use direct assignment instead of reactive operations to prevent stack overflow
    flightData.time.push(timeNum)
    flightData.altitude.push(Number(data.altitude) || 0)
    flightData.velocity.push(Number(Math.sqrt(data.velocity.x ** 2 + data.velocity.y ** 2 + data.velocity.z ** 2)) || 0)
    flightData.acceleration.x.push(Number(data.acceleration.x) || 0)
    flightData.acceleration.y.push(Number(data.acceleration.y) || 0)
    flightData.acceleration.z.push(Number(data.acceleration.z) || 0)
    flightData.temperature.push(Number(data.temperature.external) || 0)
    flightData.pressure.push(Number(data.pressure) || 0)
    
    // Efficient array trimming to prevent memory issues
    const maxPoints = 500 // Reduced from 1000 for better performance
    if (flightData.time.length > maxPoints) {
      // Remove multiple items at once for efficiency
      const itemsToRemove = flightData.time.length - maxPoints
      flightData.time.splice(0, itemsToRemove)
      flightData.altitude.splice(0, itemsToRemove)
      flightData.velocity.splice(0, itemsToRemove)
      flightData.acceleration.x.splice(0, itemsToRemove)
      flightData.acceleration.y.splice(0, itemsToRemove)
      flightData.acceleration.z.splice(0, itemsToRemove)
      flightData.temperature.splice(0, itemsToRemove)
      flightData.pressure.splice(0, itemsToRemove)
    }
  } catch (error) {
    console.error('Error updating flight data:', error)
  }
}

// Optimized performance metrics update
const updatePerformanceMetrics = (data) => {
  try {
    const totalVelocity = Math.sqrt(data.velocity.x ** 2 + data.velocity.y ** 2 + data.velocity.z ** 2)
    const totalAcceleration = Math.sqrt(data.acceleration.x ** 2 + data.acceleration.y ** 2 + data.acceleration.z ** 2)
    
    // Use Math.max with current values to prevent reactive loops
    performanceMetrics.maxAltitude = Math.max(performanceMetrics.maxAltitude, Number(data.altitude) || 0)
    performanceMetrics.peakVelocity = Math.max(performanceMetrics.peakVelocity, totalVelocity || 0)
    performanceMetrics.maxAcceleration = Math.max(performanceMetrics.maxAcceleration, totalAcceleration || 0)
    
    if (missionStartTime.value) {
      performanceMetrics.flightDuration = (Date.now() - missionStartTime.value) / 1000
    }
    
    // Simplified range calculation to prevent circular references
    if (data.gps && data.gps.lat && data.gps.lon) {
      const baseLat = 28.5355
      const baseLon = 77.3910
      const deltaLat = Number(data.gps.lat) - baseLat
      const deltaLon = Number(data.gps.lon) - baseLon
      performanceMetrics.range = Math.sqrt(deltaLat ** 2 + deltaLon ** 2) * 111000 // Rough conversion to meters
      performanceMetrics.latitude = Number(data.gps.lat)
      performanceMetrics.longitude = Number(data.gps.lon)
    }
  } catch (error) {
    console.error('Error updating performance metrics:', error)
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

// Telemetry simulation system
let telemetryInterval = null
let simulationStartTime = null
let simulationPhase = 'pre-launch'
let simulationData = {
  altitude: 0,
  velocity: 0,
  acceleration: { x: 0, y: 0, z: 0 },
  temperature: 25,
  pressure: 1013.25,
  battery: 12.6,
  position: { x: 0, y: 0 },
  burnStartTime: 0,
  apogeeTime: 0,
  maxAltitude: 0
}

const startTelemetrySimulation = () => {
  if (telemetryInterval) return
  
  simulationStartTime = Date.now()
  simulationPhase = 'pre-launch'
  
  // Start immediately instead of waiting for timer
  updateTelemetrySimulation(0)
  
  telemetryInterval = setInterval(() => {
    const elapsedSeconds = (Date.now() - simulationStartTime) / 1000
    updateTelemetrySimulation(elapsedSeconds)
  }, 100) // Update every 100ms for better performance
}

const updateTelemetrySimulation = (elapsedSeconds) => {
  let altitude, velocity, accX, accY, accZ, temperature, pressure, battery, phase
  
  // Realistic rocket flight simulation
  if (elapsedSeconds < 1) {
    // Pre-Launch - but with some minor variations for charts
    phase = 'Pre-Launch'
    altitude = 0 + Math.random() * 0.5
    velocity = 0 + Math.random() * 0.1
    accX = (Math.random() - 0.5) * 0.2
    accY = (Math.random() - 0.5) * 0.2
    accZ = 9.81 + (Math.random() - 0.5) * 0.2
    temperature = 25 + (Math.random() - 0.5) * 4
    pressure = 1013.25 + (Math.random() - 0.5) * 5
    battery = 12.6 + (Math.random() - 0.5) * 0.1
  } else if (elapsedSeconds < 16) {
    // Powered Ascent (15 seconds of thrust)
    phase = 'Powered Ascent'
    const burnTime = elapsedSeconds - 1
    const thrustAccel = 22 // m/s² net acceleration
    velocity = thrustAccel * burnTime
    altitude = 0.5 * thrustAccel * burnTime * burnTime
    accX = Math.sin(burnTime * 2) * 3 + (Math.random() - 0.5) * 1
    accY = Math.cos(burnTime * 1.5) * 2 + (Math.random() - 0.5) * 1
    accZ = thrustAccel + (Math.random() - 0.5) * 2
    temperature = 25 + burnTime * 8 + (Math.random() - 0.5) * 5
    pressure = 1013.25 * Math.exp(-altitude / 8000)
    battery = 12.6 - burnTime * 0.05
    simulationData.burnStartTime = 1
  } else if (elapsedSeconds < 35) {
    // Coast Phase
    phase = 'Coast'
    const coastTime = elapsedSeconds - 16
    const burnoutVelocity = 22 * 15
    velocity = Math.max(0, burnoutVelocity - 9.81 * coastTime)
    altitude = simulationData.altitude + burnoutVelocity * coastTime - 0.5 * 9.81 * coastTime * coastTime
    accX = Math.sin(coastTime * 0.5) * 0.5 + (Math.random() - 0.5) * 0.3
    accY = Math.cos(coastTime * 0.6) * 0.4 + (Math.random() - 0.5) * 0.3
    accZ = -9.81 + (Math.random() - 0.5) * 0.5
    temperature = Math.max(25, 145 - coastTime * 4)
    pressure = 1013.25 * Math.exp(-altitude / 8000)
    battery = 12.6 - (elapsedSeconds * 0.02)
    
    if (altitude > simulationData.maxAltitude) {
      simulationData.maxAltitude = altitude
      simulationData.apogeeTime = elapsedSeconds
    }
  } else if (elapsedSeconds < 65) {
    // Descent with Drogue
    phase = 'Descent'
    const descentTime = elapsedSeconds - simulationData.apogeeTime
    const dragAccel = 12 // m/s² drag deceleration
    velocity = Math.min(25, dragAccel * descentTime) // Terminal velocity
    altitude = Math.max(0, simulationData.maxAltitude - 0.5 * dragAccel * descentTime * descentTime)
    accX = Math.sin(descentTime * 2) * 4 + (Math.random() - 0.5) * 2
    accY = Math.cos(descentTime * 1.8) * 3 + (Math.random() - 0.5) * 2
    accZ = -dragAccel + (Math.random() - 0.5) * 2
    temperature = Math.max(25, 100 - descentTime * 2)
    pressure = 1013.25 * Math.exp(-altitude / 8000)
    battery = 12.6 - (elapsedSeconds * 0.02)
  } else if (elapsedSeconds < 90) {
    // Main Chute Deployment
    phase = 'Recovery'
    const recoveryTime = elapsedSeconds - 65
    velocity = Math.min(6, 8 * recoveryTime) // Slow descent
    altitude = Math.max(0, altitude - velocity * 0.05)
    accX = Math.sin(recoveryTime * 0.8) * 1.5 + (Math.random() - 0.5) * 0.5
    accY = Math.cos(recoveryTime * 0.9) * 1.2 + (Math.random() - 0.5) * 0.5
    accZ = -8 + (Math.random() - 0.5) * 1
    temperature = 25 + (Math.random() - 0.5) * 3
    pressure = 1013.25 * Math.exp(-altitude / 8000)
    battery = 12.6 - (elapsedSeconds * 0.02)
  } else {
    // Landed
    phase = 'Landed'
    altitude = 0
    velocity = 0
    accX = (Math.random() - 0.5) * 0.1
    accY = (Math.random() - 0.5) * 0.1
    accZ = 9.81 + (Math.random() - 0.5) * 0.1
    temperature = 25 + (Math.random() - 0.5) * 2
    pressure = 1013.25
    battery = Math.max(11.0, 12.6 - (elapsedSeconds * 0.02))
  }
  
  // Wind drift simulation
  const windDrift = elapsedSeconds * 0.08
  const posX = Math.sin(elapsedSeconds * 0.02) * 30 + windDrift
  const posY = Math.cos(elapsedSeconds * 0.015) * 20 + windDrift * 0.6
  
  // Update telemetry data
  telemetryData.altitude = altitude
  telemetryData.velocity = {
    x: Math.sin(elapsedSeconds * 0.1) * velocity * 0.1,
    y: Math.cos(elapsedSeconds * 0.1) * velocity * 0.1,
    z: velocity
  }
  telemetryData.acceleration = { x: accX, y: accY, z: accZ }
  telemetryData.temperature.external = temperature
  telemetryData.temperature.internal = temperature + 5
  telemetryData.temperature.motor = phase === 'Powered Ascent' ? temperature + 50 : temperature
  telemetryData.pressure = pressure
  telemetryData.battery.voltage = battery
  telemetryData.battery.percentage = Math.max(0, ((battery - 11.0) / 1.6) * 100)
  telemetryData.gps.lat = 28.5355 + (posX / 111320)
  telemetryData.gps.lon = 77.3910 + (posY / (111320 * Math.cos(28.5355 * Math.PI / 180)))
  telemetryData.gps.alt = altitude
  telemetryData.flightPhase = phase
  telemetryData.missionTime = elapsedSeconds
  telemetryData.range = Math.sqrt(posX * posX + posY * posY)
  
  // Update performance metrics efficiently
  const totalAcceleration = Math.sqrt(accX*accX + accY*accY + accZ*accZ)
  
  // Use direct assignment to prevent reactivity loops
  if (altitude > performanceMetrics.maxAltitude) {
    performanceMetrics.maxAltitude = altitude
  }
  if (velocity > performanceMetrics.peakVelocity) {
    performanceMetrics.peakVelocity = velocity
  }
  if (totalAcceleration > performanceMetrics.maxAcceleration) {
    performanceMetrics.maxAcceleration = totalAcceleration
  }
  
  performanceMetrics.flightDuration = elapsedSeconds
  performanceMetrics.range = telemetryData.range
  performanceMetrics.latitude = telemetryData.gps.lat
  performanceMetrics.longitude = telemetryData.gps.lon
  
  // Update current phase
  currentPhase.value = phase
  
  // Update flight data arrays efficiently
  const maxPoints = 500
  
  // Use batch updates to prevent reactivity issues
  if (flightData.time.length >= maxPoints) {
    // Remove oldest 50 points at once for better performance
    const removeCount = 50
    flightData.time.splice(0, removeCount)
    flightData.altitude.splice(0, removeCount)
    flightData.velocity.splice(0, removeCount)
    flightData.acceleration.x.splice(0, removeCount)
    flightData.acceleration.y.splice(0, removeCount)
    flightData.acceleration.z.splice(0, removeCount)
    flightData.temperature.splice(0, removeCount)
    flightData.pressure.splice(0, removeCount)
  }
  
  // Add new data points
  flightData.time.push(elapsedSeconds)
  flightData.altitude.push(altitude)
  flightData.velocity.push(velocity)
  flightData.acceleration.x.push(accX)
  flightData.acceleration.y.push(accY)
  flightData.acceleration.z.push(accZ)
  flightData.temperature.push(temperature)
  flightData.pressure.push(pressure)
  
  // Store simulation data for reference
  simulationData.altitude = altitude
  simulationData.velocity = velocity
  simulationData.acceleration = { x: accX, y: accY, z: accZ }
  simulationData.temperature = temperature
  simulationData.pressure = pressure
  simulationData.battery = battery
  simulationData.position = { x: posX, y: posY }
}

const stopTelemetrySimulation = () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval)
    telemetryInterval = null
  }
}

// Lifecycle hooks
onMounted(() => {
  setupSocketListeners()
  setInterval(updateTimers, 1000)
  // Start telemetry simulation for demonstration
  startTelemetrySimulation()
})

onUnmounted(() => {
  socket.value?.disconnect()
  stopTelemetrySimulation()
})
</script>






