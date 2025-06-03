<template>
  <div class="panel">
    <div class="panel-header">Telemetry Data</div>
    
    <TelemetryDisplay :telemetry-data="telemetryData" />
    
    <div class="charts-container" v-if="isLaunched">
      <ChartComponent
        :chart-data="altitudeChartData"
        :options="chartOptions"
        type="line"
        title="Altitude vs Time"
      />
      <ChartComponent
        :chart-data="velocityChartData"
        :options="chartOptions"
        type="line"
        title="Velocity vs Time"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TelemetryDisplay from './TelemetryDisplay.vue'
import ChartComponent from './ChartComponent.vue'

const props = defineProps({
  telemetryData: {
    type: Object,
    required: true,
    default: () => ({})
  },
  flightData: {
    type: Object,
    required: true,
    default: () => ({
      time: [],
      altitude: [],
      velocity: []
    })
  },
  isLaunched: {
    type: Boolean,
    default: false
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      labels: { color: '#e3f2fd' }
    }
  },
  scales: {
    x: {
      ticks: { color: '#b3e5fc' },
      grid: { color: 'rgba(0, 212, 255, 0.2)' }
    },
    y: {
      ticks: { color: '#b3e5fc' },
      grid: { color: 'rgba(0, 212, 255, 0.2)' }
    }
  },
  animation: {
    duration: 0
  }
}

const altitudeChartData = computed(() => ({
  labels: props.flightData?.time || [],
  datasets: [{
    label: 'Altitude (m)',
    data: props.flightData?.altitude || [],
    borderColor: '#00d4ff',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    tension: 0.4
  }]
}))

const velocityChartData = computed(() => ({
  labels: props.flightData?.time || [],
  datasets: [{
    label: 'Velocity (m/s)',
    data: props.flightData?.velocity || [],
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    tension: 0.4
  }]
}))
</script>

<style scoped>
.panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}  
.charts-container {@media (min-width: 1200px) {}  margin-top: 1rem;  gap: 1rem;  grid-template-columns: 1fr;  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

@media (min-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
