<template>
    <div class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog">
            <h3 class="dialog-title">{{ title }}</h3>
            <div class="dialog-message" v-html="formattedMessage"></div>
            <div class="dialog-buttons">
                <button class="btn btn-primary" @click="handleCancel">
                    Cancel
                </button>
                <button class="btn btn-danger" @click="handleConfirm">
                    Confirm
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    title: String,
    message: String
})

const emit = defineEmits(['confirm', 'cancel'])

// Format message with newlines as HTML breaks
const formattedMessage = computed(() => {
    return props.message?.replace(/\n/g, '<br>')
})

// Use non-recursive approach to avoid stack overflow
const handleConfirm = () => {
    // Prevent multiple clicks
    const btnElement = document.querySelector('.dialog-buttons .btn-danger');
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Processing...';
    }
    
    // Use setTimeout to break call stack chain
    setTimeout(() => {
        emit('confirm');
    }, 0);
}

const handleCancel = () => {
    // Prevent multiple clicks
    const btnElement = document.querySelector('.dialog-buttons .btn-primary');
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Closing...';
    }
    
    // Use setTimeout to break call stack chain
    setTimeout(() => {
        emit('cancel');
    }, 0);
}
</script>

<style scoped>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
}

.dialog {
    background-color: #1e1e1e;
    border-radius: 8px;
    padding: 20px;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-title {
    color: white;
    margin-top: 0;
    font-size: 1.3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
}

.dialog-message {
    color: rgba(255, 255, 255, 0.8);
    margin: 15px 0;
    line-height: 1.5;
    white-space: pre-line;
}

.dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: #2c2c2c;
    color: white;
}

.btn-primary:hover {
    background-color: #3c3c3c;
}

.btn-danger {
    background-color: #e53935;
    color: white;
}

.btn-danger:hover {
    background-color: #f44336;
}
</style>
  
