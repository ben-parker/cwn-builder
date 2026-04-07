<script setup>
import { ref, onUnmounted, onDeactivated } from 'vue'
import { buildShareUrl } from '@/services/share'

const props = defineProps({
    buildPayload: { type: Function, required: true },
    disabled: { type: Boolean, default: false },
})

const state = ref('idle') // 'idle' | 'loading' | 'success'
let successTimer = null

async function handleClick() {
    if (state.value !== 'idle') return
    state.value = 'loading'
    try {
        const payload = props.buildPayload()
        await buildShareUrl(payload)
        state.value = 'success'
        successTimer = setTimeout(() => { state.value = 'idle' }, 3000)
    } catch {
        state.value = 'idle'
    }
}

function cleanup() {
    clearTimeout(successTimer)
    state.value = 'idle'
}

onDeactivated(cleanup)
onUnmounted(cleanup)
</script>

<template>
    <button
        class="share-btn"
        @click="handleClick"
        :disabled="disabled || state !== 'idle'"
        :title="state === 'success' ? 'link copied!' : 'Share build'"
    >
        <!-- Idle: share/upload icon -->
        <svg v-if="state === 'idle'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>

        <!-- Loading: spinner -->
        <span v-else-if="state === 'loading'" class="share-spinner"></span>

        <!-- Success: animated text -->
        <span v-else class="share-success-text">link copied!</span>
    </button>
</template>

<style scoped>
.share-btn {
    margin-left: auto;
    padding: 5px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    color: var(--cwn-text-muted);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    min-height: 26px;
}

.share-btn:hover:not(:disabled) {
    color: var(--cwn-cyan);
    border-color: var(--cwn-cyan-dim);
    box-shadow: var(--cwn-glow-cyan);
}

.share-btn:disabled {
    opacity: 0.3;
    cursor: default;
}

.share-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--cwn-text-muted);
    border-top-color: var(--cwn-cyan);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.share-success-text {
    font-size: 0.65em;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--cwn-cyan);
    white-space: nowrap;
    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes scale-in {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
