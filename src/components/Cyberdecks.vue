<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted, toRaw, inject } from 'vue'
import { useCyberdeckStore } from '@/stores/cyberdecks'
import Cyberdeck from '@/components/Cyberdeck.vue'
import { clearShareHash } from '@/services/share'
import ShareButton from '@/components/ShareButton.vue'
import GhostTable from '@/components/GhostTable.vue'

const store = useCyberdeckStore()
const isReady = ref(false)
const loadError = ref(false)

const deckList = ref([])
const costs = ref([])
const selectedIndex = ref(null)
const tableRef = ref(null)
const arrowTop = ref(0)
let nextDeckId = 0
const deckRefs = {}

const updateArrowPosition = () => {
    if (selectedIndex.value === null || !tableRef.value) return
    const rows = tableRef.value.querySelectorAll('tbody tr')
    const row = rows[selectedIndex.value]
    if (!row) return
    const tableTop = tableRef.value.getBoundingClientRect().top
    const rowRect = row.getBoundingClientRect()
    arrowTop.value = rowRect.top - tableTop + rowRect.height / 2
}

watch(selectedIndex, () => {
    nextTick(updateArrowPosition)
})

const newDeck = (idx, initialMods) => {
    const deck = { ...structuredClone(toRaw(store.cyberdecks[idx])), _uid: nextDeckId++ }
    if (initialMods) deck._initialMods = initialMods
    deckList.value.push(deck)
    costs.value.push(store.cyberdecks[idx].cost)
}

const browseRef = ref(null)

const selectRow = (idx) => {
    selectedIndex.value = selectedIndex.value === idx ? null : idx
}

const onClickOutside = (e) => {
    if (browseRef.value && !browseRef.value.contains(e.target)) {
        selectedIndex.value = null
    }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const money = (cost) => cost < 0 ? "-$" + Math.abs(cost).toLocaleString("en-US") : "$" + cost.toLocaleString("en-US")

const totalCostRaw = computed(() => costs.value.reduce((prev, cur) => prev + cur, 0))
const allDeckCost = computed(() => money(totalCostRaw.value))

const selectedDeck = computed(() => {
    if (selectedIndex.value === null) return null
    return store.cyberdecks[selectedIndex.value]
})

const buildPayload = () => {
    const units = deckList.value.map(deck => {
        const ref = deckRefs[deck._uid]
        return {
            name: deck.name,
            mods: ref?.mods?.map(m => m.name) ?? [],
        }
    })
    return { v: 1, t: 'cyberdecks', units }
}

// Restore from shared state provided by App.vue
const sharedState = inject('sharedState')
const restoreFromShare = (shared) => {
    if (shared?.t !== 'cyberdecks') return
    deckList.value = []
    costs.value = []
    selectedIndex.value = null
    for (const unit of shared.units ?? []) {
        const idx = store.cyberdecks.findIndex(d => d.name === unit.name)
        if (idx !== -1) newDeck(idx, unit.mods)
    }
    clearShareHash()
}

onMounted(async () => {
    try {
        await store.loadCyberdeckData()
        isReady.value = true
        if (sharedState.value?.t === 'cyberdecks') {
            restoreFromShare(sharedState.value)
            sharedState.value = null
        }
    } catch {
        loadError.value = true
    }
})

// Watch for shared state (arrives async from App.vue or via hashchange)
watch(sharedState, (val) => {
    if (val?.t === 'cyberdecks' && isReady.value) {
        restoreFromShare(val)
        sharedState.value = null
    }
})
</script>

<template>
    <GhostTable v-if="!isReady && !loadError" :columns="8" :rows="5" accent-color="var(--cwn-magenta)" />
    <div v-else-if="loadError" class="load-error">Failed to load cyberdeck data. Try refreshing the page.</div>
    <div v-else id="deck-wrapper">
        <div class="total-cost-bar">
            <div class="cost-section">
                <span class="total-cost-label">Total Cost</span>
                <span class="total-cost-value">{{ allDeckCost }}</span>
            </div>

            <ShareButton :build-payload="buildPayload" :disabled="deckList.length === 0" />
        </div>

        <div class="browse-section" ref="browseRef">
            <div class="table-col">
                <table ref="tableRef">
                    <thead>
                        <tr>
                            <th class="col-action"></th>
                            <th class="col-name">Deck</th>
                            <th>Cost</th>
                            <th>Access</th>
                            <th>Mem</th>
                            <th>Shield</th>
                            <th>CPU</th>
                            <th>Enc.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(deck, index) in store.cyberdecks"
                            :key="index"
                            :class="{ 'row-selected': selectedIndex === index }"
                            @click="selectRow(index)"
                        >
                            <td class="col-action">
                                <button class="circle-add-btn cab-magenta" @click.stop="newDeck(index)" title="Add cyberdeck">+</button>
                            </td>
                            <td class="col-name">{{ deck.name }}</td>
                            <td>{{ money(deck.cost) }}</td>
                            <td>+{{ deck.bonus_access }}</td>
                            <td>{{ deck.memory }}</td>
                            <td>{{ deck.shielding }}</td>
                            <td>{{ deck.cpu }}</td>
                            <td>{{ deck.enc }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="selectedDeck" class="detail-col">
                <div class="speech-arrow" :style="{ top: arrowTop + 'px' }"></div>
                <div class="detail-panel">
                    <h3 class="detail-name">{{ selectedDeck.name }} <span class="detail-base-cost">{{ money(selectedDeck.cost) }}</span></h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Bonus Access</span>
                            <span class="detail-value">+{{ selectedDeck.bonus_access }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Memory</span>
                            <span class="detail-value">{{ selectedDeck.memory }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Shielding</span>
                            <span class="detail-value">{{ selectedDeck.shielding }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">CPU</span>
                            <span class="detail-value">{{ selectedDeck.cpu }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Encumbrance</span>
                            <span class="detail-value">{{ selectedDeck.enc }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="deck-cards">
            <Cyberdeck v-for="(deck, index) in deckList"
                :key="deck._uid"
                :ref="el => { if (el) deckRefs[deck._uid] = el; else delete deckRefs[deck._uid] }"
                :index="index"
                @remove-deck="(idx) => { deckList.splice(idx, 1); costs.splice(idx, 1); }"
                @updated="(data) => costs[data.index] = data.cost"
                :deck="deckList[index]"
                :initialMods="deck._initialMods"
            />
        </div>
    </div>
</template>

<style scoped>
.load-error {
    padding: 2rem;
    color: var(--cwn-magenta);
    text-align: center;
    border: 1px solid var(--cwn-magenta-dim);
    border-radius: 4px;
    background: var(--cwn-bg-soft);
}

#deck-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
}

/* Total cost bar */
.total-cost-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 10px 20px;
    margin-bottom: 1.5rem;
    background: var(--cwn-bg-soft);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    white-space: nowrap;
    min-width: fit-content;
}

.cost-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.total-cost-label {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.75em;
    letter-spacing: 2px;
}

.total-cost-value {
    color: var(--cwn-magenta);
    font-size: 1.4em;
    font-weight: bold;
    text-shadow: var(--cwn-glow-magenta);
}

/* Browse section: table + detail panel */
.browse-section {
    display: flex;
    flex-direction: row;
    gap: 0;
    margin-bottom: 2rem;
    align-items: stretch;
}

.table-col {
    flex-shrink: 0;
}

/* Table styling */
table {
    table-layout: auto;
    width: auto;
    white-space: nowrap;
    border-collapse: collapse;
}

thead tr {
    border-bottom: 2px solid var(--cwn-border-hover);
}

th {
    font-weight: bold;
    padding: 8px 12px;
    color: var(--cwn-text-bright);
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

td {
    padding: 6px 12px;
}

thead tr, tbody tr {
    text-align: center;
}

.col-name {
    text-align: left;
}

td.col-name {
    text-align: left;
}

.col-action {
    width: 40px;
    text-align: center;
}

tbody tr {
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid var(--cwn-border);
}

tbody tr:hover {
    background: var(--cwn-bg-soft);
}

tbody tr.row-selected {
    background: var(--cwn-bg-mute);
    border-left: 2px solid var(--cwn-magenta);
}

/* Detail panel + speech arrow */
.detail-col {
    position: relative;
    margin-left: 16px;
    display: flex;
}

.speech-arrow {
    position: absolute;
    left: 0;
    width: 14px;
    height: 0;
    transform: translateY(-50%);
    transition: top 0.15s ease;
    z-index: 1;
}

.speech-arrow::before {
    content: '';
    position: absolute;
    top: -9px;
    left: -1px;
    width: 0;
    height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-right: 14px solid rgba(255, 0, 170, 0.15);
}

.speech-arrow::after {
    content: '';
    position: absolute;
    top: -8px;
    left: 2px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 12px solid var(--cwn-bg-mute);
}

.detail-panel {
    background: var(--cwn-bg-mute);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 360px;
    margin-left: 13px;
    flex: 1;
}

.detail-name {
    display: block;
    color: var(--cwn-magenta);
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--cwn-border);
}

.detail-base-cost {
    color: var(--cwn-text-muted);
    font-size: 0.85em;
    font-weight: normal;
}

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.detail-full {
    grid-column: 1 / -1;
}

.detail-label {
    color: var(--cwn-text-muted);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.detail-value {
    color: var(--cwn-text-bright);
    font-size: 0.9em;
}

/* Deck cards - flex wrap layout */
.deck-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}
</style>
