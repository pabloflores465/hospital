<script setup lang="ts">
import { Button } from "#components";

const num: number = 0;

function handleClick() {
  console.log("¡Se hizo click en el botón!");
}
</script>

<template>
  <div class="min-h-screen bg-[url('public/bed.jpg')] bg-cover bg-center fade-in">

  </div>
</template>
<style>
@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 0.5s ease-in forwards;
}
</style>