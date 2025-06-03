<template>
    <div class="system-health">
        <div class="panel-header">System Health</div>
        <div v-for="(status, system) in systemHealth" :key="system" class="health-item">
            <span class="health-label">{{ formatSystemName(system) }}</span>
            <span :class="['health-status', `status-${status}`]">
                {{ status }}
            </span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    systemHealth: Object
})

const formatSystemName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
}
</script>
  
