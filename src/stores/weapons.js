import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWeaponStore = defineStore('weapons', () => {
  const weapons = ref([])
  const isLoaded = ref(false)

  async function loadWeaponData() {
    if (isLoaded.value) return
    const response = await fetch('data/weapons.json')
    weapons.value = JSON.parse(await response.text()).map(w => ({...w, type: "weapon" }))
    isLoaded.value = true
  }

  return { weapons, loadWeaponData }
})
