<script setup lang="ts">
import { defineProps, PropType } from 'vue'

defineProps({
    click: {
        type: Function as PropType<() => void>,
        required: false
    },
    styles: {
        type: String,
        required: false
    },
    label: {
        type: String,
        required: false
    }
})
</script>

<template>
    <div :class="styles">
        <button 
            @click="click" 
            class="
                bg-blue-500 
                hover:bg-blue-600 
                text-white 
                font-semibold 
                py-2 
                px-4 
                rounded-full
                shadow 
                transition 
                duration-300 
                ease-in-out 
                transform 
                hover:scale-105
            "
        >
            <slot></slot>
        </button>
    </div>
</template>
