<script setup lang="ts">
import { Button } from '#components';
function handleClick() {
  console.log('¡Se hizo click en el botón!');
}
</script>

<template>
    <div class="bg-red-500">
      adios
    </div>
    <Button :click="handleClick" styles="m-3 bg-red-500">
      que dice
    </Button>
  </template>