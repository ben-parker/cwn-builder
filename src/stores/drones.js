import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDroneStore = defineStore('drones', () => {
  let drones = ref([])
  
  return { drones }
})
