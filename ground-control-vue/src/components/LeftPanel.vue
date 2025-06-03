<template>
    <div class="panel">
        <div class="panel-header">Pre-Launch Checklist</div>

        <ChecklistComponent :checklist="checklist" @toggle-item="$emit('toggle-checklist', $event)" />

        <SystemHealth :system-health="systemHealth" />

        <div class="control-buttons">
            <button class="btn btn-primary" :disabled="!allChecklistCompleted" @click="$emit('arm-system')">
                {{ isArmed ? 'System Armed' : 'Arm System' }}
            </button>

            <button class="btn btn-success" :disabled="!isArmed || isLaunched" @click="$emit('launch-rocket')">
                {{ isLaunched ? 'Launched' : 'Launch Rocket' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ChecklistComponent from './ChecklistComponent.vue'
import SystemHealth from './SystemHealth.vue'

const props = defineProps({
    checklist: Array,
    systemHealth: Object,
    isArmed: Boolean,
    isLaunched: Boolean
})

defineEmits(['arm-system', 'launch-rocket', 'toggle-checklist'])

const allChecklistCompleted = computed(() =>
    props.checklist.every(item => item.completed)
)
</script>
  
