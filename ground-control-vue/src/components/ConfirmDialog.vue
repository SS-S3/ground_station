<template>
    <div class="dialog-overlay" @click.self="$emit('cancel')">
        <div class="dialog">
            <h3 class="dialog-title">{{ title }}</h3>
            <p class="dialog-message">{{ message }}</p>
            <div class="dialog-buttons">
                <button class="btn btn-primary" @click="$emit('cancel')">
                    Cancel
                </button>
                <button class="btn btn-danger" @click="$emit('confirm')">
                    Confirm
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: String,
    message: String
})

defineEmits(['confirm', 'cancel'])
</script>
  
