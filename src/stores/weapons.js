import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWeaponStore = defineStore('weapons', () => {
  const weapons = ref([])

  async function loadWeaponData() {
    const response = await fetch('data/weapons.json')
    weapons.value = JSON.parse(await response.text()).map(w => ({...w, type: "weapon" }))
  }

  return { weapons, loadWeaponData }
})
