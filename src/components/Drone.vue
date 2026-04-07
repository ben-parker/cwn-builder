<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ModBlock from '@/components/ModBlock.vue'
import { useDroneStore } from '@/stores/drones'
import { addModEffect, removeModEffect } from '@/services/fitting_effects'

const store = useDroneStore()
const props = defineProps(['index', 'drone'])
const emit = defineEmits(['updated'])

const searchText = ref('')
const visible = ref(false)
const mods = ref([])
const previewedMod = ref(null)
const addedThisSession = ref([])

const STACKABLE_NAMES = new Set([
    'Ammo Supply', 'Manipulator Tendrils', 'Memory Banks', 'Ammo Caddy'
])

const isStackable = (name) => STACKABLE_NAMES.has(name)

// Equipped tracking
const equippedNames = computed(() => new Set(mods.value.map(m => m.name)))
const equipCounts = computed(() => {
    const counts = {}
    mods.value.forEach(m => { counts[m.name] = (counts[m.name] || 0) + 1 })
    return counts
})

const removeMod = function(data) {
    removeModEffect(mods.value[data.index], props.drone);
    mods.value.splice(data.index, 1);
    emit('updated', { index: props.index, cost: totalCost.value });
};

const select = function(fitting) {
    if (!canAddItem(fitting)) return
    addModEffect(fitting, props.drone);
    mods.value.push(fitting);
    emit('updated', { index: props.index, cost: totalCost.value });
    // Flash feedback
    addedThisSession.value.push(fitting.name)
    setTimeout(() => {
        const idx = addedThisSession.value.indexOf(fitting.name)
        if (idx !== -1) addedThisSession.value.splice(idx, 1)
    }, 600)
};

const preview = function(fitting) {
    previewedMod.value = previewedMod.value?.name === fitting.name ? null : fitting
}

const openDialog = function() {
    searchText.value = ''
    previewedMod.value = null
    addedThisSession.value = []
    visible.value = true
}

const money = (cost) => cost < 0 ? "-$" + Math.abs(cost).toLocaleString("en-US") : "$" + cost.toLocaleString("en-US");
const modifiedMove = (move, modifier) => {
    const re = /^(\d+)(m \w+)$/;
    const matches = re.exec(move);

    if (matches === null || matches.length !== 3) {
        return move;
    }

    const moveValue = parseInt(matches[1]);
    if (!moveValue) return move;

    return ((moveValue + modifier) + matches[2]);
};

// Computed
const addedMods = computed(() => mods.value.filter(m => m.type === 'mod'));
const addedFittings = computed(() => mods.value.filter(m => m.type === 'fitting'));
const tooManyFittings = computed(() =>
    (addedFittings.value.length + (props.drone.extraFittings ?? 0))
    > (props.drone.fittings + (props.drone.extraMaxFittings ?? 0)));

const fittingsAtCapacity = computed(() =>
    (addedFittings.value.length + (props.drone.extraFittings ?? 0))
    >= (props.drone.fittings + (props.drone.extraMaxFittings ?? 0)));

const fittingSlotDisplay = computed(() => {
    const used = addedFittings.value.length + (props.drone.extraFittings ?? 0)
    const max = props.drone.fittings + (props.drone.extraMaxFittings ?? 0)
    return `${used}/${max}`
})

const totalHardpoints = computed(() => props.drone.hardpoints + (props.drone.extraHardpoints ?? 0))
const hasHardpoints = computed(() => totalHardpoints.value > 0)

const filteredFittings = computed(() => {
    const items = store.droneMods.filter(m => m.type === 'fitting')
    if (searchText.value.length < 2) return items
    const q = searchText.value.toLowerCase()
    return items.filter(m =>
        m.name.toLowerCase().includes(q) || m.effect_text.toLowerCase().includes(q))
})

const filteredMods = computed(() => {
    const items = store.droneMods.filter(m => m.type === 'mod')
    if (searchText.value.length < 2) return items
    const q = searchText.value.toLowerCase()
    return items.filter(m =>
        m.name.toLowerCase().includes(q) || m.effect_text.toLowerCase().includes(q))
})

const totalCost = computed(() => {
    if (mods.value.length === 0)
        return props.drone.cost;

    const modCosts = mods.value.reduce((prev, cur) =>
        prev + (props.drone.cost * cur.cost_multiplier),  0);

    return props.drone.cost + modCosts;
})

const canAddItem = (fitting) => {
    const equipped = equippedNames.value.has(fitting.name)
    if (!equipped) return true
    return isStackable(fitting.name)
}
</script>

<template>
    <div class="drone-card">
        <div class="drone-heading">
            <div class="drone-title">
                <h3>{{ drone.name }}</h3>
                <span class="drone-cost">{{ money(totalCost) }}</span>
            </div>
            <div class="heading-actions">
                <a class="heading-action-btn clickable" @click="openDialog" title="Add Mod/Fitting">+ Mod/Fitting</a>
                <a class="heading-action-btn" :class="{ clickable: hasHardpoints, disabled: !hasHardpoints }" title="Add Weapon">+ Weapon</a>
                <a class="remove-btn clickable" @click="$emit('removeDrone', index)" title="Remove">&times;</a>
            </div>
        </div>
        <div class="drone-stats">
            <div class="stat">
                <span class="stat-label">AC</span>
                <span class="stat-value">{{ drone.ac }}<span v-if="(drone.extraAc ?? 0) > 0" class="stat-mod">({{ drone.ac + drone.extraAc }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">TT</span>
                <span class="stat-value">{{ drone.tt }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">HP</span>
                <span class="stat-value">{{ drone.hp }}<span v-if="(drone.extraHp ?? 0) > 0" class="stat-mod">({{ drone.hp + drone.extraHp }})</span></span>
            </div>
            <div class="stat" :class="{error: tooManyFittings}">
                <span class="stat-label">Fit.</span>
                <span class="stat-value">{{ addedFittings.length + (drone.extraFittings ?? 0) }}/{{ drone.fittings + (drone.extraMaxFittings ?? 0)}}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Move</span>
                <span class="stat-value">{{ modifiedMove(drone.move, drone.extraMove ?? 0) }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Hrd.</span>
                <span class="stat-value">{{ drone.hardpoints }}<span v-if="(drone.extraHardpoints ?? 0) > 0" class="stat-mod">({{ totalHardpoints }})</span></span>
            </div>
            <div v-if="parseInt(drone.encumbrance)" class="stat">
                <span class="stat-label">Enc.</span>
                <span class="stat-value">{{ drone.encumbrance }}<span v-if="(drone.extraEncumbrance ?? 0) !== 0" class="stat-mod">({{ drone.encumbrance + drone.extraEncumbrance }})</span></span>
            </div>
            <div v-else class="stat">
                <span class="stat-label">Enc.</span>
                <span class="stat-value">{{ drone.encumbrance }}</span>
            </div>
        </div>
        <div v-if="mods.length" class="drone-mods">
            <ModBlock class="mod-block" v-for="(mod, index) in mods" @remove-mod="removeMod" :fitting="mod" :drone="drone" removable="true" :index="index" />
        </div>

        <Dialog v-model:visible="visible" modal :dismissableMask="true" header="Modify Drone" :style="{ width: '75%' }">
            <!-- Toolbar -->
            <div class="dialog-toolbar">
                <div class="search-wrapper">
                    <InputText v-model="searchText" placeholder="Search mods & fittings..." class="search-input" />
                    <a v-if="searchText" class="search-clear clickable" @click="searchText = ''" title="Clear search">&times;</a>
                </div>
                <div class="toolbar-right">
                    <span class="slot-pill" :class="{ 'over-limit': tooManyFittings }">
                        <span class="slot-label">Fit</span>
                        <span class="slot-value">{{ addedFittings.length + (drone.extraFittings ?? 0) }}/{{ drone.fittings + (drone.extraMaxFittings ?? 0) }}</span>
                    </span>
                    <span class="slot-pill">
                        <span class="slot-label">Mods</span>
                        <span class="slot-value">{{ addedMods.length }}</span>
                    </span>
                    <button class="done-btn" @click="visible = false">Done</button>
                </div>
            </div>

            <!-- Two-column body -->
            <div class="dialog-body">
                <!-- Left: compact list -->
                <div class="mod-list-col">
                    <!-- Fittings section -->
                    <div class="section-header">
                        Fittings
                    </div>
                    <div v-if="fittingsAtCapacity" class="capacity-warning">
                        Fitting slots full &mdash; {{ fittingSlotDisplay }}
                    </div>
                    <ModBlock
                        v-for="fitting in filteredFittings"
                        :key="'f-' + fitting.name"
                        compact
                        :fitting="fitting"
                        :drone="drone"
                        :searchText="searchText"
                        :selected="previewedMod?.name === fitting.name"
                        :equipped="equippedNames.has(fitting.name)"
                        :equipCount="equipCounts[fitting.name] || 0"
                        :stackable="isStackable(fitting.name)"
                        :class="{ 'mod-just-added': addedThisSession.includes(fitting.name) }"
                        @click="preview(fitting)"
                    >
                        <template #add-button>
                            <button class="row-add-btn" @click.stop="select(fitting)" title="Add">+</button>
                        </template>
                    </ModBlock>

                    <!-- Mods section -->
                    <div class="section-header">
                        Mods
                    </div>
                    <ModBlock
                        v-for="fitting in filteredMods"
                        :key="'m-' + fitting.name"
                        compact
                        :fitting="fitting"
                        :drone="drone"
                        :searchText="searchText"
                        :selected="previewedMod?.name === fitting.name"
                        :equipped="equippedNames.has(fitting.name)"
                        :equipCount="equipCounts[fitting.name] || 0"
                        :stackable="false"
                        :class="{ 'mod-just-added': addedThisSession.includes(fitting.name) }"
                        @click="preview(fitting)"
                    >
                        <template #add-button>
                            <button class="row-add-btn" @click.stop="select(fitting)" title="Add">+</button>
                        </template>
                    </ModBlock>

                    <!-- No results -->
                    <div v-if="filteredFittings.length === 0 && filteredMods.length === 0" class="no-results">
                        No results found
                    </div>
                </div>

                <!-- Right: detail panel -->
                <div class="mod-detail-col">
                    <div v-if="!previewedMod" class="detail-empty">
                        Click an item to view details
                    </div>
                    <div v-else class="mod-detail-panel">
                        <h3 class="mod-detail-name">
                            {{ previewedMod.name }}
                            <span class="mod-detail-cost">{{ money(previewedMod.cost_multiplier * drone.cost) }}</span>
                        </h3>
                        <div class="mod-detail-meta">
                            <div class="meta-item">
                                <span class="meta-label">Type</span>
                                <span class="meta-value">{{ previewedMod.type }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Cost</span>
                                <span class="meta-value">{{ Math.round(previewedMod.cost_multiplier * 100) }}% base</span>
                            </div>
                            <template v-if="previewedMod.type === 'mod'">
                                <div class="meta-item">
                                    <span class="meta-label">Fix</span>
                                    <span class="meta-value">{{ previewedMod.fix }}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Drive</span>
                                    <span class="meta-value">{{ previewedMod.drive }}</span>
                                </div>
                            </template>
                        </div>
                        <p class="mod-detail-effect">{{ previewedMod.effect_text }}</p>
                        <button
                            v-if="canAddItem(previewedMod)"
                            class="add-to-drone-btn"
                            @click="select(previewedMod)"
                        >
                            Add to Drone
                        </button>
                        <div v-else class="already-equipped-msg">Already equipped</div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.drone-card {
    background: var(--cwn-bg-soft);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    width: 380px;
    min-width: 320px;
    font-size: 0.85em;
}

.drone-heading {
    background: var(--cwn-bg-mute);
    color: var(--cwn-cyan);
    border-left: 3px solid var(--cwn-cyan);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 4px 4px 0 0;
}

.drone-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.drone-title h3 {
    display: inline;
    font-size: 1em;
    font-weight: bold;
}

.drone-cost {
    color: var(--cwn-text-muted);
    font-size: 0.9em;
}

.remove-btn {
    color: var(--cwn-text-muted);
    font-size: 1.2em;
    line-height: 1;
    padding: 2px 4px;
    opacity: 0.35;
    transition: opacity 0.2s, color 0.2s;
}

.drone-heading:hover .remove-btn {
    opacity: 0.7;
}

.remove-btn:hover {
    opacity: 1 !important;
    color: var(--cwn-magenta);
}

/* Stat row */
.drone-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    padding: 8px 12px;
    border-bottom: 1px solid var(--cwn-border);
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2px 8px;
    min-width: 44px;
}

.stat-label {
    color: var(--cwn-text-muted);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.stat-value {
    color: var(--cwn-text-bright);
    font-size: 0.95em;
}

.stat-mod {
    color: var(--cwn-cyan-dim);
    margin-left: 2px;
}

.stat.error .stat-value {
    color: var(--cwn-magenta);
}

/* Mods section */
.drone-mods {
    padding: 6px 4px 8px;
}

.mod-block {
    margin-bottom: 2px;
}

/* Heading action buttons */
.heading-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.heading-action-btn {
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--cwn-cyan-dim);
    padding: 2px 6px;
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: 2px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.heading-action-btn:not(.disabled):hover {
    background: rgba(0, 240, 255, 0.1);
    color: var(--cwn-cyan);
    border-color: var(--cwn-cyan-dim);
}

.heading-action-btn.disabled {
    color: var(--cwn-text-muted);
    opacity: 0.3;
    cursor: default;
    border-color: transparent;
}

div.p-dialog label {
    display: block;
}

/* ===== Dialog overrides ===== */
:deep(.p-dialog) {
    background: var(--cwn-bg);
    border: 1px solid var(--cwn-border);
}

:deep(.p-dialog-header) {
    background: var(--cwn-bg-mute);
    color: var(--cwn-cyan);
    border-bottom: 1px solid var(--cwn-border);
    padding: 10px 16px;
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

:deep(.p-dialog-content) {
    background: var(--cwn-bg);
    padding: 0;
}

/* ===== Dialog toolbar ===== */
.dialog-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--cwn-border);
    background: var(--cwn-bg-soft);
}

.search-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.search-clear {
    position: absolute;
    right: 8px;
    color: var(--cwn-text-muted);
    font-size: 1.1em;
    line-height: 1;
    padding: 2px 4px;
    transition: color 0.2s;
}

.search-clear:hover {
    color: var(--cwn-text-bright);
}

.search-wrapper :deep(.p-inputtext) {
    background: var(--cwn-bg-deep);
    border: 1px solid var(--cwn-border);
    color: var(--cwn-text-bright);
    padding: 6px 28px 6px 12px;
    font-size: 0.85em;
    border-radius: 2px;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 260px;
}

.search-wrapper :deep(.p-inputtext:focus) {
    border-color: var(--cwn-cyan-dim);
    box-shadow: var(--cwn-glow-cyan);
    outline: none;
}

.search-wrapper :deep(.p-inputtext::placeholder) {
    color: var(--cwn-text-muted);
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.slot-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7em;
}

.slot-pill .slot-label {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 1px;
}

.slot-pill .slot-value {
    color: var(--cwn-text-muted);
}

.slot-pill.over-limit .slot-value {
    color: var(--cwn-magenta);
}

.done-btn {
    border: 1px solid var(--cwn-cyan-dim);
    color: var(--cwn-cyan);
    background: transparent;
    padding: 4px 16px;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s;
}

.done-btn:hover {
    background: rgba(0, 240, 255, 0.15);
    border-color: var(--cwn-cyan);
    box-shadow: var(--cwn-glow-cyan);
}

/* ===== Two-column dialog body ===== */
.dialog-body {
    display: flex;
    min-height: 300px;
    max-height: 65vh;
}

.mod-list-col {
    flex: 1;
    overflow-y: auto;
    border-right: 1px solid var(--cwn-border);
}

.mod-detail-col {
    width: 320px;
    min-width: 280px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

/* ===== Section headers ===== */
.section-header {
    padding: 8px 12px;
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--cwn-text-muted);
    border-bottom: 2px solid var(--cwn-border-hover);
    background: var(--cwn-bg-soft);
    position: sticky;
    top: 0;
    z-index: 1;
}

/* ===== Capacity warning ===== */
.capacity-warning {
    padding: 4px 12px;
    font-size: 0.75em;
    color: var(--cwn-magenta);
    background: rgba(255, 0, 170, 0.08);
    border-bottom: 1px solid var(--cwn-magenta-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* ===== Row add button ===== */
.row-add-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--cwn-cyan-dim);
    border-radius: 50%;
    background: transparent;
    color: var(--cwn-cyan);
    font-size: 0.9em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.2s;
    line-height: 1;
}

.row-add-btn:hover {
    background: rgba(0, 240, 255, 0.15);
    border-color: var(--cwn-cyan);
    box-shadow: var(--cwn-glow-cyan);
}

/* ===== No results ===== */
.no-results {
    padding: 24px;
    text-align: center;
    color: var(--cwn-text-muted);
    font-size: 0.85em;
}

/* ===== Detail panel ===== */
.detail-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--cwn-text-muted);
    font-size: 0.85em;
}

.mod-detail-panel {
    background: var(--cwn-bg-mute);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.mod-detail-name {
    color: var(--cwn-cyan);
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--cwn-border);
}

.mod-detail-cost {
    color: var(--cwn-text-muted);
    font-size: 0.85em;
    font-weight: normal;
    margin-left: 8px;
}

.mod-detail-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-bottom: 12px;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.meta-label {
    color: var(--cwn-text-muted);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.meta-value {
    color: var(--cwn-text-bright);
    font-size: 0.9em;
}

.mod-detail-effect {
    color: var(--cwn-text);
    font-size: 0.85em;
    line-height: 1.5;
    margin-bottom: 16px;
    flex: 1;
}

.add-to-drone-btn {
    width: 100%;
    padding: 8px;
    margin-top: auto;
    border: 1px solid var(--cwn-cyan);
    border-radius: 2px;
    background: transparent;
    color: var(--cwn-cyan);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
}

.add-to-drone-btn:hover {
    background: rgba(0, 240, 255, 0.15);
    box-shadow: var(--cwn-glow-cyan);
}

.already-equipped-msg {
    text-align: center;
    color: var(--cwn-text-muted);
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px;
    margin-top: auto;
    border: 1px solid var(--cwn-border);
    border-radius: 2px;
}
</style>
