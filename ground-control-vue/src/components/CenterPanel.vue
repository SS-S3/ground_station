<template>
    <div class="panel">
        <div class="panel-header">Telemetry Data</div>

        <!-- Cards / numeric display -->
        <TelemetryDisplay :telemetry-data="telemetryData" />

        <!-- Real-time Charts -->
        <div class="charts-section" v-if="isLaunched">
            <div class="panel-header">Real-time Telemetry</div>
            <div class="charts-grid">
                <ChartComponent :chart-data="altitudeChartData" :options="chartOptions" type="line"
                    title="Altitude vs Time" :real-time="true" theme="dark" />

                <ChartComponent :chart-data="velocityChartData" :options="chartOptions" type="line"
                    title="Velocity vs Time" :real-time="true" theme="dark" />

                <ChartComponent :chart-data="accelerationChartData" :options="chartOptions" type="line"
                    title="Acceleration vs Time" :real-time="true" theme="dark" />

                <ChartComponent :chart-data="temperaturePressureChartData" :options="dualAxisChartOptions" type="line"
                    title="Temp & Pressure" :real-time="true" theme="dark" />
            </div>
        </div>

        <!-- 3D Trajectory Visual -->
        <div class="trajectory-section" v-if="isLaunched">
            <div class="panel-header">3D Flight Trajectory</div>
            <Trajectory3D :flight-data="flightData" :telemetry-data="telemetryData" :current-phase="currentPhase" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import TelemetryDisplay from './TelemetryDisplay.vue'
import ChartComponent from './ChartComponent.vue'
import Trajectory3D from './Trajectory3D.vue'

const props = defineProps({
    telemetryData: Object,
    flightData: Object,
    isLaunched: Boolean,
    currentPhase: String
})

// Chart configuration
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
            grid: { color: 'rgba(0, 212, 255, 0.2)' },
            title: {
                display: true,
                text: 'Time (s)',
                color: '#00d4ff'
            }
        },
        y: {
            ticks: { color: '#b3e5fc' },
            grid: { color: 'rgba(0, 212, 255, 0.2)' }
        }
    },
    animation: { duration: 0 },
    interaction: {
        intersect: false,
        mode: 'index'
    }
}

const dualAxisChartOptions = {
    ...chartOptions,
    scales: {
        ...chartOptions.scales,
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#b3e5fc' },
            grid: { color: 'rgba(0, 212, 255, 0.2)' },
            title: {
                display: true,
                text: 'Temperature (°C)',
                color: '#ff6b6b'
            }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#b3e5fc' },
            grid: { drawOnChartArea: false },
            title: {
                display: true,
                text: 'Pressure (hPa)',
                color: '#4ecdc4'
            }
        }
    }
}

// Chart data computed properties
const altitudeChartData = computed(() => ({
    labels: props.flightData.time,
    datasets: [{
        label: 'Altitude (m)',
        data: props.flightData.altitude,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
        fill: true
    }]
}))

const velocityChartData = computed(() => ({
    labels: props.flightData.time,
    datasets: [{
        label: 'Total Velocity (m/s)',
        data: props.flightData.velocity,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
    }]
}))

const accelerationChartData = computed(() => ({
    labels: props.flightData.time,
    datasets: [
        {
            label: 'Acc X (m/s²)',
            data: props.flightData.acceleration.x,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.4
        },
        {
            label: 'Acc Y (m/s²)',
            data: props.flightData.acceleration.y,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.4
        },
        {
            label: 'Acc Z (m/s²)',
            data: props.flightData.acceleration.z,
            borderColor: '#ffe66d',
            backgroundColor: 'rgba(255, 230, 109, 0.1)',
            tension: 0.4
        }
    ]
}))

const temperaturePressureChartData = computed(() => ({
    labels: props.flightData.time,
    datasets: [
        {
            label: 'Temperature (°C)',
            data: props.flightData.temperature,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            yAxisID: 'y',
            tension: 0.4
        },
        {
            label: 'Pressure (hPa)',
            data: props.flightData.pressure,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
        }
    ]
}))
</script>

<style scoped>
.charts-section {
    margin-top: 1.5rem;
}

.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
}

.chart-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(0, 212, 255, 0.2);
    height: 250px;
}

.trajectory-section {
    margin-top: 1.5rem;
}

@media (max-width: 1200px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
}
</style>
  
