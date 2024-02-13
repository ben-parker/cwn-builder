import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDroneStore = defineStore('drones', () => {
  let drones = ref([])
  let fittings = ref([])
  let mods = ref([])

  const droneMods = computed(() => [...fittings.value, ...mods.value])

  async function loadDroneData() {
    const dronesResponse = await fetch('data/drones.json')
    drones.value = JSON.parse(await dronesResponse.text())

    const fittingsResponse = await fetch('data/drone_fittings.json')
    fittings.value = JSON.parse(await fittingsResponse.text()).map(f => ({...f, type: "fitting" }))

    const modsResponse = await fetch('data/drone_mods.json')
    mods.value = JSON.parse(await modsResponse.text()).map(m => ({...m, type: "mod" }))
  } 
  
  return { drones, fittings, mods, loadDroneData, droneMods }
})
