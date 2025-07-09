// Demo script for Enhanced Mock Data Service
// This demonstrates the comprehensive telemetry data generation for rocket ground station

import { mockDataService } from '../services/mockDataService.js'

// Demo configuration
const DEMO_DURATION = 90 // seconds
const UPDATE_INTERVAL = 100 // milliseconds

class MockDataDemo {
  constructor() {
    this.isRunning = false
    this.demoInterval = null
    this.telemetryHistory = []
    this.chartData = {
      altitude: { labels: [], datasets: [{ label: 'Altitude (m)', data: [], borderColor: '#42A5F5', fill: true }] },
      velocity: { labels: [], datasets: [{ label: 'Velocity (m/s)', data: [], borderColor: '#66BB6A', fill: true }] },
      acceleration: { 
        labels: [], 
        datasets: [
          { label: 'X-Axis (m/s²)', data: [], borderColor: '#EF5350' },
          { label: 'Y-Axis (m/s²)', data: [], borderColor: '#42A5F5' },
          { label: 'Z-Axis (m/s²)', data: [], borderColor: '#66BB6A' }
        ]
      },
      temperature: { labels: [], datasets: [{ label: 'Temperature (°C)', data: [], borderColor: '#FFA726', fill: true }] },
      pressure: { labels: [], datasets: [{ label: 'Pressure (hPa)', data: [], borderColor: '#AB47BC', fill: true }] },
      battery: { labels: [], datasets: [{ label: 'Battery (V)', data: [], borderColor: '#EF5350', fill: true }] }
    }
  }

  // Start the demo
  startDemo() {
    if (this.isRunning) return

    console.log('🚀 Starting Enhanced Mock Data Demo...')
    console.log('📊 This will simulate a complete rocket flight with realistic telemetry')
    console.log('⏱️  Demo Duration:', DEMO_DURATION, 'seconds')
    console.log('🔄 Update Interval:', UPDATE_INTERVAL, 'ms')
    console.log('='*60)

    this.isRunning = true
    this.telemetryHistory = []
    
    // Start the mock data service
    mockDataService.start()

    // Set up data collection
    mockDataService.addEventListener((data) => {
      this.collectTelemetryData(data)
    })

    // Set up demo monitoring
    this.demoInterval = setInterval(() => {
      this.updateDemo()
    }, 1000) // Update demo info every second

    // Auto-stop after demo duration
    setTimeout(() => {
      this.stopDemo()
    }, DEMO_DURATION * 1000)
  }

  // Stop the demo
  stopDemo() {
    if (!this.isRunning) return

    console.log('\n🛑 Stopping Mock Data Demo...')
    this.isRunning = false
    
    mockDataService.stop()
    
    if (this.demoInterval) {
      clearInterval(this.demoInterval)
      this.demoInterval = null
    }

    this.generateDemoReport()
  }

  // Collect telemetry data for charting
  collectTelemetryData(data) {
    // Store historical data
    this.telemetryHistory.push({
      timestamp: data.timestamp,
      ...data
    })

    // Update chart data arrays
    const timestamp = data.timestamp
    const maxPoints = 500 // Keep last 500 points for smooth charts

    // Altitude chart
    this.updateChartData(this.chartData.altitude, timestamp, data.altitude, maxPoints)

    // Velocity chart
    this.updateChartData(this.chartData.velocity, timestamp, data.velocity.magnitude, maxPoints)

    // Acceleration chart (multi-axis)
    this.chartData.acceleration.labels.push(timestamp)
    this.chartData.acceleration.datasets[0].data.push(data.acceleration.x)
    this.chartData.acceleration.datasets[1].data.push(data.acceleration.y)
    this.chartData.acceleration.datasets[2].data.push(data.acceleration.z)
    
    if (this.chartData.acceleration.labels.length > maxPoints) {
      this.chartData.acceleration.labels.shift()
      this.chartData.acceleration.datasets.forEach(dataset => dataset.data.shift())
    }

    // Temperature chart
    this.updateChartData(this.chartData.temperature, timestamp, data.temperature.external, maxPoints)

    // Pressure chart
    this.updateChartData(this.chartData.pressure, timestamp, data.pressure, maxPoints)

    // Battery chart
    this.updateChartData(this.chartData.battery, timestamp, data.battery.voltage, maxPoints)
  }

  // Helper function to update chart data
  updateChartData(chartData, timestamp, value, maxPoints) {
    chartData.labels.push(timestamp)
    chartData.datasets[0].data.push(value)
    
    if (chartData.labels.length > maxPoints) {
      chartData.labels.shift()
      chartData.datasets[0].data.shift()
    }
  }

  // Update demo display
  updateDemo() {
    const currentData = mockDataService.getCurrentData()
    const stats = mockDataService.getFlightStats()
    
    console.clear()
    console.log('🚀 ROCKET GROUND STATION - ENHANCED MOCK DATA DEMO')
    console.log('='*60)
    console.log(`⏰ Mission Time: ${currentData.missionTime.toFixed(1)}s`)
    console.log(`🛸 Flight Phase: ${currentData.flightPhase}`)
    console.log(`📏 Altitude: ${currentData.altitude.toFixed(1)} m`)
    console.log(`🏃 Velocity: ${currentData.velocity.magnitude.toFixed(1)} m/s`)
    console.log(`⚡ Acceleration: ${currentData.acceleration.magnitude.toFixed(1)} m/s²`)
    console.log(`🌡️  Temperature: ${currentData.temperature.external.toFixed(1)} °C`)
    console.log(`📊 Pressure: ${currentData.pressure.toFixed(1)} hPa`)
    console.log(`🔋 Battery: ${currentData.battery.voltage.toFixed(2)} V (${currentData.battery.percentage.toFixed(0)}%)`)
    console.log(`📡 Signal: ${currentData.communication.signalStrength.toFixed(0)} dBm (${currentData.communication.quality.toFixed(0)}%)`)
    console.log(`🛰️  GPS: ${currentData.gps.lat.toFixed(6)}, ${currentData.gps.lon.toFixed(6)} (${currentData.gps.satellites} sats)`)
    console.log(`📍 Range: ${stats.range.toFixed(1)} m`)
    
    // System Health Status
    console.log('\n🔧 SYSTEM HEALTH:')
    Object.entries(currentData.systemHealth).forEach(([system, status]) => {
      const emoji = status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌'
      console.log(`  ${emoji} ${system}: ${status}`)
    })

    // Flight Phase Specific Data
    if (currentData.flightPhase === 'Powered Ascent' || currentData.flightPhase === 'Ignition') {
      console.log('\n🔥 MOTOR DATA:')
      console.log(`  Thrust: ${currentData.motor.thrust.toFixed(0)} N`)
      console.log(`  Chamber Pressure: ${currentData.motor.chamberPressure.toFixed(1)} Bar`)
      console.log(`  Nozzle Temp: ${currentData.motor.nozzleTemp.toFixed(0)} °C`)
    }

    if (currentData.flightPhase === 'Descent' || currentData.flightPhase === 'Recovery') {
      console.log('\n🪂 RECOVERY DATA:')
      console.log(`  Drogue Deployed: ${currentData.recovery.drogueDeployed ? 'YES' : 'NO'}`)
      console.log(`  Main Deployed: ${currentData.recovery.mainDeployed ? 'YES' : 'NO'}`)
      console.log(`  Descent Rate: ${Math.abs(currentData.velocity.z).toFixed(1)} m/s`)
    }

    console.log('\n📈 CHART DATA POINTS:')
    console.log(`  Altitude: ${this.chartData.altitude.labels.length} points`)
    console.log(`  Velocity: ${this.chartData.velocity.labels.length} points`)
    console.log(`  Acceleration: ${this.chartData.acceleration.labels.length} points`)
    console.log(`  Temperature: ${this.chartData.temperature.labels.length} points`)
    console.log(`  Pressure: ${this.chartData.pressure.labels.length} points`)
    console.log(`  Battery: ${this.chartData.battery.labels.length} points`)
  }

  // Generate comprehensive demo report
  generateDemoReport() {
    console.log('\n' + '='*60)
    console.log('📊 DEMO REPORT - ENHANCED MOCK DATA SERVICE')
    console.log('='*60)

    const summary = mockDataService.getMissionSummary()
    const totalDataPoints = this.telemetryHistory.length

    console.log('\n🛸 FLIGHT SUMMARY:')
    console.log(`  Total Flight Time: ${summary.flightProfile.totalFlightTime.toFixed(1)}s`)
    console.log(`  Max Altitude: ${summary.flightProfile.maxAltitude.toFixed(1)} m`)
    console.log(`  Max Velocity: ${summary.flightProfile.maxVelocity.toFixed(1)} m/s`)
    console.log(`  Burn Time: ${summary.flightProfile.burnTime.toFixed(1)}s`)
    console.log(`  Apogee Time: ${summary.flightProfile.apogeeTime.toFixed(1)}s`)
    console.log(`  Landing Range: ${summary.flightProfile.landingRange.toFixed(1)} m`)

    console.log('\n🔧 SYSTEM PERFORMANCE:')
    console.log(`  Battery Usage: ${summary.systemPerformance.batteryUsage.toFixed(1)}%`)
    console.log(`  Communication Uptime: ${summary.systemPerformance.communicationUptime.toFixed(1)}%`)
    console.log(`  Recovery Success: ${summary.systemPerformance.recoverySuccess ? 'YES' : 'NO'}`)

    console.log('\n📊 DATA GENERATION STATS:')
    console.log(`  Total Data Points: ${totalDataPoints}`)
    console.log(`  Data Rate: ${(totalDataPoints / summary.flightProfile.totalFlightTime).toFixed(1)} points/sec`)
    console.log(`  Chart Data Points: ${this.chartData.altitude.labels.length}`)

    console.log('\n🌐 ENVIRONMENTAL CONDITIONS:')
    console.log(`  Average Temperature: ${summary.environmentalConditions.averageTemperature.toFixed(1)} °C`)
    console.log(`  Wind Speed: ${summary.environmentalConditions.windConditions.speed.toFixed(1)} m/s`)
    console.log(`  Wind Direction: ${summary.environmentalConditions.windConditions.direction}°`)

    console.log('\n✨ DEMO FEATURES DEMONSTRATED:')
    console.log('  ✅ Realistic flight phases (11 phases)')
    console.log('  ✅ Physics-based trajectory simulation')
    console.log('  ✅ Multi-sensor telemetry data')
    console.log('  ✅ System health monitoring')
    console.log('  ✅ Communication quality simulation')
    console.log('  ✅ Recovery system tracking')
    console.log('  ✅ Environmental effects')
    console.log('  ✅ Chart-ready data generation')
    console.log('  ✅ Real-time data streaming')
    console.log('  ✅ Comprehensive mission analysis')

    console.log('\n🎯 READY FOR GROUND STATION INTEGRATION!')
    console.log('='*60)
  }

  // Get chart data for external use
  getChartData() {
    return this.chartData
  }

  // Get latest telemetry
  getLatestTelemetry() {
    return this.telemetryHistory[this.telemetryHistory.length - 1] || null
  }
}

// Demo usage example
export function runMockDataDemo() {
  const demo = new MockDataDemo()
  
  console.log('🚀 Enhanced Mock Data Service Demo')
  console.log('This demo showcases comprehensive rocket telemetry simulation')
  console.log('Perfect for ground station software development and testing')
  console.log('\nStarting in 3 seconds...')
  
  setTimeout(() => {
    demo.startDemo()
  }, 3000)
  
  return demo
}

// Export for use in ground station
export { MockDataDemo }

// Auto-run if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runMockDataDemo()
}
