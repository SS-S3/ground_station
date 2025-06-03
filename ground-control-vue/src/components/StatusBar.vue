<template>
    <div class="status-bar">
        <div class="status-item">
            <div :class="['status-indicator', signalQuality]"></div>
            <span>Signal: {{ communicationData.signalStrength }} dBm</span>
        </div>
        <div class="status-item">
            <div class="status-indicator"></div>
            <span>Packet Rate: {{ communicationData.packetRate }} Hz</span>
        </div>
        <div class="status-item">
            <div :class="['status-indicator', qualityStatus]"></div>
            <span>Quality: {{ communicationData.quality }}%</span>
        </div>
        <div class="status-item">
            <span>{{ new Date().toLocaleString() }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    communicationData: Object
})

const signalQuality = computed(() => {
    const signal = props.communicationData.signalStrength
    if (signal > -50) return ''
    if (signal > -70) return 'warning'
    return 'error'
})

const qualityStatus = computed(() => {
    const quality = props.communicationData.quality
    if (quality > 80) return ''
    if (quality > 50) return 'warning'
    return 'error'
})
</script>
  
