<script setup>
import Drones from './components/Drones.vue'
</script>

<template>
  <header></header>

  <main>
    <Suspense>
      <Drones />
    </Suspense>
  </main>
</template>

<style>
/* body .p-component-overlay {
  background-color: rgba(255, 255, 0, 0.8);
  opacity: 1;
} */
</style>
