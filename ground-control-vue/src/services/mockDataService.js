// mockDataService.js
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
    }
  
    start() {
      if (this.isRunning) return
      this.isRunning = true
      this.startTime = Date.now()
      this.generateData()
    }
  
    stop() {
      this.isRunning = false
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
        this.altitude += 2 + Math.random() * 3
        this.velocity.z = 15 + Math.random() * 10
      } else if (this.missionTime < 45) {
        this.flightPhase = 'Ascent'
        this.altitude += 1.5 + Math.random() * 2
        this.velocity.z = 8 + Math.random() * 5
      } else if (this.missionTime < 60) {
        this.flightPhase = 'Apogee'
        this.altitude += 0.2 + Math.random() * 0.5
        this.velocity.z = Math.random() * 2 - 1
      } else {
        this.flightPhase = 'Descent'
        this.altitude -= 1 + Math.random() * 2
        this.velocity.z = -(5 + Math.random() * 8)
        if (this.altitude <= 0) {
          this.altitude = 0
          this.flightPhase = 'Landed'
        }
      }
  
      // Generate mock telemetry data
      const telemetryData = {
        timestamp: Date.now(),
        missionTime: this.missionTime,
        flightPhase: this.flightPhase,
        altitude: Math.max(0, this.altitude + Math.random() * 2 - 1),
        velocity: {
          x: Math.random() * 4 - 2,
          y: Math.random() * 4 - 2,
          z: this.velocity.z + Math.random() * 2 - 1
        },
        acceleration: {
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5
        },
        temperature: {
          external: 15 + Math.random() * 4 - 2,
          internal: 20 + Math.random() * 2 - 1
        },
        pressure: 1013 + Math.random() * 20 - 10,
        battery: {
          voltage: 12 + Math.random() * 0.5 - 0.25,
          percentage: Math.max(0, 100 - this.missionTime * 0.5)
        },
        gps: {
          latitude: 40.7128 + Math.random() * 0.001,
          longitude: -74.0060 + Math.random() * 0.001,
          altitude: this.altitude
        },
        position: {
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          altitude: this.altitude
        }
      }
  
      // Notify all listeners
      this.listeners.forEach(callback => callback(telemetryData))
  
      // Continue generating data
      setTimeout(() => this.generateData(), 100)
    }
  }
  
  export default new MockDataService()
  