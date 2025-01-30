<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  onchange: {
    type: Function,
    default: () => {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  bind: {
    type: Boolean,
    default: false,
  },
  style: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  reverse: {
    type: Boolean,
    default: false,
  },
  scale: {
    type: Number,
    default: 1,
  },
});

// Definimos eventos que el componente emite
const emit = defineEmits(["update:checked", "change"]);

// Manejo interno de "checked" si se usa bind (v-model)
const internalChecked = ref(props.checked);

// Escucha cambios externos en la prop "checked"
watch(
  () => props.checked,
  (newVal) => {
    internalChecked.value = newVal;
  }
);

function onChangeHandler(event: Event) {
  props.onchange?.(event);

  const isChecked = (event.target as HTMLInputElement).checked;
  emit("update:checked", isChecked);
  emit("change", isChecked);
}

const wrapperStyle = computed(() => {
  return `transform: scale(${props.scale}); transform-origin: top left; ${props.style}`;
});
</script>

<template>
  <div :style="wrapperStyle" class="inline-flex items-center">
    <span
      v-if="reverse && label"
      class="mr-2 text-base text-[#212529] select-none"
    >
      {{ label }}
    </span>
    <label class="relative inline-flex items-center gap-2 cursor-pointer">
      <input
        v-if="!bind"
        type="checkbox"
        :checked="props.checked"
        :disabled="props.disabled"
        @change="onChangeHandler"
        class="peer absolute w-0 h-0 opacity-0"
      />
      <input
        v-else
        type="checkbox"
        v-model="internalChecked"
        :disabled="props.disabled"
        @change="onChangeHandler"
        class="peer absolute w-0 h-0 opacity-0"
      />
      <span
        class="relative inline-block w-10 h-5 bg-gray-300 border-2 border-gray-400 rounded-full box-border transition-all duration-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-200 before:content-[''] before:absolute before:top-[1px] before:left-[1px] before:w-[14px] before:h-[14px] before:bg-white before:rounded-full before:transition-transform before:duration-200 peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:before:translate-x-[20px] peer-disabled:bg-gray-200 peer-disabled:border-gray-300"
      ></span>

      <span
        v-if="label && !reverse"
        class="inline-flex items-center text-base text-[#212529] select-none"
      >
        {{ label }}
      </span>
    </label>
  </div>
</template>
