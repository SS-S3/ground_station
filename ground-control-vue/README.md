# Ground Station Software - Team Rocketry DTU

A comprehensive ground station control software for rocket telemetry monitoring, built with Vue.js 3 and modern web technologies.

## Features

### 🚀 Real-time Telemetry Monitoring

- **Live Data Charts**: Real-time visualization of altitude, velocity, temperature, battery, pressure, and acceleration
- **3D Flight Trajectory**: Interactive 3D visualization of rocket flight path
- **Flight Phase Tracking**: Automatic detection and display of flight phases (Pre-Launch, Powered Ascent, Coast, Descent, Recovery, Landed)
- **Mission Timer**: Precise mission elapsed time tracking

### 📊 Data Visualization

- **Multi-parameter Charts**: Simultaneous monitoring of 6 key telemetry parameters
- **Acceleration Vector Display**: X, Y, Z axis acceleration monitoring
- **Performance Metrics**: Real-time calculation of max altitude, peak velocity, flight duration, and range
- **System Health Monitoring**: Visual status indicators for all rocket subsystems

### 🎛️ Mission Control Interface

- **Pre-flight Checklist**: Interactive checklist system with safety interlocks
- **Launch Controls**: Armed launch sequence with confirmation dialogs
- **Emergency Controls**: Flight termination and recovery deployment buttons
- **Communication Status**: Signal strength, packet rate, and quality monitoring

### 🔧 Technical Features

- **Mock Data Service**: Realistic rocket flight simulation for testing and demonstration
- **Responsive Design**: Works on desktop and tablet devices
- **Modern UI**: Aerospace-inspired interface with smooth animations
- **Real-time Updates**: 50ms update intervals for smooth chart rendering
- **Error Handling**: Comprehensive error management and recovery

## Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **Charts**: Chart.js with vue-chartjs
- **3D Graphics**: Three.js for trajectory visualization
- **Real-time Communication**: Socket.io for live data streaming
- **Build Tool**: Vite for fast development and building
- **Styling**: Custom CSS with aerospace theme

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation Steps

1. **Navigate to the project directory**:

   ```bash
   cd ground-control-vue
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Start the backend server** (in a separate terminal):

   ```bash
   npm run server
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## Mock Data System

The software includes a comprehensive mock data service that simulates realistic rocket flight:

### Flight Phases Simulated

1. **Pre-Launch** (0-5s): Ground operations and system checks
2. **Powered Ascent** (5-20s): Motor burn phase with thrust acceleration
3. **Coast** (20-40s): Free flight to apogee
4. **Descent** (40-70s): Drogue parachute deployment
5. **Recovery** (70-100s): Main parachute deployment
6. **Landed** (100s+): Post-flight ground state

### Realistic Data Generation

- **Physics-based simulation**: Proper acceleration, velocity, and altitude calculations
- **Environmental factors**: Atmospheric pressure changes, wind drift effects
- **System degradation**: Battery discharge, temperature variations
- **Communication simulation**: Signal strength based on altitude and conditions
- **Noise simulation**: Realistic sensor noise and vibration effects

### Key Parameters Simulated

- Altitude (0-3000m peak)
- Velocity (0-330m/s peak)
- 3-axis acceleration (-20 to +25 m/s²)
- Temperature (-10°C to +150°C)
- Atmospheric pressure (500-1013 hPa)
- Battery voltage (11.0-12.6V)
- GPS coordinates with drift
- Communication quality metrics

## Usage Guide

### Starting a Mission

1. **System Startup**: The interface loads with all systems in standby mode
2. **Pre-flight Checklist**: Complete all checklist items in the left panel
3. **System Arming**: Once checklist is complete, arm the system
4. **Launch Sequence**: Initiate launch when ready (with confirmation)
5. **Flight Monitoring**: Watch real-time telemetry during flight
6. **Data Analysis**: Review flight performance metrics post-flight

### Chart Interpretation

- **Altitude Chart**: Shows height above ground level
- **Velocity Chart**: Total velocity magnitude
- **Temperature Chart**: External temperature sensor readings
- **Battery Chart**: System voltage levels
- **Pressure Chart**: Atmospheric pressure (indicates altitude)
- **Acceleration Chart**: 3-axis G-forces on the rocket

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server

## License

This project is developed for Team Rocketry DTU and is intended for educational and research purposes.

---

**Team Rocketry DTU** - Advancing aerospace engineering through innovation and technology.
// The package.json file is essential for managing the project's dependencies and scripts, ensuring a smooth development workflow.
// The project is designed to be modular and scalable, allowing for future enhancements and features.
// The use of modern tools like Vite and Vue 3 ensures a fast and efficient development experience.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
