import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const DRONE_BUDGETS = [0, 1000, 5000, 10000, 15000, 20000, 25000, 35000, 45000, 60000, 80000]

export const useDroneStore = defineStore('drones', () => {
  const drones = ref([])
  const fittings = ref([])
  const mods = ref([])

  const characterLevel = ref(null)
  const hasDronePilotFocus = ref(false)

  const isLoaded = ref(false)

  const droneMods = computed(() => [...fittings.value, ...mods.value])

  const droneBudget = computed(() => {
    if (!hasDronePilotFocus.value || characterLevel.value === null) return 0
    return DRONE_BUDGETS[characterLevel.value] || 0
  })

  async function loadDroneData() {
    if (isLoaded.value) return
    const dronesResponse = await fetch('data/drones.json')
    drones.value = JSON.parse(await dronesResponse.text())

    const fittingsResponse = await fetch('data/drone_fittings.json')
    fittings.value = JSON.parse(await fittingsResponse.text()).map(f => ({...f, type: "fitting" }))

    const modsResponse = await fetch('data/drone_mods.json')
    mods.value = JSON.parse(await modsResponse.text()).map(m => ({...m, type: "mod" }))
    isLoaded.value = true
  }

  return { drones, fittings, mods, loadDroneData, droneMods, characterLevel, hasDronePilotFocus, droneBudget }
})
