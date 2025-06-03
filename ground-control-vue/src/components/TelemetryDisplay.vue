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
    telemetryData: {
        type: Object,
        required: true,
        default: () => ({
            altitude: 0,
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            temperature: { external: 0 },
            pressure: 0,
            battery: { percentage: 100 },
            gps: { lat: 12.9716, lon: 77.5946 },
            attitude: { pitch: 0, yaw: 0, roll: 0 }
        })
    }
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

<style scoped>
.telemetry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
}

.telemetry-card {
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    transition: all 0.3s ease;
}

.telemetry-card:hover {
    background: rgba(0, 212, 255, 0.2);
    transform: translateY(-2px);
}

.telemetry-label {
    color: #b3e5fc;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    font-family: 'Orbitron', monospace;
}

.telemetry-value {
    color: #00d4ff;
    font-size: 1.5rem;
    font-weight: bold;
    font-family: 'Orbitron', monospace;
}

.telemetry-unit {
    font-size: 0.9rem;
    margin-left: 0.3rem;
    color: #b3e5fc;
}
</style>
