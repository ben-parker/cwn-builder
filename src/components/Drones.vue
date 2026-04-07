<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted, onDeactivated, toRaw } from 'vue'
import { useDroneStore } from '@/stores/drones'
import { useWeaponStore } from '@/stores/weapons'
import { useAppModeStore } from '@/stores/appMode'
import Drone from '@/components/Drone.vue'
import ShareButton from '@/components/ShareButton.vue'
import GhostTable from '@/components/GhostTable.vue'
import { savePageState, loadPageState, debounce } from '@/services/persistence'

const store = useDroneStore()
const weaponStore = useWeaponStore()
const isReady = ref(false)
const loadError = ref(false)

const droneList = ref([])
const costs = ref([])
const selectedIndex = ref(null)
const tableRef = ref(null)
const arrowTop = ref(0)
let nextDroneId = 0
const droneRefs = {}

const updateArrowPosition = () => {
    if (selectedIndex.value === null || !tableRef.value) return;
    const rows = tableRef.value.querySelectorAll('tbody tr');
    const row = rows[selectedIndex.value];
    if (!row) return;
    const tableTop = tableRef.value.getBoundingClientRect().top;
    const rowRect = row.getBoundingClientRect();
    arrowTop.value = rowRect.top - tableTop + rowRect.height / 2;
};

watch(selectedIndex, () => {
    nextTick(updateArrowPosition);
});

const newDrone = (idx, initialMods, initialWeapons) => {
    const drone = { ...structuredClone(toRaw(store.drones[idx])), _uid: nextDroneId++ }
    if (initialMods) drone._initialMods = initialMods
    if (initialWeapons) drone._initialWeapons = initialWeapons
    droneList.value.push(drone)
    costs.value.push(store.drones[idx].cost)
};

const browseRef = ref(null)

const selectRow = (idx) => {
    selectedIndex.value = selectedIndex.value === idx ? null : idx;
};

const onClickOutside = (e) => {
    if (browseRef.value && !browseRef.value.contains(e.target)) {
        selectedIndex.value = null;
    }
};

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));

const money = (cost) => cost < 0 ? "-$" + Math.abs(cost).toLocaleString("en-US") : "$" + cost.toLocaleString("en-US")

const totalCostRaw = computed(() => costs.value.reduce((prev, cur) => prev + cur, 0))
const allDroneCost = computed(() => money(totalCostRaw.value))

const setLevel = (val) => {
    const n = parseInt(val)
    store.characterLevel = (isNaN(n) || n < 1 || n > 10) ? null : n
}

const budgetRemaining = computed(() => {
    if (!store.droneBudget) return null
    return store.droneBudget - totalCostRaw.value
})

const outOfPocket = computed(() => {
    if (budgetRemaining.value === null) return totalCostRaw.value
    return Math.max(0, -budgetRemaining.value)
})

const selectedDrone = computed(() => {
    if (selectedIndex.value === null) return null;
    return store.drones[selectedIndex.value];
});

const portabilityNote = (drone) => {
    if (drone.encumbrance === '-') return 'Non-portable — too large to carry';
    const enc = parseInt(drone.encumbrance);
    if (enc === 1) return 'Portable — small enough to carry in one hand';
    if (enc <= 3) return 'Portable — requires two hands to carry';
    return 'Portable — requires a whole-body effort to haul';
};

const weaponMount = (drone) => {
    if (drone.encumbrance === '-') return 'Heavy weapons (GM discretion)';
    const enc = parseInt(drone.encumbrance);
    if (enc <= 3) return 'Pistol-sized only';
    return 'Rifle-sized or smaller';
};

const moveType = (drone) => {
    if (drone.move.includes('fly')) return 'Flying';
    if (drone.move.includes('swim')) return 'Aquatic';
    return 'Ground';
};

const buildPayload = () => {
    const units = droneList.value.map(drone => {
        const ref = droneRefs[drone._uid]
        return {
            name: drone.name,
            mods: ref?.mods?.map(m => m.name) ?? [],
            weapons: ref?.weapons?.map(w => w.name) ?? [],
        }
    })
    const payload = { v: 1, t: 'drones', units }
    if (store.characterLevel != null) payload.lvl = store.characterLevel
    if (store.hasDronePilotFocus) payload.focus = true
    return payload
}

// Restore builds from a payload (shared link or localStorage)
const appMode = useAppModeStore()

const restoreFromPayload = (payload) => {
    if (payload?.t !== 'drones') return
    droneList.value = []
    costs.value = []
    selectedIndex.value = null
    store.characterLevel = null
    store.hasDronePilotFocus = false
    if (payload.lvl != null) setLevel(payload.lvl)
    if (payload.focus) store.hasDronePilotFocus = true
    for (const unit of payload.units ?? []) {
        const idx = store.drones.findIndex(d => d.name === unit.name)
        if (idx !== -1) newDrone(idx, unit.mods, unit.weapons)
    }
}

// Auto-save to localStorage (debounced, skipped during shared view)
const scheduleSave = debounce(() => {
    if (appMode.isSharedView) return
    savePageState('drones', buildPayload())
}, 500)

const triggerSave = () => scheduleSave()

onDeactivated(() => scheduleSave.flush())

onMounted(async () => {
    try {
        await Promise.all([store.loadDroneData(), weaponStore.loadWeaponData()])
        isReady.value = true

        if (appMode.isSharedView) {
            if (appMode.sharedPayload?.t === 'drones') restoreFromPayload(appMode.sharedPayload)
        } else {
            const saved = loadPageState('drones')
            if (saved) restoreFromPayload(saved)
        }
    } catch {
        loadError.value = true
    }
})

// Persist on unit list changes and store setting changes
watch(() => droneList.value.length, triggerSave)
watch(() => [store.characterLevel, store.hasDronePilotFocus], triggerSave)

// Handle shared view transitions
watch(() => appMode.isSharedView, (isShared, wasShared) => {
    if (!isReady.value) return
    if (isShared) {
        scheduleSave.flush()
        if (appMode.sharedPayload?.t === 'drones') {
            restoreFromPayload(appMode.sharedPayload)
        } else {
            droneList.value = []
            costs.value = []
            selectedIndex.value = null
        }
    } else if (wasShared) {
        const saved = loadPageState('drones')
        if (saved) {
            restoreFromPayload(saved)
        } else {
            droneList.value = []
            costs.value = []
            selectedIndex.value = null
        }
    }
})

// Handle hashchange while app is open (new share link pasted)
watch(() => appMode.sharedPayload, (val) => {
    if (val?.t === 'drones' && isReady.value) restoreFromPayload(val)
})
</script>

<template>
    <GhostTable v-if="!isReady && !loadError" :columns="10" :rows="6" accent-color="var(--cwn-cyan)" />
    <div v-else-if="loadError" class="load-error">Failed to load drone data. Try refreshing the page.</div>
    <div v-else id="drone-wrapper">
        <div class="total-cost-bar">
            <div class="cost-section">
                <span class="total-cost-label">Total Cost</span>
                <span class="total-cost-value">{{ allDroneCost }}</span>
            </div>

            <div class="char-section">
                <div class="char-field">
                    <label class="char-label" for="char-level">Level</label>
                    <select
                        id="char-level"
                        class="char-input"
                        :value="store.characterLevel ?? ''"
                        @change="setLevel($event.target.value)"
                    >
                        <option value="">-</option>
                        <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
                    </select>
                </div>
                <label class="char-checkbox">
                    <input type="checkbox" v-model="store.hasDronePilotFocus" />
                    <span>Drone Pilot</span>
                </label>
            </div>

            <div v-if="store.droneBudget > 0" class="budget-section">
                <div class="budget-item">
                    <span class="budget-label">Budget</span>
                    <span class="budget-value">{{ money(store.droneBudget) }}</span>
                </div>
                <div class="budget-item">
                    <span class="budget-label">Remaining</span>
                    <span class="budget-value" :class="{ 'zero-budget': budgetRemaining <= 0 }">{{ money(Math.max(0, budgetRemaining)) }}</span>
                </div>
                <div class="budget-item">
                    <span class="budget-label">Out of Pocket</span>
                    <span class="budget-value" :class="outOfPocket > 0 ? 'out-of-pocket' : 'zero-budget'">{{ money(outOfPocket) }}</span>
                </div>
            </div>

            <ShareButton :build-payload="buildPayload" :disabled="droneList.length === 0" />
            <button v-if="appMode.isSharedView" class="exit-shared-btn" @click="appMode.exitSharedView()">
                Exit Shared View
            </button>
        </div>

        <div class="browse-section" ref="browseRef">
            <div class="table-col">
                <table ref="tableRef">
                    <thead>
                        <tr>
                            <th class="col-action"></th>
                            <th class="col-name">Drone</th>
                            <th>Cost</th>
                            <th>AC</th>
                            <th>TT</th>
                            <th>HP</th>
                            <th>Fit.</th>
                            <th>Move</th>
                            <th>Hrd.</th>
                            <th>Enc.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(drone, index) in store.drones"
                            :key="index"
                            :class="{ 'row-selected': selectedIndex === index }"
                            @click="selectRow(index)"
                        >
                            <td class="col-action">
                                <button class="circle-add-btn" @click.stop="newDrone(index)" title="Add drone">+</button>
                            </td>
                            <td class="col-name">{{ drone.name }}</td>
                            <td>{{ money(drone.cost) }}</td>
                            <td>{{ drone.ac }}</td>
                            <td>{{ drone.tt }}</td>
                            <td>{{ drone.hp }}</td>
                            <td>{{ drone.fittings }}</td>
                            <td>{{ drone.move }}</td>
                            <td>{{ drone.hardpoints }}</td>
                            <td>{{ drone.encumbrance }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="selectedDrone" class="detail-col">
                <div class="speech-arrow" :style="{ top: arrowTop + 'px' }"></div>
                <div class="detail-panel">
                    <h3 class="detail-name">{{ selectedDrone.name }} <span class="detail-base-cost">{{ money(selectedDrone.cost) }}</span></h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">{{ moveType(selectedDrone) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">AC</span>
                            <span class="detail-value">{{ selectedDrone.ac }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Trauma Target</span>
                            <span class="detail-value">{{ selectedDrone.tt }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">HP</span>
                            <span class="detail-value">{{ selectedDrone.hp }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Fittings</span>
                            <span class="detail-value">{{ selectedDrone.fittings }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Hardpoints</span>
                            <span class="detail-value">{{ selectedDrone.hardpoints }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Move</span>
                            <span class="detail-value">{{ selectedDrone.move }}</span>
                        </div>
                        <div class="detail-item detail-full">
                            <span class="detail-label">Portability</span>
                            <span class="detail-value">{{ portabilityNote(selectedDrone) }}</span>
                        </div>
                        <div class="detail-item detail-full">
                            <span class="detail-label">Weapon Mount</span>
                            <span class="detail-value">{{ weaponMount(selectedDrone) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="drone-cards">
            <Drone v-for="(drone, index) in droneList"
                :key="drone._uid"
                :ref="el => { if (el) droneRefs[drone._uid] = el; else delete droneRefs[drone._uid] }"
                :index="index"
                @remove-drone="(idx) => { droneList.splice(idx, 1); costs.splice(idx, 1); }"
                @updated="(data) => { costs[data.index] = data.cost; triggerSave() }"
                :drone="droneList[index]"
                :initialMods="drone._initialMods"
                :initialWeapons="drone._initialWeapons"
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

#drone-wrapper {
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
    min-width: 180px;
}

.total-cost-label {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.75em;
    letter-spacing: 2px;
}

.total-cost-value {
    color: var(--cwn-cyan);
    font-size: 1.4em;
    font-weight: bold;
    text-shadow: var(--cwn-glow-cyan);
}

/* Budget section */
.budget-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-left: 16px;
    border-left: 1px solid var(--cwn-border);
}

.budget-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
}

.budget-label {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.6em;
    letter-spacing: 1px;
}

.budget-value {
    color: var(--cwn-text-bright);
    font-size: 0.9em;
    font-weight: bold;
}

.budget-value.zero-budget {
    color: var(--cwn-text-muted);
}

.budget-value.out-of-pocket {
    color: var(--cwn-yellow);
}

/* Character section */
.char-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 16px;
    border-left: 1px solid var(--cwn-border);
}

.char-field {
    display: flex;
    align-items: center;
    gap: 6px;
}

.char-label {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.65em;
    letter-spacing: 1px;
}

.char-input {
    width: 48px;
    padding: 3px 4px;
    background: var(--cwn-bg-deep);
    border: 1px solid var(--cwn-border);
    border-radius: 2px;
    color: var(--cwn-text-bright);
    font-size: 0.85em;
    text-align: center;
    cursor: pointer;
}

.char-input:focus {
    border-color: var(--cwn-cyan-dim);
    box-shadow: var(--cwn-glow-cyan);
    outline: none;
}

.char-checkbox {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: var(--cwn-text-muted);
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.char-checkbox input[type="checkbox"] {
    accent-color: var(--cwn-cyan);
    cursor: pointer;
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
    border-left: 2px solid var(--cwn-cyan);
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

/* Border triangle (slightly larger, behind) */
.speech-arrow::before {
    content: '';
    position: absolute;
    top: -9px;
    left: -1px;
    width: 0;
    height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-right: 14px solid rgba(0, 240, 255, 0.15);
}

/* Fill triangle (on top) */
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
    color: var(--cwn-cyan);
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

/* Drone cards - flex wrap layout */
.drone-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.exit-shared-btn {
    padding: 4px 12px;
    background: transparent;
    border: 1px solid var(--cwn-cyan-dim);
    border-radius: 3px;
    color: var(--cwn-cyan);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
}

.exit-shared-btn:hover {
    background: var(--cwn-cyan-dim);
    color: var(--cwn-text-bright);
    box-shadow: var(--cwn-glow-cyan);
}
</style>
