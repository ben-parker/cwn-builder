import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const VEHICLE_BUDGETS = [0, 5000, 10000, 15000, 20000, 30000, 40000, 60000, 80000, 100000, 200000]

export const useVehicleStore = defineStore('vehicles', () => {
  const vehicles = ref([])
  const fittings = ref([])
  const mods = ref([])

  const characterLevel = ref(null)
  const hasAceDriverFocus = ref(false)

  const isLoaded = ref(false)

  const vehicleMods = computed(() => [...fittings.value, ...mods.value])

  const vehicleBudget = computed(() => {
    if (!hasAceDriverFocus.value || characterLevel.value === null) return 0
    return VEHICLE_BUDGETS[characterLevel.value] || 0
  })

  async function loadVehicleData() {
    if (isLoaded.value) return
    const vehiclesResponse = await fetch('data/vehicles.json')
    vehicles.value = JSON.parse(await vehiclesResponse.text())

    const fittingsResponse = await fetch('data/vehicle_fittings.json')
    fittings.value = JSON.parse(await fittingsResponse.text()).map(f => ({...f, type: "fitting" }))

    const modsResponse = await fetch('data/vehicle_mods.json')
    mods.value = JSON.parse(await modsResponse.text()).map(m => ({...m, type: "mod" }))
    isLoaded.value = true
  }

  return { vehicles, fittings, mods, loadVehicleData, vehicleMods, characterLevel, hasAceDriverFocus, vehicleBudget }
})
