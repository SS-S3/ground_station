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
            <input type="checkbox" v-model="useTestData" @change="toggleTestMode">
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
        </div>
      </div>

      <!-- 3D Flight Trajectory -->
      <div class="trajectory-section">
        <h3>3D Flight Trajectory</h3>
        <Trajectory3D
          :trajectory-points="trajectoryPoints"
          :current-position="currentPosition"
          :flight-phase="flightPhase"
        />
      </div>

      <!-- Mission Status Panel -->
      <div class="mission-status">
        <h3>Mission Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <label>Flight Phase:</label>
            <span class="value">{{ flightPhase }}</span>
          </div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import ChartComponent from './ChartComponent.vue'
import Trajectory3D from './Trajectory3D.vue'
// import { socket } from '../socket.js' // Uncomment when socket.js is available

export default {
  name: 'CenterPanel',
  components: {
    ChartComponent,
    Trajectory3D
  },
  setup() {
    // Reactive data
    const telemetryConnected = ref(false)
    const useTestData = ref(true) // Start with test data for development
    const missionTime = ref(0)
    const flightPhase = ref('Pre-Launch')
    const maxAltitude = ref(0)
    const currentVelocity = ref(0)
    const currentRange = ref(0)

    // Current position
    const currentPosition = reactive({
      x: 0,
      y: 0,
      altitude: 0,
      latitude: 0,
      longitude: 0
    })

    // Chart data arrays
    const altitudeData = ref({ 
      labels: [], 
      datasets: [{ 
        label: 'Altitude (m)', 
        data: [], 
        borderColor: '#42A5F5', 
        backgroundColor: 'rgba(66, 165, 245, 0.1)' 
      }] 
    })
    
    const velocityData = ref({ 
      labels: [], 
      datasets: [{ 
        label: 'Velocity (m/s)', 
        data: [], 
        borderColor: '#66BB6A', 
        backgroundColor: 'rgba(102, 187, 106, 0.1)' 
      }] 
    })
    
    const temperatureData = ref({ 
      labels: [], 
      datasets: [{ 
        label: 'Temperature (°C)', 
        data: [], 
        borderColor: '#FFA726', 
        backgroundColor: 'rgba(255, 167, 38, 0.1)' 
      }] 
    })
    
    const batteryData = ref({ 
      labels: [], 
      datasets: [{ 
        label: 'Battery (V)', 
        data: [], 
        borderColor: '#EF5350', 
        backgroundColor: 'rgba(239, 83, 80, 0.1)' 
      }] 
    })
    
    // Trajectory points for 3D visualization
    const trajectoryPoints = ref([])

    // Chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom'
        },
        y: {
          beginAtZero: false
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
      elements: {
        point: {
          radius: 0
        }
      }
    }

    // Test data generation variables
    let testDataInterval = null
    let testMissionStart = Date.now()
    let testAltitude = 0
    let testVelocity = 0

    const generateTestData = () => {
      const now = Date.now()
      const elapsedSeconds = (now - testMissionStart) / 1000
      
      // Update mission time
      missionTime.value = elapsedSeconds

      // Simulate flight phases
      if (elapsedSeconds < 10) {
        flightPhase.value = 'Pre-Launch'
        testAltitude = 0
        testVelocity = 0
      } else if (elapsedSeconds < 60) {
        flightPhase.value = 'Powered Ascent'
        testAltitude += Math.random() * 50 + 30
        testVelocity = Math.random() * 20 + 80
      } else if (elapsedSeconds < 120) {
        flightPhase.value = 'Coast'
        testAltitude += Math.random() * 10 + 5
        testVelocity = Math.max(0, testVelocity - Math.random() * 5)
      } else if (elapsedSeconds < 200) {
        flightPhase.value = 'Descent'
        testAltitude = Math.max(0, testAltitude - Math.random() * 20 - 10)
        testVelocity = Math.random() * 30 + 20
      } else {
        flightPhase.value = 'Recovery'
        testAltitude = Math.max(0, testAltitude - Math.random() * 5)
        testVelocity = Math.max(0, testVelocity - Math.random() * 2)
      }

      // Update max altitude
      if (testAltitude > maxAltitude.value) {
        maxAltitude.value = testAltitude
      }

      // Update current values
      currentPosition.altitude = testAltitude
      currentPosition.x = Math.sin(elapsedSeconds * 0.1) * 100
      currentPosition.y = Math.cos(elapsedSeconds * 0.1) * 100
      currentVelocity.value = testVelocity
      currentRange.value = Math.sqrt(currentPosition.x * currentPosition.x + currentPosition.y * currentPosition.y)

      // Generate telemetry data
      const timestamp = elapsedSeconds
      const temperature = 20 + Math.random() * 40 - 20 // -20 to 40°C
      const battery = Math.max(10, 12.6 - elapsedSeconds * 0.01) // Decreasing battery

      // Update chart data (keep last 100 points)
      updateChartData(altitudeData, timestamp, testAltitude)
      updateChartData(velocityData, timestamp, testVelocity)
      updateChartData(temperatureData, timestamp, temperature)
      updateChartData(batteryData, timestamp, battery)

      // Update trajectory
      trajectoryPoints.value.push({
        x: currentPosition.x,
        y: currentPosition.y,
        z: testAltitude
      })

      // Limit trajectory points
      if (trajectoryPoints.value.length > 1000) {
        trajectoryPoints.value.shift()
      }
    }

    const updateChartData = (chartData, timestamp, value) => {
      const maxPoints = 100
      chartData.value.labels.push(timestamp)
      chartData.value.datasets[0].data.push(value)
      
      if (chartData.value.labels.length > maxPoints) {
        chartData.value.labels.shift()
        chartData.value.datasets[0].data.shift()
      }
    }

    const toggleTestMode = () => {
      if (useTestData.value) {
        startTestData()
      } else {
        stopTestData()
        // Connect to real telemetry
        connectToTelemetry()
      }
    }

    const startTestData = () => {
      testMissionStart = Date.now()
      testDataInterval = setInterval(generateTestData, 100) // Update every 100ms
      telemetryConnected.value = true
    }

    const stopTestData = () => {
      if (testDataInterval) {
        clearInterval(testDataInterval)
        testDataInterval = null
      }
    }

    const connectToTelemetry = () => {
      // Real telemetry connection logic
      // Uncomment when socket.js is available
      /*
      socket.on('telemetry_data', (data) => {
        const timestamp = Date.now() / 1000
        updateChartData(altitudeData, timestamp, data.altitude)
        updateChartData(velocityData, timestamp, data.velocity)
        updateChartData(temperatureData, timestamp, data.temperature)
        updateChartData(batteryData, timestamp, data.battery)
        
        currentPosition.altitude = data.altitude
        currentPosition.x = data.x || 0
        currentPosition.y = data.y || 0
        currentVelocity.value = data.velocity
        flightPhase.value = data.phase || 'Unknown'
      })
      
      socket.on('connect', () => {
        telemetryConnected.value = true
      })
      
      socket.on('disconnect', () => {
        telemetryConnected.value = false
      })
      */
    }

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Lifecycle
    onMounted(() => {
      if (useTestData.value) {
        startTestData()
      } else {
        connectToTelemetry()
      }
    })

    onUnmounted(() => {
      stopTestData()
      // Uncomment when socket.js is available
      /*
      socket.off('telemetry_data')
      socket.off('connect')
      socket.off('disconnect')
      */
    })

    return {
      telemetryConnected,
      useTestData,
      missionTime,
      flightPhase,
      maxAltitude,
      currentVelocity,
      currentRange,
      currentPosition,
      altitudeData,
      velocityData,
      temperatureData,
      batteryData,
      trajectoryPoints,
      chartOptions,
      toggleTestMode,
      formatTime
    }
  }
}
</script>

<style scoped>
.center-panel {
  padding: 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  min-height: 100vh;
}

.telemetry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.telemetry-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 300;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: rgba(76, 175, 80, 0.3);
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
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.test-mode-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr auto;
  gap: 20px;
  height: calc(100vh - 140px);
}

.telemetry-section {
  grid-column: 1;
  grid-row: 1;
}

.trajectory-section {
  grid-column: 2;
  grid-row: 1;
}

.mission-status {
  grid-column: 1 / -1;
  grid-row: 2;
}

.telemetry-section h3,
.trajectory-section h3,
.mission-status h3 {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  font-weight: 300;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  height: calc(100% - 50px);
}

.telemetry-chart {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
