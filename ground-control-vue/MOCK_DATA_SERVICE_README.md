# Enhanced Mock Data Service for Rocket Ground Station

## Overview

The Enhanced Mock Data Service provides comprehensive, physics-based rocket flight simulation data for ground station software development and testing. This service generates realistic telemetry data that closely mimics actual rocket flight patterns, environmental conditions, and system behaviors.

## Key Features

### 🚀 **Realistic Flight Simulation**

- **11 Flight Phases**: Pre-Launch, Ignition, Powered Ascent, MECO, Coast, Apogee, Descent, Drogue Deploy, Main Deploy, Recovery, Landed
- **Physics-Based Calculations**: Proper ballistic trajectories, atmospheric effects, and thrust dynamics
- **Environmental Factors**: Wind drift, atmospheric pressure changes, temperature variations
- **Recovery System**: Drogue and main parachute deployment simulation

### 📊 **Comprehensive Telemetry Data**

- **Position & Motion**: Altitude, velocity (3D), acceleration (3D), attitude (roll/pitch/yaw)
- **Environmental**: Temperature (6 sensors), pressure, humidity, wind conditions
- **Power Systems**: Battery voltage, current, percentage, temperature, power consumption
- **Navigation**: GPS coordinates, satellite count, HDOP, speed, course
- **Communication**: Signal strength, packet rate, quality, data rate, latency
- **Motor Data**: Thrust, chamber pressure, mass flow rate, nozzle temperature
- **Recovery**: Parachute deployment status, descent rate, altimeter readings

### 🔧 **System Health Monitoring**

- **Real-time Status**: 8 system categories with good/warning/error states
- **Intelligent Monitoring**: Context-aware health assessments based on flight phase
- **Threshold-Based Alerts**: Automatic warning/error generation based on sensor values

### 📈 **Chart-Ready Data Generation**

- **Optimized for Visualization**: Pre-formatted data for Chart.js and similar libraries
- **Multiple Chart Types**: Line charts, multi-axis acceleration, system status indicators
- **Performance Optimized**: Configurable data point limits and update rates

## Flight Phases Explained

### 1. Pre-Launch (0-3s)

- System initialization and final checks
- Minimal vibration and sensor noise
- All systems nominal

### 2. Ignition (3-5s)

- Engine ignition sequence
- Rapid thrust buildup
- High vibration and temperature increase

### 3. Powered Ascent (5-17s)

- Main engine burn phase
- Maximum thrust and acceleration
- Realistic thrust curve with tapering

### 4. MECO - Main Engine Cut-Off (17-18s)

- Sudden thrust termination
- Acceleration transition
- Temperature peak and decline

### 5. Coast (18-35s)

- Ballistic trajectory
- Gravity-only acceleration
- Continued altitude gain

### 6. Apogee (35-38s)

- Maximum altitude reached
- Near-zero velocity
- Transition to descent

### 7. Descent (38-55s)

- Free fall with drogue chute
- Controlled descent rate
- Parachute oscillation effects

### 8. Recovery (55-80s)

- Main parachute deployment
- Slow, stable descent
- Gentle oscillations

### 9. Landed (80s+)

- Ground contact
- Minimal vibrations
- System shutdown sequence

## Data Structure

### Core Telemetry Object

```javascript
{
  timestamp: Number,           // Mission elapsed time (seconds)
  altitude: Number,           // Altitude above ground (meters)
  velocity: {
    x: Number,               // Lateral velocity (m/s)
    y: Number,               // Lateral velocity (m/s)
    z: Number,               // Vertical velocity (m/s)
    magnitude: Number        // Total velocity magnitude (m/s)
  },
  acceleration: {
    x: Number,               // Lateral acceleration (m/s²)
    y: Number,               // Lateral acceleration (m/s²)
    z: Number,               // Vertical acceleration (m/s²)
    magnitude: Number        // Total acceleration magnitude (m/s²)
  },
  temperature: {
    external: Number,        // External temperature (°C)
    internal: Number,        // Internal temperature (°C)
    motor: Number,           // Motor temperature (°C)
    battery: Number,         // Battery temperature (°C)
    avionics: Number,        // Avionics temperature (°C)
    recovery: Number         // Recovery system temperature (°C)
  },
  pressure: Number,          // Atmospheric pressure (hPa)
  battery: {
    voltage: Number,         // Battery voltage (V)
    current: Number,         // Current draw (A)
    percentage: Number,      // Battery percentage (%)
    temperature: Number,     // Battery temperature (°C)
    powerConsumption: Number // Power consumption (W)
  },
  gps: {
    lat: Number,            // Latitude (degrees)
    lon: Number,            // Longitude (degrees)
    alt: Number,            // GPS altitude (meters)
    satellites: Number,      // Number of satellites
    hdop: Number,           // Horizontal dilution of precision
    speed: Number,          // GPS speed (m/s)
    course: Number          // Course over ground (degrees)
  },
  communication: {
    signalStrength: Number,  // Signal strength (dBm)
    packetRate: Number,     // Packet rate (packets/sec)
    quality: Number,        // Link quality (%)
    dataRate: Number,       // Data rate (bps)
    packetsLost: Number,    // Packets lost (%)
    latency: Number         // Communication latency (ms)
  },
  flightPhase: String,      // Current flight phase
  systemHealth: {
    navigation: String,      // 'good', 'warning', 'error'
    communication: String,
    power: String,
    propulsion: String,
    recovery: String,
    payload: String,
    avionics: String,
    sensors: String
  },
  motor: {
    thrust: Number,         // Current thrust (N)
    chamberPressure: Number, // Chamber pressure (Bar)
    massFlow: Number,       // Mass flow rate (kg/s)
    nozzleTemp: Number      // Nozzle temperature (°C)
  },
  recovery: {
    drogueDeployed: Boolean, // Drogue chute status
    mainDeployed: Boolean,   // Main chute status
    deploymentVelocity: Number // Deployment velocity (m/s)
  }
}
```

## Usage Examples

### Basic Usage

```javascript
import { mockDataService } from "./services/mockDataService.js";

// Start the simulation
mockDataService.start();

// Listen for telemetry updates
mockDataService.addEventListener((data) => {
  console.log("Altitude:", data.altitude);
  console.log("Velocity:", data.velocity.magnitude);
  console.log("Flight Phase:", data.flightPhase);
});

// Stop the simulation
mockDataService.stop();
```

### Chart Integration

```javascript
// Get chart-ready data
const altitudeChart = mockDataService.getChartData("altitude");
const velocityChart = mockDataService.getChartData("velocity");
const accelerationChart = mockDataService.getChartData("acceleration");

// Use with Chart.js
const ctx = document.getElementById("altitudeChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: altitudeChart,
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});
```

### System Health Monitoring

```javascript
mockDataService.addEventListener((data) => {
  // Check system health
  const healthStatus = data.systemHealth;

  Object.entries(healthStatus).forEach(([system, status]) => {
    if (status === "error") {
      console.error(`🚨 ${system} system error!`);
    } else if (status === "warning") {
      console.warn(`⚠️ ${system} system warning`);
    }
  });
});
```

### Mission Analytics

```javascript
// Get comprehensive flight statistics
const stats = mockDataService.getFlightStats();
console.log("Max Altitude:", stats.maxAltitude);
console.log("Max Velocity:", stats.maxVelocity);
console.log("Systems Nominal:", stats.systemsNominal);

// Get detailed mission summary
const summary = mockDataService.getMissionSummary();
console.log("Flight Profile:", summary.flightProfile);
console.log("System Performance:", summary.systemPerformance);
```

## Configuration Options

### Flight Parameters

```javascript
// Access flight parameters
const params = mockDataService.flightParameters;

// Modify parameters (before starting)
params.burnTime = 15; // Motor burn time (seconds)
params.thrustAcceleration = 30; // Thrust acceleration (m/s²)
params.maxThrust = 3000; // Maximum thrust (N)
params.windSpeed = 1.2; // Wind speed (m/s)
params.windDirection = 270; // Wind direction (degrees)
```

### Sensor Noise Configuration

```javascript
// Adjust sensor noise levels
params.sensorNoise = {
  altitude: 0.5, // Altitude noise (meters)
  velocity: 0.3, // Velocity noise (m/s)
  acceleration: 0.1, // Acceleration noise (m/s²)
  temperature: 0.8, // Temperature noise (°C)
  pressure: 0.2, // Pressure noise (hPa)
  gps: 0.00001, // GPS noise (degrees)
};
```

## Advanced Features

### Real-time Data Streaming

- **High Frequency Updates**: 10 Hz (100ms) update rate
- **Smooth Interpolation**: Continuous data flow for smooth animations
- **Performance Optimized**: Efficient memory usage and processing

### Environmental Simulation

- **Atmospheric Model**: Realistic pressure and temperature gradients
- **Wind Effects**: Lateral drift and turbulence simulation
- **Seasonal Variations**: Configurable environmental conditions

### Recovery System

- **Dual Altimeters**: Redundant altitude measurements
- **Deployment Logic**: Altitude and velocity-based deployment
- **Parachute Physics**: Realistic descent rates and oscillations

## Testing and Validation

### Data Quality Assurance

- **Physics Validation**: Realistic trajectories and accelerations
- **Sensor Correlation**: Consistent inter-sensor relationships
- **Noise Modeling**: Realistic sensor noise patterns

### Performance Testing

- **Memory Usage**: Optimized for long-duration flights
- **CPU Performance**: Efficient simulation algorithms
- **Data Accuracy**: Validated against real flight data

## Integration with Ground Station

### Chart Components

The mock data service integrates seamlessly with the ground station's chart components:

- **Altitude Chart**: Real-time altitude visualization
- **Velocity Chart**: Speed and direction tracking
- **Acceleration Chart**: Multi-axis acceleration display
- **Temperature Chart**: Thermal monitoring
- **Pressure Chart**: Atmospheric pressure tracking
- **Battery Chart**: Power system monitoring

### System Health Dashboard

- **Visual Indicators**: Color-coded system status
- **Alert System**: Automatic warnings and errors
- **Trend Analysis**: Historical system performance

### 3D Trajectory Visualization

- **Flight Path**: Real-time 3D trajectory display
- **Wind Drift**: Visual wind effect representation
- **Landing Prediction**: Projected landing zone

## Future Enhancements

### Planned Features

- **Multi-Stage Rockets**: Support for staging events
- **Payload Deployment**: Scientific payload simulation
- **Weather Integration**: Real weather data incorporation
- **Failure Scenarios**: System failure simulation modes
- **Recording/Playback**: Flight data recording and replay

### API Extensions

- **WebSocket Support**: Real-time data streaming
- **REST API**: HTTP-based data access
- **Plugin System**: Custom sensor implementations
- **Data Export**: Multiple format support (CSV, JSON, KML)

## Contributing

To enhance the mock data service:

1. **Add New Sensors**: Implement additional sensor types
2. **Improve Physics**: Enhance flight dynamics calculations
3. **Add Flight Phases**: Support for custom flight phases
4. **Optimize Performance**: Improve efficiency and memory usage
5. **Enhance Visualization**: Better chart integration and displays

## License

This enhanced mock data service is part of the DTU Rocketry Ground Station software and is available under the MIT License.

---

**Ready to launch your ground station development with realistic rocket telemetry data!** 🚀
