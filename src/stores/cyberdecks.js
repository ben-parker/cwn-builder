import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCyberdeckStore = defineStore('cyberdecks', () => {
  const cyberdecks = ref([])
  const mods = ref([])

  const isLoaded = ref(false)

  async function loadCyberdeckData() {
    if (isLoaded.value) return
    const decksResponse = await fetch('data/cyberdecks.json')
    cyberdecks.value = JSON.parse(await decksResponse.text())

    const modsResponse = await fetch('data/cyberdeck_mods.json')
    mods.value = JSON.parse(await modsResponse.text()).map(m => ({...m, type: "mod" }))
    isLoaded.value = true
  }

  return { cyberdecks, mods, loadCyberdeckData }
})
