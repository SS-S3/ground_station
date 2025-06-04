// src/composables/useTelemetry.js
import { ref } from 'vue';
import { io } from 'socket.io-client';

export function useTelemetry() {
  const isTestMode = ref(true);
  const isConnected = ref(false);
  const telemetryData = ref({
    altitude: [],
    velocity: [],
    temperature: [],
    accelerationX: [], // Added for X-axis acceleration
    accelerationY: [], // Added for Y-axis acceleration
    accelerationZ: [], // Added for Z-axis acceleration
    pressure: [], // Added for pressure data
    position: [],
    flightPhase: 'Pre-Launch',
    missionTime: 0
  });

  const socket = io('http://your-server-url:port', { autoConnect: false });

  // Real telemetry connection
  function connectToServer() {
    socket.connect();
    socket.on('connect', () => {
      isConnected.value = true;
      console.log('Connected to telemetry server');
    });
    socket.on('disconnect', () => {
      isConnected.value = false;
      console.log('Disconnected from telemetry server');
    });
    socket.on('telemetry', (data) => {
      if (!isTestMode.value) {
        updateTelemetry(data);
      }
    });
  }

  // Test data generation (simulates rocket flight)
  function generateTestData() {
    if (!isTestMode.value) return;
    const time = telemetryData.value.missionTime;
    let altitude, velocity, temp, accX, accY, accZ, pressure, phase, x, y;

    // Simulate different flight phases
    if (time < 10) {
      phase = 'Pre-Launch';
      altitude = 0;
      velocity = 0;
      temp = 25;
      accX = 0;
      accY = 0;
      accZ = 0;
      pressure = 1013.25; // Standard sea level pressure in hPa
      x = 0;
      y = 0;
    } else if (time < 20) {
      phase = 'Powered Ascent';
      altitude = 100 * (time - 10);
      velocity = 50 + 10 * (time - 10);
      temp = 25 + (time - 10) * 2;
      accX = 0.5 + Math.random() * 0.2; // Slight lateral acceleration
      accY = 0.3 + Math.random() * 0.2;
      accZ = 9.8 + (time - 10) * 2; // Strong vertical acceleration
      pressure = 1013.25 * Math.exp(-altitude / 8000); // Exponential pressure drop
      x = 10 * (time - 10);
      y = 5 * (time - 10);
    } else if (time < 30) {
      phase = 'Coast';
      altitude = 1000 + 50 * (time - 20);
      velocity = 150 - 5 * (time - 20);
      temp = 35 - (time - 20) * 1;
      accX = 0.1 + Math.random() * 0.1;
      accY = 0.1 + Math.random() * 0.1;
      accZ = -0.2; // Slight deceleration
      pressure = 1013.25 * Math.exp(-altitude / 8000);
      x = 100 + 5 * (time - 20);
      y = 50 + 2 * (time - 20);
    } else if (time < 50) {
      phase = 'Descent';
      altitude = 1500 - 75 * (time - 30);
      velocity = -30 - 2 * (time - 30);
      temp = 25 - (time - 30) * 0.5;
      accX = 0.05 + Math.random() * 0.05;
      accY = 0.05 + Math.random() * 0.05;
      accZ = -0.1;
      pressure = 1013.25 * Math.exp(-altitude / 8000);
      x = 150 - 2 * (time - 30);
      y = 70 - 1 * (time - 30);
    } else {
      phase = 'Recovery';
      altitude = 0;
      velocity = 0;
      temp = 25;
      accX = 0;
      accY = 0;
      accZ = 0;
      pressure = 1013.25;
      x = 110;
      y = 50;
    }

    updateTelemetry({
      altitude,
      velocity,
      temperature: temp,
      accelerationX: accX,
      accelerationY: accY,
      accelerationZ: accZ,
      pressure,
      position: { x, y, altitude },
      flightPhase: phase,
      missionTime: time
    });

    telemetryData.value.missionTime += 1;
  }

  function updateTelemetry(data) {
    const maxPoints = 100; // Limit data points for performance
    for (const key in telemetryData.value) {
      if (Array.isArray(telemetryData.value[key]) && data[key] !== undefined) {
        telemetryData.value[key].push(data[key]);
        if (telemetryData.value[key].length > maxPoints) {
          telemetryData.value[key].shift();
        }
      }
    }
    telemetryData.value.flightPhase = data.flightPhase || telemetryData.value.flightPhase;
    telemetryData.value.missionTime = data.missionTime || telemetryData.value.missionTime;
    telemetryData.value.position = data.position || telemetryData.value.position;
  }

  // Start test data simulation
  setInterval(() => {
    if (isTestMode.value) {
      generateTestData();
    }
  }, 1000); // Update every second for test data

  return { telemetryData, isTestMode, isConnected, connectToServer };
}
