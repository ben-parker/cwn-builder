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

<style scoped>

</style>
