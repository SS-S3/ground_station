<template>
    <header class="header">
        <div class="header-content">
            <h1 class="mission-title">TEAM ROCKETRY-DTU</h1>
            <div class="header-info">
                <div class="timer-display">{{ missionTimer }}</div>
                <div class="timer-display">{{ currentTime }}</div>
                <div :class="['phase-indicator', `phase-${currentPhase.toLowerCase().replace(' ', '-')}`]">
                    {{ currentPhase }}
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
defineProps({
    missionTimer: String,
    currentTime: String,
    currentPhase: String
})
</script>
  
