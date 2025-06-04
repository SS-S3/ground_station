<template>
    <div class="panel">
        <div class="panel-header">Pre-Launch Checklist</div>

        <div class="checklist-container">
            <div class="checklist-item" v-for="item in checklist" :key="item.id">
                <label :class="{ completed: item.completed }">
                    <input 
                        type="checkbox" 
                        :checked="item.completed"
                        @change="handleChecklistToggle(item.id)"
                        :disabled="isLaunched"
                    />
                    {{ item.text }}
                </label>
            </div>
        </div>

        <SystemHealth :system-health="systemHealth" />

        <div class="control-buttons">
            <button 
                class="btn btn-primary" 
                :disabled="!allChecklistCompleted || isLaunched" 
                @click="handleArmSystem"
            >
                {{ isArmed ? 'System Armed' : 'Arm System' }}
            </button>

            <button 
                class="btn btn-success" 
                :disabled="!isArmed || isLaunched" 
                @click="handleLaunchRequest"
            >
                {{ isLaunched ? 'Launched' : 'Launch Rocket' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import SystemHealth from './SystemHealth.vue'

const props = defineProps({
    checklist: {
        type: Array,
        required: true
    },
    systemHealth: {
        type: Object,
        required: true
    },
    isArmed: {
        type: Boolean,
        default: false
    },
    isLaunched: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['arm-system', 'launch-rocket', 'toggle-checklist'])

const allChecklistCompleted = computed(() => 
    props.checklist.every(item => item.completed)
)

const handleChecklistToggle = (id) => {
    console.log('Toggling checklist item:', id)
    emit('toggle-checklist', id)
}

const handleArmSystem = () => {
    if (allChecklistCompleted.value && !props.isLaunched) {
        console.log('Requesting system arm')
        emit('arm-system')
    }
}

const handleLaunchRequest = () => {
    if (props.isArmed && !props.isLaunched) {
        console.log('Requesting launch')
        emit('launch-rocket')
    }
}
</script>

<style scoped>
.checklist-item {
    margin: 8px 0;
}

.checklist-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.checklist-item label.completed {
    text-decoration: line-through;
    opacity: 0.7;
}
</style>

