<script setup lang="ts">
import { defineProps } from "vue";

withDefaults(
  defineProps<{
    click?: () => void;
    styles?: string;
    label?: string;
    layout?: string;
  }>(),
  {
    click: () => {},
    styles: "",
    label: "Click me",
    layout: "",
  }
);
</script>

<template>
  <div :class="layout">
    <button
      @click="click"
      :class="[
        'bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full shadow transition duration-300 ease-in-out transform hover:scale-105',
        styles,
      ]"
    >
      <div class="flex items-center">
        <slot></slot>
      </div>
    </button>
  </div>
</template>
