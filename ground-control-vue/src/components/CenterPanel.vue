<template>
  <div class="center-panel">
    <div class="telemetry-header">
      <h2 class="mission-title">Ground Station</h2>
      <div class="status-indicators">
        <div class="status-indicator" :class="{ active: telemetryConnected }">
          <span class="indicator-dot"></span>
          {{ telemetryConnected ? 'Connected' : 'Disconnected' }}
        </div>
        <div class="test-mode-toggle">
          <label>
            <input type="checkbox" :checked="testMode" @change="toggleTestMode">
            Test Mode
          </label>
        </div>
      </div>
    </div>

    <div class="telemetry-grid">
      <!-- Real-time Telemetry Charts -->
      <div class="telemetry-section">
        <h3>Real-time Telemetry</h3>
        <div class="charts-container">
          <ChartComponent
            :title="'Altitude'"
            :data="altitudeData"
            :options="chartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
          <ChartComponent
            :title="'Velocity'"
            :data="velocityData"
            :options="chartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
          <ChartComponent
            :title="'Temperature'"
            :data="temperatureData"
            :options="chartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
          <ChartComponent
            :title="'Battery Voltage'"
            :data="batteryData"
            :options="chartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
          <ChartComponent
            :title="'Pressure'"
            :data="pressureData"
            :options="chartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
          <ChartComponent
            :title="'Acceleration'"
            :data="accelerationData"
            :options="accelerationChartOptions"
            chart-type="line"
            class="telemetry-chart"
          />
        </div>
      </div>

      <!-- 3D Flight Trajectory -->
      <div class="trajectory-section">
        <h3>3D Flight Trajectory</h3>
        <Trajectory3D
          :trajectory-points="trajectoryPoints"
          :current-position="currentPosition"
          :flight-phase="flightPhase"
          :is-active="telemetryConnected && (flightPhase !== 'Pre-Launch' && flightPhase !== 'Landed')"
        />
      </div>

      <!-- Mission Status Panel -->
      <div class="mission-status">
        <h3>Mission Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <label>Mission Time:</label>
            <span class="value">{{ formatTime(missionTime) }}</span>
          </div>
          <div class="status-item">
            <label>Current Altitude:</label>
            <span class="value">{{ currentPosition.altitude.toFixed(1) }}m</span>
          </div>
          <div class="status-item">
            <label>Current Velocity:</label>
            <span class="value">{{ currentVelocity.toFixed(1) }}m/s</span>
          </div>
          <div class="status-item">
            <label>Max Altitude:</label>
            <span class="value">{{ maxAltitude.toFixed(1) }}m</span>
          </div>
          <div class="status-item">
            <label>Range:</label>
            <span class="value">{{ currentRange.toFixed(1) }}m</span>
          </div>
          <div class="status-item">
            <label>Flight Phase:</label>
            <span class="value">{{ flightPhase }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import ChartComponent from './ChartComponent.vue'
import Trajectory3D from './Trajectory3D.vue'

const props = defineProps({
  telemetryData: Object,
  flightData: Object,
  isLaunched: Boolean,
  currentPhase: String,
  testMode: Boolean
})
const emit = defineEmits(['update:testMode'])

// Mock Data Service (inline to avoid import issues)
class MockDataService {
  constructor() {
    this.isRunning = false
    this.listeners = []
    this.startTime = Date.now()
    this.flightPhase = 'Pre-Launch'
    this.altitude = 0
    this.velocity = { x: 0, y: 0, z: 0 }
    this.position = { x: 0, y: 0, altitude: 0 }
    this.missionTime = 0
    this.intervalId = null
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.startTime = Date.now()
    this.altitude = 0
    this.missionTime = 0
    this.generateData()
  }

  stop() {
    this.isRunning = false
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
  }

  addEventListener(callback) {
    this.listeners.push(callback)
  }

  removeEventListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback)
  }

  generateData() {
    if (!this.isRunning) return

    this.missionTime = (Date.now() - this.startTime) / 1000

    // Simulate flight phases
    if (this.missionTime < 5) {
      this.flightPhase = 'Pre-Launch'
    } else if (this.missionTime < 15) {
      this.flightPhase = 'Launch'
      this.altitude += 3 + Math.random() * 4
      this.velocity.z = 20 + Math.random() * 15
    } else if (this.missionTime < 45) {
      this.flightPhase = 'Ascent'
      this.altitude += 2 + Math.random() * 3
      this.velocity.z = 10 + Math.random() * 8
    } else if (this.missionTime < 60) {
      this.flightPhase = 'Apogee'
      this.altitude += 0.5 + Math.random() * 1
      this.velocity.z = Math.random() * 4 - 2
    } else if (this.missionTime < 120) {
      this.flightPhase = 'Descent'
      this.altitude -= 2 + Math.random() * 3
      this.velocity.z = -(8 + Math.random() * 12)
      if (this.altitude <= 0) {
        this.altitude = 0
        this.flightPhase = 'Landed'
        this.velocity.z = 0
      }
    } else {
      this.flightPhase = 'Landed'
      this.altitude = 0
      this.velocity.z = 0
    }

    // Generate mock telemetry data
    const telemetryData = {
      timestamp: Date.now(),
      missionTime: this.missionTime,
      flightPhase: this.flightPhase,
      altitude: Math.max(0, this.altitude + Math.random() * 3 - 1.5),
      velocity: {
        x: Math.random() * 6 - 3,
        y: Math.random() * 6 - 3,
        z: this.velocity.z + Math.random() * 4 - 2
      },
      acceleration: {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: Math.random() * 20 - 10
      },
      temperature: {
        external: 15 + Math.random() * 8 - 4,
        internal: 20 + Math.random() * 4 - 2
      },
      pressure: 1013 + Math.random() * 40 - 20,
      battery: {
        voltage: Math.max(10, 12.5 - this.missionTime * 0.01 + Math.random() * 0.5 - 0.25),
        percentage: Math.max(0, 100 - this.missionTime * 0.8)
      },
      gps: {
        latitude: 40.7128 + Math.random() * 0.002 - 0.001,
        longitude: -74.0060 + Math.random() * 0.002 - 0.001,
        altitude: this.altitude
      },
      position: {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        altitude: this.altitude
      }
    }

    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(telemetryData)
      } catch (error) {
        console.error('Error in telemetry callback:', error)
      }
    })

    // Continue generating data
    this.intervalId = setTimeout(() => this.generateData(), 200)
  }
}

// Create mock data service instance
const mockDataService = new MockDataService()

// Local state for test data
const telemetryConnected = ref(false)
const missionTime = ref(0)
const flightPhase = ref('Pre-Launch')
const maxAltitude = ref(0)
const currentVelocity = ref(0)
const currentRange = ref(0)
const currentPosition = reactive({
  x: 0,
  y: 0,
  altitude: 0,
  latitude: 0,
  longitude: 0
})

const altitudeData = ref({ 
  labels: [], 
  datasets: [{ 
    label: 'Altitude (m)', 
    data: [], 
    borderColor: '#42A5F5', 
    backgroundColor: 'rgba(66, 165, 245, 0.1)', 
    borderWidth: 2, 
    fill: true, 
    tension: 0.4 
  }] 
})

const velocityData = ref({ 
  labels: [], 
  datasets: [{ 
    label: 'Velocity (m/s)', 
    data: [], 
    borderColor: '#66BB6A', 
    backgroundColor: 'rgba(102, 187, 106, 0.1)', 
    borderWidth: 2, 
    fill: true, 
    tension: 0.4 
  }] 
})

const temperatureData = ref({ 
  labels: [], 
  datasets: [{ 
    label: 'Temperature (°C)', 
    data: [], 
    borderColor: '#FFA726', 
    backgroundColor: 'rgba(255, 167, 38, 0.1)', 
    borderWidth: 2, 
    fill: true, 
    tension: 0.4 
  }] 
})

const batteryData = ref({ 
  labels: [], 
  datasets: [{ 
    label: 'Battery (V)', 
    data: [], 
    borderColor: '#EF5350', 
    backgroundColor: 'rgba(239, 83, 80, 0.1)', 
    borderWidth: 2, 
    fill: true, 
    tension: 0.4 
  }] 
})

const pressureData = ref({ 
  labels: [], 
  datasets: [{ 
    label: 'Pressure (hPa)', 
    data: [], 
    borderColor: '#AB47BC', 
    backgroundColor: 'rgba(171, 71, 188, 0.1)', 
    borderWidth: 2, 
    fill: true, 
    tension: 0.4 
  }] 
})

const accelerationData = ref({ 
  labels: [], 
  datasets: [ 
    { 
      label: 'X-Axis (m/s²)', 
      data: [], 
      borderColor: '#EF5350', 
      backgroundColor: 'rgba(239, 83, 80, 0.1)', 
      borderWidth: 2, 
      tension: 0.4 
    }, 
    { 
      label: 'Y-Axis (m/s²)', 
      data: [], 
      borderColor: '#42A5F5', 
      backgroundColor: 'rgba(66, 165, 245, 0.1)', 
      borderWidth: 2, 
      tension: 0.4 
    }, 
    { 
      label: 'Z-Axis (m/s²)', 
      data: [], 
      borderColor: '#66BB6A', 
      backgroundColor: 'rgba(102, 187, 106, 0.1)', 
      borderWidth: 2, 
      tension: 0.4 
    } 
  ] 
})

const trajectoryPoints = ref([])
const chartOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  scales: { 
    x: { type: 'linear', position: 'bottom' }, 
    y: { beginAtZero: false } 
  }, 
  plugins: { legend: { display: false } }, 
  elements: { point: { radius: 0 } } 
}

const accelerationChartOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  scales: { 
    x: { type: 'linear', position: 'bottom', grid: { color: 'rgba(255, 255, 255, 0.1)' } }, 
    y: { beginAtZero: true, suggestedMin: -20, suggestedMax: 20, grid: { color: 'rgba(255, 255, 255, 0.1)' } } 
  }, 
  plugins: { 
    legend: { 
      display: true, 
      position: 'top', 
      labels: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 10 } } 
    } 
  } 
}

// Mock data listener
let mockListener = null

// Helper functions
const updateChartData = (chartData, timestamp, value) => {
  const maxPoints = 50
  chartData.value.labels.push(timestamp)
  chartData.value.datasets[0].data.push(value)
  if (chartData.value.labels.length > maxPoints) {
    chartData.value.labels.shift()
    chartData.value.datasets[0].data.shift()
  }
}

const updateAccelerationData = (timestamp, x, y, z) => {
  const maxPoints = 50
  accelerationData.value.labels.push(timestamp)
  accelerationData.value.datasets[0].data.push(x)
  accelerationData.value.datasets[1].data.push(y)
  accelerationData.value.datasets[2].data.push(z)
  if (accelerationData.value.labels.length > maxPoints) {
    accelerationData.value.labels.shift()
    accelerationData.value.datasets.forEach(dataset => dataset.data.shift())
  }
}

// Chart & trajectory data from telemetry
function updateFromTelemetry(telemetry) {
  if (!telemetry) return
  
  const timestamp = telemetry.missionTime || (Date.now() / 1000)
  
  // Update chart data
  updateChartData(altitudeData, timestamp, telemetry.altitude || 0)
  
  // Velocity (magnitude)
  let velocityMag = 0
  if (telemetry.velocity && typeof telemetry.velocity === 'object') {
    velocityMag = Math.sqrt(
      Math.pow(telemetry.velocity.x || 0, 2) + 
      Math.pow(telemetry.velocity.y || 0, 2) + 
      Math.pow(telemetry.velocity.z || 0, 2)
    )
  }
  updateChartData(velocityData, timestamp, velocityMag)
  
  // Temperature
  let tempVal = 15
  if (telemetry.temperature) {
    if (typeof telemetry.temperature === 'object') {
      tempVal = telemetry.temperature.external || telemetry.temperature.internal || 15
    } else {
      tempVal = telemetry.temperature
    }
  }
  updateChartData(temperatureData, timestamp, tempVal)
  
  // Battery
  let batteryVal = 12
  if (telemetry.battery) {
    if (typeof telemetry.battery === 'object') {
      batteryVal = telemetry.battery.voltage || telemetry.battery.percentage || 12
    } else {
      batteryVal = telemetry.battery
    }
  }
  updateChartData(batteryData, timestamp, batteryVal)
  
  // Pressure
  updateChartData(pressureData, timestamp, telemetry.pressure || 1013)
  
  // Acceleration
  if (telemetry.acceleration && typeof telemetry.acceleration === 'object') {
    updateAccelerationData(
      timestamp,
      telemetry.acceleration.x || 0,
      telemetry.acceleration.y || 0,
      telemetry.acceleration.z || 0
    )
  }
  
  // Trajectory
  let pos = telemetry.position || telemetry.gps || { x: 0, y: 0, altitude: telemetry.altitude || 0 }
  trajectoryPoints.value.push({
    x: pos.x || 0,
    y: pos.y || 0,
    z: pos.altitude || telemetry.altitude || 0,
    timestamp
  })
  if (trajectoryPoints.value.length > 500) trajectoryPoints.value.shift()
  
  // Update current position and status
  currentPosition.x = pos.x || 0
  currentPosition.y = pos.y || 0
  currentPosition.altitude = pos.altitude || telemetry.altitude || 0
  currentPosition.latitude = pos.latitude || pos.lat || 0
  currentPosition.longitude = pos.longitude || pos.lon || 0
  
  currentVelocity.value = velocityMag
  currentRange.value = Math.sqrt(Math.pow(pos.x || 0, 2) + Math.pow(pos.y || 0, 2))
  missionTime.value = telemetry.missionTime || 0
  flightPhase.value = telemetry.flightPhase || 'Pre-Launch'
  
  if ((telemetry.altitude || 0) > maxAltitude.value) {
    maxAltitude.value = telemetry.altitude || 0
  }
}

// Test mode handling
const toggleTestMode = () => {
  emit('update:testMode', !props.testMode)
}

// Watch for telemetryData prop changes
watch(() => props.telemetryData, (telemetry) => {
  if (telemetry) {
    telemetryConnected.value = true
    updateFromTelemetry(telemetry)
  }
}, { immediate: true, deep: true })

// Watch testMode to start/stop mock data
watch(() => props.testMode, (val) => {
  if (val) {
    console.log('Starting test mode...')
    telemetryConnected.value = true
    mockListener = (data) => {
      updateFromTelemetry(data)
    }
    mockDataService.addEventListener(mockListener)
    mockDataService.start()
  } else {
    console.log('Stopping test mode...')
    telemetryConnected.value = false
    if (mockListener) {
      mockDataService.removeEventListener(mockListener)
      mockListener = null
    }
    mockDataService.stop()
    
    // Clear all data
    altitudeData.value.labels = []
    altitudeData.value.datasets[0].data = []
    velocityData.value.labels = []
    velocityData.value.datasets[0].data = []
    temperatureData.value.labels = []
    temperatureData.value.datasets[0].data = []
    batteryData.value.labels = []
    batteryData.value.datasets[0].data = []
    pressureData.value.labels = []
    pressureData.value.datasets[0].data = []
    accelerationData.value.labels = []
    accelerationData.value.datasets.forEach(ds => ds.data = [])
    trajectoryPoints.value = []
    
    missionTime.value = 0
    flightPhase.value = 'Pre-Launch'
    maxAltitude.value = 0
    currentVelocity.value = 0
    currentRange.value = 0
    currentPosition.x = 0
    currentPosition.y = 0
    currentPosition.altitude = 0
    currentPosition.latitude = 0
    currentPosition.longitude = 0
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
  // Set initial telemetry connection if data is available
  if (props.telemetryData) {
    telemetryConnected.value = true
    updateFromTelemetry(props.telemetryData)
  }
})

onUnmounted(() => {
  console.log('Component unmounting...')
  if (mockListener) {
    mockDataService.removeEventListener(mockListener)
    mockListener = null
  }
  mockDataService.stop()
})

// Time formatting function
const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* Keep your original CSS exactly as it was */
.center-panel {
  padding: 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  min-height: 90vh;
  border-radius: 12px;
}

.telemetry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  min-height: 60px;
}

.status-indicators {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.05);
  gap: 30px;
}

.status-indicator {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1 0 auto;
  min-width: 150px;
  height: 40px;
  justify-content: center;
  gap: 8px;
  padding: 8px 15px 5px 8px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.1s ease;
}

.status-indicator.active {
  background: rgba(100, 249, 105, 0.721);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  transition: background-color 0.3s ease;
}

.status-indicator.active .indicator-dot {
  background: #4caf50;
  animation: pulse 2s infinite;
  padding-bottom: 10px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.test-mode-toggle label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 8px;
  cursor: pointer;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 60vh 20vh;
  gap: 30px;
  height: calc(100vh - 140px);
  overflow: hidden;
}

.trajectory-section {
  grid-column: 2;
  grid-row: 1;
  height: 100%;
  max-height: 65vh;
}

.mission-status {
  grid-column: 1 / -1;
  grid-row: 2;
  max-height: 18vh;
  overflow-y: auto;
  min-height: 150px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.telemetry-section h3,
.trajectory-section h3,
.mission-status h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 300;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  height: calc(100% - 50px);
  max-height: 50vh;
}

.telemetry-chart {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 10px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.status-item label {
  font-weight: 300;
  opacity: 0.8;
}

.status-item .value {
  font-weight: 500;
  font-size: 1.1rem;
}
</style>
