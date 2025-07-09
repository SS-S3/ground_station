<template>
    <div class="panel">
        <div class="panel-header">Performance Metrics</div>

        <div class="performance-metrics">
            <div class="metric-item">
                <span class="metric-label">Max Altitude</span>
                <span class="metric-value">{{ performanceMetrics.maxAltitude.toFixed(1) }} m</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Peak Velocity</span>
                <span class="metric-value">{{ performanceMetrics.peakVelocity.toFixed(1) }} m/s</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Flight Duration</span>
                <span class="metric-value">{{ formatDuration(performanceMetrics.flightDuration) }}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Range</span>
                <span class="metric-value">{{ performanceMetrics.range.toFixed(0) }} m</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Latitude</span>
                <span class="metric-value">{{ performanceMetrics.latitude?.toFixed(6) ?? 'N/A' }}°</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Longitude</span>
                <span class="metric-value">{{ performanceMetrics.longitude?.toFixed(6) ?? 'N/A' }}°</span>
            </div>
        </div>

        <div class="emergency-controls">
            <div class="emergency-title">Emergency Controls</div>
            <div class="control-buttons">
                <button class="btn btn-danger" @click="$emit('emergency-action', 'emergency-stop')">
                    Emergency Stop
                </button>
                <button class="btn btn-danger" @click="$emit('emergency-action', 'flight-termination')">
                    Flight Termination
                </button>
                <button class="btn btn-primary" @click="$emit('emergency-action', 'deploy-recovery')">
                    Deploy Recovery
                </button>
                
            </div>
            
        </div>
        <img src="../assets/rocketry.svg" alt="LOGO" width="250" height="250" class="logo" style="display: block; margin-top:200px;">        </div>
</template>

<script setup>
defineProps({
    telemetryData: Object,
    performanceMetrics: Object,
    testMode: Boolean
})

defineEmits(['emergency-action'])

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

