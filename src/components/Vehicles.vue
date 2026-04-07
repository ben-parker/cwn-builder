<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted, toRaw, inject } from 'vue'
import { useVehicleStore } from '@/stores/vehicles'
import { useWeaponStore } from '@/stores/weapons'
import Vehicle from '@/components/Vehicle.vue'
import { clearShareHash } from '@/services/share'
import ShareButton from '@/components/ShareButton.vue'
import GhostTable from '@/components/GhostTable.vue'

const store = useVehicleStore()
const weaponStore = useWeaponStore()
const isReady = ref(false)
const loadError = ref(false)

const vehicleList = ref([])
const costs = ref([])
const selectedIndex = ref(null)
const tableRef = ref(null)
const arrowTop = ref(0)
let nextVehicleId = 0
const vehicleRefs = {}

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

const newVehicle = (idx, initialMods, initialWeapons) => {
    const vehicle = { ...structuredClone(toRaw(store.vehicles[idx])), _uid: nextVehicleId++ }
    if (initialMods) vehicle._initialMods = initialMods
    if (initialWeapons) vehicle._initialWeapons = initialWeapons
    vehicleList.value.push(vehicle)
    costs.value.push(store.vehicles[idx].cost)
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
const allVehicleCost = computed(() => money(totalCostRaw.value))

const setLevel = (val) => {
    const n = parseInt(val)
    store.characterLevel = (isNaN(n) || n < 1 || n > 10) ? null : n
}

const budgetRemaining = computed(() => {
    if (!store.vehicleBudget) return null
    return store.vehicleBudget - totalCostRaw.value
})

const outOfPocket = computed(() => {
    if (budgetRemaining.value === null) return totalCostRaw.value
    return Math.max(0, -budgetRemaining.value)
})

const selectedVehicle = computed(() => {
    if (selectedIndex.value === null) return null;
    return store.vehicles[selectedIndex.value];
});

const armorDisplay = (vehicle) => {
    if (typeof vehicle.armor === 'string') return vehicle.armor
    return vehicle.armor
}

const buildPayload = () => {
    const units = vehicleList.value.map(vehicle => {
        const ref = vehicleRefs[vehicle._uid]
        return {
            name: vehicle.name,
            mods: ref?.mods?.map(m => m.name) ?? [],
            weapons: ref?.weapons?.map(w => w.name) ?? [],
        }
    })
    const payload = { v: 1, t: 'vehicles', units }
    if (store.characterLevel != null) payload.lvl = store.characterLevel
    if (store.hasAceDriverFocus) payload.focus = true
    return payload
}

// Restore from shared state provided by App.vue
const sharedState = inject('sharedState')
const restoreFromShare = (shared) => {
    if (shared?.t !== 'vehicles') return
    vehicleList.value = []
    costs.value = []
    selectedIndex.value = null
    if (shared.lvl != null) setLevel(shared.lvl)
    if (shared.focus) store.hasAceDriverFocus = true
    for (const unit of shared.units ?? []) {
        const idx = store.vehicles.findIndex(v => v.name === unit.name)
        if (idx !== -1) newVehicle(idx, unit.mods, unit.weapons)
    }
    clearShareHash()
}

onMounted(async () => {
    try {
        await Promise.all([store.loadVehicleData(), weaponStore.loadWeaponData()])
        isReady.value = true
        if (sharedState.value?.t === 'vehicles') {
            restoreFromShare(sharedState.value)
            sharedState.value = null
        }
    } catch {
        loadError.value = true
    }
})

// Watch for shared state (arrives async from App.vue or via hashchange)
watch(sharedState, (val) => {
    if (val?.t === 'vehicles' && isReady.value) {
        restoreFromShare(val)
        sharedState.value = null
    }
})
</script>

<template>
    <GhostTable v-if="!isReady && !loadError" :columns="13" :rows="6" accent-color="var(--cwn-yellow)" />
    <div v-else-if="loadError" class="load-error">Failed to load vehicle data. Try refreshing the page.</div>
    <div v-else id="vehicle-wrapper">
        <div class="total-cost-bar">
            <div class="cost-section">
                <span class="total-cost-label">Total Cost</span>
                <span class="total-cost-value">{{ allVehicleCost }}</span>
            </div>

            <div v-if="store.vehicleBudget > 0" class="budget-section">
                <div class="budget-item">
                    <span class="budget-label">Budget</span>
                    <span class="budget-value">{{ money(store.vehicleBudget) }}</span>
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

            <div class="char-section">
                <div class="char-field">
                    <label class="char-label" for="vehicle-char-level">Level</label>
                    <select
                        id="vehicle-char-level"
                        class="char-input"
                        :value="store.characterLevel ?? ''"
                        @change="setLevel($event.target.value)"
                    >
                        <option value="">-</option>
                        <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
                    </select>
                </div>
                <label class="char-checkbox">
                    <input type="checkbox" v-model="store.hasAceDriverFocus" />
                    <span>Ace Driver</span>
                </label>
            </div>

            <ShareButton :build-payload="buildPayload" :disabled="vehicleList.length === 0" />
        </div>

        <div class="browse-section" ref="browseRef">
            <div class="table-col">
                <table ref="tableRef">
                    <thead>
                        <tr>
                            <th class="col-action"></th>
                            <th class="col-name">Vehicle</th>
                            <th>Cost</th>
                            <th>Spd</th>
                            <th>Arm.</th>
                            <th>AC</th>
                            <th>TT</th>
                            <th>HP</th>
                            <th>Crew</th>
                            <th>Pow.</th>
                            <th>Mass</th>
                            <th>Size</th>
                            <th>Hrd.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(vehicle, index) in store.vehicles"
                            :key="index"
                            :class="{ 'row-selected': selectedIndex === index }"
                            @click="selectRow(index)"
                        >
                            <td class="col-action">
                                <button class="circle-add-btn cab-yellow" @click.stop="newVehicle(index)" title="Add vehicle">+</button>
                            </td>
                            <td class="col-name">
                                {{ vehicle.name }}
                                <span v-if="vehicle.contact_only" class="contact-badge" title="Requires a suitable Contact to acquire">@</span>
                            </td>
                            <td>{{ money(vehicle.cost) }}</td>
                            <td>{{ vehicle.speed }}</td>
                            <td :title="vehicle.armor_note || ''">{{ armorDisplay(vehicle) }}</td>
                            <td>{{ vehicle.ac }}</td>
                            <td>{{ vehicle.tt }}</td>
                            <td>{{ vehicle.hp }}</td>
                            <td>{{ vehicle.crew }}</td>
                            <td>{{ vehicle.power }}</td>
                            <td>{{ vehicle.mass }}</td>
                            <td>{{ vehicle.size }}</td>
                            <td>{{ vehicle.hardpoints }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="selectedVehicle" class="detail-col">
                <div class="speech-arrow" :style="{ top: arrowTop + 'px' }"></div>
                <div class="detail-panel">
                    <h3 class="detail-name">
                        {{ selectedVehicle.name }}
                        <span v-if="selectedVehicle.contact_only" class="contact-badge" title="Requires a suitable Contact to acquire">@</span>
                        <span class="detail-base-cost">{{ money(selectedVehicle.cost) }}</span>
                    </h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Size</span>
                            <span class="detail-value">{{ selectedVehicle.size === 'S' ? 'Small' : selectedVehicle.size === 'M' ? 'Medium' : 'Large' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Speed</span>
                            <span class="detail-value">{{ selectedVehicle.speed }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Armor</span>
                            <span class="detail-value" :title="selectedVehicle.armor_note || ''">{{ armorDisplay(selectedVehicle) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">AC</span>
                            <span class="detail-value">{{ selectedVehicle.ac }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Trauma Target</span>
                            <span class="detail-value">{{ selectedVehicle.tt }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">HP</span>
                            <span class="detail-value">{{ selectedVehicle.hp }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Crew</span>
                            <span class="detail-value">{{ selectedVehicle.crew }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Power</span>
                            <span class="detail-value">{{ selectedVehicle.power }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Mass</span>
                            <span class="detail-value">{{ selectedVehicle.mass }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Hardpoints</span>
                            <span class="detail-value">{{ selectedVehicle.hardpoints }}</span>
                        </div>
                        <div v-if="selectedVehicle.armor_note" class="detail-item detail-full">
                            <span class="detail-label">Armor Note</span>
                            <span class="detail-value detail-note">{{ selectedVehicle.armor_note }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="vehicle-cards">
            <Vehicle v-for="(vehicle, index) in vehicleList"
                :key="vehicle._uid"
                :ref="el => { if (el) vehicleRefs[vehicle._uid] = el; else delete vehicleRefs[vehicle._uid] }"
                :index="index"
                @remove-vehicle="(idx) => { vehicleList.splice(idx, 1); costs.splice(idx, 1); }"
                @updated="(data) => costs[data.index] = data.cost"
                :vehicle="vehicleList[index]"
                :initialMods="vehicle._initialMods"
                :initialWeapons="vehicle._initialWeapons"
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

#vehicle-wrapper {
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
    color: var(--cwn-yellow);
    font-size: 1.4em;
    font-weight: bold;
    text-shadow: var(--cwn-glow-yellow);
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
    color: var(--cwn-magenta);
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
    border-color: var(--cwn-yellow-dim);
    box-shadow: var(--cwn-glow-yellow);
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
    accent-color: var(--cwn-yellow);
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
    border-left: 2px solid var(--cwn-yellow);
}

/* Contact badge */
.contact-badge {
    color: var(--cwn-magenta);
    font-weight: bold;
    font-size: 0.85em;
    margin-left: 2px;
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
    border-right: 14px solid rgba(240, 224, 0, 0.15);
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
    color: var(--cwn-yellow);
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

.detail-note {
    font-size: 0.8em;
    color: var(--cwn-text-muted);
    font-style: italic;
}

/* Vehicle cards - flex wrap layout */
.vehicle-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}
</style>
