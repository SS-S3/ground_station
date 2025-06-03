<template>
    <div class="telemetry-grid">
        <div class="telemetry-card">
            <div class="telemetry-label">Altitude</div>
            <div class="telemetry-value">
                {{ telemetryData.altitude.toFixed(1) }}
                <span class="telemetry-unit">m</span>
            </div>
        </div>

        <div class="telemetry-card">
            <div class="telemetry-label">Velocity</div>
            <div class="telemetry-value">
                {{ totalVelocity.toFixed(1) }}
                <span class="telemetry-unit">m/s</span>
            </div>
        </div>

        <div class="telemetry-card">
            <div class="telemetry-label">Acceleration</div>
            <div class="telemetry-value">
                {{ totalAcceleration.toFixed(1) }}
                <span class="telemetry-unit">m/s²</span>
            </div>
        </div>

        <div class="telemetry-card">
            <div class="telemetry-label">Temperature</div>
            <div class="telemetry-value">
                {{ telemetryData.temperature.external.toFixed(1) }}
                <span class="telemetry-unit">°C</span>
            </div>
        </div>

        <div class="telemetry-card">
            <div class="telemetry-label">Pressure</div>
            <div class="telemetry-value">
                {{ telemetryData.pressure.toFixed(1) }}
                <span class="telemetry-unit">hPa</span>
            </div>
        </div>

        <div class="telemetry-card">
            <div class="telemetry-label">Battery</div>
            <div class="telemetry-value">
                {{ telemetryData.battery.percentage.toFixed(0) }}
                <span class="telemetry-unit">%</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    telemetryData: Object
})

const totalVelocity = computed(() => {
    const v = props.telemetryData.velocity
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
})

const totalAcceleration = computed(() => {
    const a = props.telemetryData.acceleration
    return Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)
})
</script>
  
