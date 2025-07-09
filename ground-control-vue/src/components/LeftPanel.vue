<template>
    <div class="panel">
        <div class="panel-header">
            <span>Pre-Launch Checklist</span>
            <span class="checklist-progress">{{ completedCount }}/{{ checklist.length }}</span>
        </div>

        <div class="checklist-container">
            <div class="checklist-group" v-for="(item, index) in checklist" :key="item.id">
                <div class="checklist-item" 
                    :class="{
                        'completed': item.completed,
                        'disabled': isItemLocked(index),
                        'active': isItemActive(index),
                        'unlocking': unlockCountdowns[item.id]
                    }"
                    :title="getItemStatusMessage(item, index)"
                >
                    <div class="item-status">
                        <div class="status-indicator" :class="getStatusClass(item, index)">
                            <span v-if="item.completed" class="check-icon">✓</span>
                            <span v-else-if="isItemActive(index)" class="active-icon">➤</span>
                            <span v-else-if="isItemLocked(index) && !unlockCountdowns[item.id]" class="lock-icon">🔒</span>
                            <span v-else-if="unlockCountdowns[item.id]" class="unlocking-icon">{{ unlockCountdowns[item.id] }}</span>
                            <span v-else class="unlocked-icon">⚪</span>
                        </div>
                    </div>
                    <label>
                        <input 
                            type="checkbox" 
                            :checked="item.completed"
                            @change="handleChecklistToggle(item.id)"
                            :disabled="isLaunched || (props.testMode ? false : isItemLocked(index)) || (('unlocked' in item) && !item.unlocked && !item.completed)"
                            :title="('unlocked' in item) && !item.unlocked && !item.completed ? 'Waiting to be unlocked...' : ''"
                        />
                        <span :class="{ 'checklist-text': true, 'text-dimmed': isItemLocked(index) }">{{ item.text }}</span>
                    </label>
                </div>
                <div v-if="index < checklist.length - 1" class="checklist-connector"></div>
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
import { ref, watch } from 'vue'  // Added 'watch' import

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
    },
    testMode: {
        type: Boolean,
        default: false
    }
})

// Add unlocking countdown tracking
const unlockingTimers = ref({})
const unlockCountdowns = ref({})

// Watch for completed items to start countdown for next item
watch(() => [...props.checklist], (newChecklist, oldChecklist) => {
    for (let i = 0; i < newChecklist.length - 1; i++) {
        const item = newChecklist[i]
        const nextItem = newChecklist[i + 1]
        
        // If this item is newly checked, start countdown for next item
        const wasJustChecked = item.completed && 
            (!oldChecklist[i] || !oldChecklist[i].completed)
        
        if (wasJustChecked && nextItem && !nextItem.unlocked && !nextItem.completed) {
            startUnlockCountdown(nextItem.id)
        }
        
        // If this item was unchecked, clear the countdown
        const wasJustUnchecked = !item.completed && 
            (oldChecklist[i] && oldChecklist[i].completed)
            
        if (wasJustUnchecked) {
            // Clear countdowns for this and all subsequent items
            for (let j = i; j < newChecklist.length; j++) {
                clearUnlockCountdown(newChecklist[j].id)
            }
        }
    }
}, { deep: true })

// Function to start the countdown for unlocking
function startUnlockCountdown(itemId) {
    // Clear any existing countdown
    clearUnlockCountdown(itemId)
    
    // Set the initial countdown value to 5
    unlockCountdowns.value[itemId] = 5
    
    // Start the timer to decrement the countdown every second
    unlockingTimers.value[itemId] = setInterval(() => {
        if (unlockCountdowns.value[itemId] <= 1) {
            clearUnlockCountdown(itemId)
        } else {
            unlockCountdowns.value[itemId]--
        }
    }, 1000)
}

// Function to clear a countdown
function clearUnlockCountdown(itemId) {
    if (unlockingTimers.value[itemId]) {
        clearInterval(unlockingTimers.value[itemId])
        delete unlockingTimers.value[itemId]
    }
    
    delete unlockCountdowns.value[itemId]
}

// Count completed items
const completedCount = computed(() => 
    props.checklist.filter(item => item.completed).length
)

// Check if all items are completed
const allChecklistCompleted = computed(() => 
    props.checklist.every(item => item.completed)
)

// Override isItemLocked and disables if testMode is enabled
const isItemLocked = (index) => {
    if (props.testMode) return false
    
    const item = props.checklist[index]
    
    // If the item is already completed, it's not locked
    if (item.completed) return false
    
    // If unlocked property is explicitly set, respect that
    if ('unlocked' in item) {
        return !item.unlocked
    }
    
    // Fallback logic if unlocked property is not present
    if (index === 0) return false // First item is never locked
    
    // Otherwise, it's unlocked only if the previous item is completed
    const prevItemCompleted = index > 0 && props.checklist[index - 1].completed
    
    return !prevItemCompleted
}

// Determine if an item is the next active one based on server-unlocked state
const isItemActive = (index) => {
    const item = props.checklist[index]
    
    // Already completed items are not active
    if (item.completed) return false
    
    // Item must be unlocked by the server to be considered active
    const isUnlocked = 'unlocked' in item ? item.unlocked : (index === 0)
    if (!isUnlocked) return false
    
    // First item is active if not completed and unlocked
    if (index === 0) return isUnlocked
    
    // Other items are active only if all previous items are completed and this one is unlocked
    for (let i = 0; i < index; i++) {
        if (!props.checklist[i].completed) return false
    }
    
    return true
}

// Get a descriptive status message for the tooltip
const getItemStatusMessage = (item, index) => {
    if (item.completed) {
        return 'Completed'
    }
    
    if (unlockCountdowns.value[item.id]) {
        return `Unlocking in ${unlockCountdowns.value[item.id]} seconds...`
    }
    
    const isUnlocked = 'unlocked' in item ? item.unlocked : false
    
    if (isUnlocked && isItemActive(index)) {
        return 'Ready to complete'
    }
    
    if (isUnlocked) {
        return 'Unlocked and ready'
    }
    
    return 'Locked - Complete previous items first'
}

// Get the appropriate status class with enhanced unlocked state display
const getStatusClass = (item, index) => {
    if (item.completed) return 'status-complete'
    
    // Check if the item is marked as unlocked from the server
    const isUnlocked = 'unlocked' in item ? item.unlocked : false
    
    if (isItemActive(index) && isUnlocked) return 'status-active'
    if (isUnlocked && !isItemActive(index)) return 'status-unlocked'
    return 'status-locked'
}

// Handle checklist item toggle with improved error handling and server-side unlock check
const handleChecklistToggle = (id) => {
    // Find the item index
    const index = props.checklist.findIndex(item => item.id === id)
    
    // Validate the toggle is allowed
    if (index === -1) {
        console.error('Checklist item not found:', id)
        return
    }
    
    const item = props.checklist[index]
    
    // Always allow unchecking
    const isUnchecking = item.completed
    
    // Check if the item is locked according to server state (unlocked property)
    const isLocked = isItemLocked(index)
    const isServerUnlocked = 'unlocked' in item ? item.unlocked : true
    
    // Only allow checking if: 
    // 1. The item is not locked in the UI
    // 2. The server has marked it as unlocked
    // 3. We're not in launched state
    if ((isUnchecking || (!isLocked && isServerUnlocked)) && !props.isLaunched) {
        console.log('Toggling checklist item:', id, 'Current state:', item.completed, 'Unlocked:', isServerUnlocked)
        emit('toggle-checklist', id)
    } else {
        if (!isServerUnlocked && !isUnchecking) {
            console.log('Toggle not allowed for item:', id, 'Server unlocked:', isServerUnlocked)
        } else {
            console.log('Toggle not allowed for item:', id, 'Locked:', isLocked, 'Server unlocked:', isServerUnlocked, 'Launched:', props.isLaunched)
        }
    }
}

// Handle system arming request with confirmation
const handleArmSystem = () => {
    if (allChecklistCompleted.value && !props.isLaunched) {
        console.log('Requesting system arm confirmation')
        emit('show-confirm', {
            title: 'Arm Rocket System',
            message: 'This will arm all rocket systems. Are you sure you want to proceed?',
            action: 'arm-system'
        })
    }
}

// Handle launch request with confirmation
const handleLaunchRequest = () => {
    if (props.isArmed && !props.isLaunched) {
        console.log('Requesting launch confirmation')
        emit('show-confirm', {
            title: 'Launch Rocket',
            message: '⚠️ WARNING: This will initiate the launch sequence. This action cannot be undone. Proceed?',
            action: 'launch-rocket'
        })
    }
}
</script>

<style scoped>
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checklist-progress {
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
}

.checklist-container {
    padding: 8px 0;
}

.checklist-group {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.checklist-item {
    display: flex;
    align-items: center;
    width: 100%;
    margin: 4px 0;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
}

.checklist-item.active {
    background: rgba(66, 165, 245, 0.15);
    border-left: 3px solid #42a5f5;
    animation: pulse 2s infinite;
}

.checklist-item.completed {
    background: rgba(76, 175, 80, 0.1);
    border-left: 3px solid #4caf50;
}

.checklist-item.disabled {
    opacity: 0.6;
}

.item-status {
    margin-right: 8px;
}

.status-indicator {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.status-complete {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
}

.status-active {
    background: rgba(66, 165, 245, 0.2);
    color: #42a5f5;
}

.status-unlocked {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
}

.status-locked {
    background: rgba(158, 158, 158, 0.2);
    color: #9e9e9e;
}

.checklist-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    flex: 1;
}

.checklist-text {
    flex: 1;
}

.text-dimmed {
    color: rgba(255, 255, 255, 0.5);
}

.check-icon {
    font-weight: bold;
}

.active-icon {
    font-size: 0.9rem;
}

.lock-icon {
    font-size: 0.7rem;
}

.unlocked-icon {
    font-size: 0.7rem;
}

.unlocking-icon {
    font-size: 0.8rem;
    color: #ffc107;
    font-weight: bold;
}

@keyframes unlock-pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

.unlocking {
    animation: unlock-pulse 1.5s infinite;
    border-left-color: #ffc107 !important;
}

.checklist-connector {
    height: 12px;
    width: 2px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 0 4px 0;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(66, 165, 245, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(66, 165, 245, 0); }
    100% { box-shadow: 0 0 0 0 rgba(66, 165, 245, 0); }
}

/* Countdown styles */
.countdown-timer {
    font-size: 0.8rem;
    color: #ffc107;
    margin-left: 8px;
    display: inline-block;
    width: 20px;
    text-align: center;
}
</style>

