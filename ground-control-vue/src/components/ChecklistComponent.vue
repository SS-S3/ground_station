<template>
    <div class="checklist">
        <div v-for="item in checklist" :key="item.id" :class="['checklist-item', { completed: item.completed }]">
            <div :class="['checklist-checkbox', { checked: item.completed }]" @click="$emit('toggle-item', item.id)">
                <span v-if="item.completed">✓</span>
            </div>
            <span class="checklist-text">{{ item.text }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    checklist: Array
})

defineEmits(['toggle-item'])
</script>
  
