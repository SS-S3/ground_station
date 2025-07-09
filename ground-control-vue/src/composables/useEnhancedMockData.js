// Example: Enhanced Mock Data Integration with Ground Station Charts
// This file demonstrates how to integrate the enhanced mock data service
// with the existing ground station chart components

import { mockDataService } from '../services/mockDataService.js'
import { ref, reactive, onMounted, onUnmounted } from 'vue'

export function useEnhancedMockData() {
  // Chart data reactive references
  const chartData = reactive({
    altitude: { 
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
    },
    velocity: { 
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
    },
    acceleration: {
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
    },
    temperature: { 
      labels: [], 
      datasets: [
        { 
          label: 'External (°C)', 
          data: [], 
          borderColor: '#FFA726', 
          backgroundColor: 'rgba(255, 167, 38, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Internal (°C)', 
          data: [], 
          borderColor: '#FF7043', 
          backgroundColor: 'rgba(255, 112, 67, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Motor (°C)', 
          data: [], 
          borderColor: '#F44336', 
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    pressure: { 
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
    },
    battery: { 
      labels: [], 
      datasets: [
        { 
          label: 'Voltage (V)', 
          data: [], 
          borderColor: '#EF5350', 
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Percentage (%)', 
          data: [], 
          borderColor: '#4CAF50', 
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    communication: { 
      labels: [], 
      datasets: [
        { 
          label: 'Signal Strength (dBm)', 
          data: [], 
          borderColor: '#2196F3', 
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Quality (%)', 
          data: [], 
          borderColor: '#9C27B0', 
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }
  })

  // Current telemetry data
  const currentData = ref({})
  
  // System health status
  const systemHealth = ref({})
  
  // Flight statistics
  const flightStats = ref({})
  
  // 3D trajectory points
  const trajectoryPoints = ref([])
  
  // Mission status
  const missionStatus = reactive({
    phase: 'Pre-Launch',
    time: 0,
    isRunning: false,
    maxAltitude: 0,
    maxVelocity: 0,
    range: 0
  })

  // Chart update configuration
  const MAX_CHART_POINTS = 200
  const UPDATE_INTERVAL = 100 // ms

  // Update chart data helper function
  const updateChartData = (chart, timestamp, value) => {
    chart.labels.push(timestamp)
    chart.datasets[0].data.push(value)
    
    if (chart.labels.length > MAX_CHART_POINTS) {
      chart.labels.shift()
      chart.datasets[0].data.shift()
    }
  }

  // Update multi-dataset chart data
  const updateMultiChartData = (chart, timestamp, values) => {
    chart.labels.push(timestamp)
    values.forEach((value, index) => {
      if (chart.datasets[index]) {
        chart.datasets[index].data.push(value)
      }
    })
    
    if (chart.labels.length > MAX_CHART_POINTS) {
      chart.labels.shift()
      chart.datasets.forEach(dataset => dataset.data.shift())
    }
  }

  // Process telemetry data updates
  const processTelemetryData = (data) => {
    // Update current data
    currentData.value = data
    
    // Update system health
    systemHealth.value = data.systemHealth
    
    // Update flight statistics
    flightStats.value = mockDataService.getFlightStats()
    
    // Update mission status
    missionStatus.phase = data.flightPhase
    missionStatus.time = data.missionTime
    missionStatus.maxAltitude = Math.max(missionStatus.maxAltitude, data.altitude)
    missionStatus.maxVelocity = Math.max(missionStatus.maxVelocity, data.velocity.magnitude)
    missionStatus.range = flightStats.value.range || 0

    const timestamp = data.timestamp

    // Update all charts
    updateChartData(chartData.altitude, timestamp, data.altitude)
    updateChartData(chartData.velocity, timestamp, data.velocity.magnitude)
    updateChartData(chartData.pressure, timestamp, data.pressure)
    
    // Multi-axis acceleration
    updateMultiChartData(chartData.acceleration, timestamp, [
      data.acceleration.x,
      data.acceleration.y,
      data.acceleration.z
    ])
    
    // Multi-sensor temperature
    updateMultiChartData(chartData.temperature, timestamp, [
      data.temperature.external,
      data.temperature.internal,
      data.temperature.motor
    ])
    
    // Battery voltage and percentage
    updateMultiChartData(chartData.battery, timestamp, [
      data.battery.voltage,
      data.battery.percentage
    ])
    
    // Communication metrics
    updateMultiChartData(chartData.communication, timestamp, [
      data.communication.signalStrength,
      data.communication.quality
    ])

    // Update 3D trajectory
    trajectoryPoints.value.push({
      x: (data.gps.lat - 28.5355) * 111320, // Convert to meters
      y: (data.gps.lon - 77.3910) * 111320 * Math.cos(28.5355 * Math.PI / 180),
      z: data.altitude,
      timestamp: timestamp,
      phase: data.flightPhase
    })
    
    // Limit trajectory points for performance
    if (trajectoryPoints.value.length > 1000) {
      trajectoryPoints.value.shift()
    }
  }

  // Start enhanced mock data
  const startMockData = () => {
    console.log('🚀 Starting Enhanced Mock Data Service...')
    
    // Reset data
    Object.keys(chartData).forEach(key => {
      chartData[key].labels = []
      chartData[key].datasets.forEach(dataset => {
        dataset.data = []
      })
    })
    
    trajectoryPoints.value = []
    missionStatus.maxAltitude = 0
    missionStatus.maxVelocity = 0
    missionStatus.range = 0
    missionStatus.isRunning = true
    
    // Start mock data service
    mockDataService.start()
    
    // Add data listener
    mockDataService.addEventListener(processTelemetryData)
    
    console.log('📊 Enhanced telemetry data streaming started')
  }

  // Stop enhanced mock data
  const stopMockData = () => {
    console.log('🛑 Stopping Enhanced Mock Data Service...')
    
    mockDataService.stop()
    missionStatus.isRunning = false
    
    console.log('📊 Enhanced telemetry data streaming stopped')
  }

  // Reset mock data
  const resetMockData = () => {
    console.log('🔄 Resetting Enhanced Mock Data Service...')
    
    mockDataService.reset()
    
    // Clear all chart data
    Object.keys(chartData).forEach(key => {
      chartData[key].labels = []
      chartData[key].datasets.forEach(dataset => {
        dataset.data = []
      })
    })
    
    trajectoryPoints.value = []
    missionStatus.maxAltitude = 0
    missionStatus.maxVelocity = 0
    missionStatus.range = 0
    missionStatus.time = 0
    missionStatus.phase = 'Pre-Launch'
    
    console.log('🔄 Enhanced mock data reset complete')
  }

  // Get comprehensive telemetry summary
  const getTelemetrySummary = () => {
    return {
      currentData: currentData.value,
      systemHealth: systemHealth.value,
      flightStats: flightStats.value,
      missionStatus: { ...missionStatus },
      chartDataPoints: {
        altitude: chartData.altitude.labels.length,
        velocity: chartData.velocity.labels.length,
        acceleration: chartData.acceleration.labels.length,
        temperature: chartData.temperature.labels.length,
        pressure: chartData.pressure.labels.length,
        battery: chartData.battery.labels.length,
        communication: chartData.communication.labels.length
      },
      trajectoryPoints: trajectoryPoints.value.length
    }
  }

  // Enhanced chart options for better visualization
  const getChartOptions = (chartType) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable animation for real-time data
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return `${value.toFixed(1)}s`
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      }
    }

    // Chart-specific options
    switch (chartType) {
      case 'battery':
        return {
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            y1: {
              type: 'linear',
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      case 'communication':
        return {
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            y1: {
              type: 'linear',
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      case 'acceleration':
        return {
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            y: {
              ...baseOptions.scales.y,
              suggestedMin: -30,
              suggestedMax: 30
            }
          }
        }
      default:
        return baseOptions
    }
  }

  // Lifecycle management
  onMounted(() => {
    console.log('🎯 Enhanced Mock Data composable mounted')
  })

  onUnmounted(() => {
    console.log('🔌 Enhanced Mock Data composable unmounted')
    stopMockData()
  })

  // Return all reactive data and methods
  return {
    // Chart data
    chartData,
    
    // Current telemetry
    currentData,
    systemHealth,
    flightStats,
    trajectoryPoints,
    missionStatus,
    
    // Control methods
    startMockData,
    stopMockData,
    resetMockData,
    
    // Utility methods
    getTelemetrySummary,
    getChartOptions,
    
    // Configuration
    MAX_CHART_POINTS,
    UPDATE_INTERVAL
  }
}

// Export for use in Vue components
export default useEnhancedMockData
