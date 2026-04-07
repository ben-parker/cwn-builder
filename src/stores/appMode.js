import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { clearShareHash } from '@/services/share'

export const useAppModeStore = defineStore('appMode', () => {
  const isSharedView = ref(false)
  const sharedPayload = ref(null)
  const sharedPageType = computed(() => sharedPayload.value?.t ?? null)

  function enterSharedView(payload) {
    sharedPayload.value = payload
    isSharedView.value = true
  }

  function exitSharedView() {
    isSharedView.value = false
    sharedPayload.value = null
    clearShareHash()
  }

  return { isSharedView, sharedPayload, sharedPageType, enterSharedView, exitSharedView }
})
