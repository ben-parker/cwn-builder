<script setup>
import { ref, computed, onMounted } from 'vue'
import ModBlock from '@/components/ModBlock.vue'
import WeaponBlock from '@/components/WeaponBlock.vue'
import ItemPickerDialog from '@/components/ItemPickerDialog.vue'
import { useDroneStore } from '@/stores/drones'
import { useWeaponStore } from '@/stores/weapons'
import { addModEffect, removeModEffect } from '@/services/fitting_effects'

const store = useDroneStore()
const weaponStore = useWeaponStore()
const props = defineProps(['index', 'drone', 'initialMods', 'initialWeapons'])
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
    let cost = props.drone.cost;

    if (mods.value.length > 0) {
        cost += mods.value.reduce((prev, cur) =>
            prev + (props.drone.cost * cur.cost_multiplier), 0);
    }

    if (weapons.value.length > 0) {
        cost += weapons.value.reduce((prev, cur) => prev + cur.cost, 0);
    }

    return cost;
})

const canAddItem = (fitting) => {
    const equipped = equippedNames.value.has(fitting.name)
    if (!equipped) return true
    return isStackable(fitting.name)
}

// ===== Weapon state =====
const weapons = ref([])
const weaponDialogVisible = ref(false)
const weaponSearchText = ref('')
const previewedWeapon = ref(null)
const weaponAddedThisSession = ref([])

// Weapon tracking
const equippedWeaponNames = computed(() => new Set(weapons.value.map(w => w.name)))
const usedHardpoints = computed(() => weapons.value.length)
const hardpointsAtCapacity = computed(() => usedHardpoints.value >= totalHardpoints.value)
const tooManyHardpoints = computed(() => usedHardpoints.value > totalHardpoints.value)
const hardpointSlotDisplay = computed(() => `${usedHardpoints.value}/${totalHardpoints.value}`)

// Weapon size filtering - uses BASE encumbrance, not modified
const allowedWeaponCategories = computed(() => {
    const enc = props.drone.encumbrance
    if (enc === '-') return new Set(['pistol', 'rifle', 'heavy'])
    const n = parseInt(enc)
    if (n > 3) return new Set(['pistol', 'rifle'])
    return new Set(['pistol'])
})

const availableWeapons = computed(() =>
    weaponStore.weapons.filter(w =>
        allowedWeaponCategories.value.has(w.category) &&
        (!w.platform || w.platform.includes('drone')))
)

const filteredWeaponsByCategory = computed(() => {
    let items = availableWeapons.value
    if (weaponSearchText.value.length >= 2) {
        const q = weaponSearchText.value.toLowerCase()
        items = items.filter(w =>
            w.name.toLowerCase().includes(q) ||
            w.effect_text.toLowerCase().includes(q) ||
            w.damage.toLowerCase().includes(q) ||
            w.traits.some(t => t.toLowerCase().includes(q)))
    }
    const grouped = {}
    for (const cat of ['pistol', 'rifle', 'heavy']) {
        const catItems = items.filter(w => w.category === cat)
        if (catItems.length > 0) grouped[cat] = catItems
    }
    return grouped
})

const noWeaponResults = computed(() => Object.keys(filteredWeaponsByCategory.value).length === 0)

// Weapon methods
const selectWeapon = function(weapon) {
    if (equippedWeaponNames.value.has(weapon.name)) return
    weapons.value.push(weapon)
    emit('updated', { index: props.index, cost: totalCost.value })
    weaponAddedThisSession.value.push(weapon.name)
    setTimeout(() => {
        const idx = weaponAddedThisSession.value.indexOf(weapon.name)
        if (idx !== -1) weaponAddedThisSession.value.splice(idx, 1)
    }, 600)
}

const removeWeapon = function(data) {
    weapons.value.splice(data.index, 1)
    emit('updated', { index: props.index, cost: totalCost.value })
}

const previewWeapon = function(weapon) {
    previewedWeapon.value = previewedWeapon.value?.name === weapon.name ? null : weapon
}

const openWeaponDialog = function() {
    weaponSearchText.value = ''
    previewedWeapon.value = null
    weaponAddedThisSession.value = []
    weaponDialogVisible.value = true
}

defineExpose({ mods, weapons })

onMounted(() => {
    if (props.initialMods?.length) {
        for (const name of props.initialMods) {
            const mod = store.droneMods.find(m => m.name === name)
            if (mod) select(mod)
        }
    }
    if (props.initialWeapons?.length) {
        for (const name of props.initialWeapons) {
            const weapon = weaponStore.weapons.find(w => w.name === name)
            if (weapon) selectWeapon(weapon)
        }
    }
})
</script>

<template>
    <div class="drone-card">
        <div class="drone-heading">
            <div class="drone-heading-rows">
                <div class="drone-title">
                    <h3>{{ drone.name }}</h3>
                    <span class="drone-cost">{{ money(totalCost) }}</span>
                </div>
                <div class="heading-actions">
                    <a class="heading-action-btn clickable" @click="openDialog" title="Add Mod/Fitting">+ Mod/Fitting</a>
                    <a class="heading-action-btn" :class="{ clickable: hasHardpoints, disabled: !hasHardpoints }" @click="hasHardpoints && openWeaponDialog()" title="Add Weapon">+ Weapon</a>
                </div>
            </div>
            <a class="remove-btn clickable" @click="$emit('removeDrone', index)" title="Remove">&times;</a>
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
            <div class="stat" :class="{error: tooManyHardpoints}">
                <span class="stat-label">Hrd.</span>
                <span class="stat-value">{{ usedHardpoints }}/{{ totalHardpoints }}</span>
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
        <div v-if="weapons.length" class="drone-weapons">
            <WeaponBlock class="weapon-block" v-for="(weapon, index) in weapons" @remove-weapon="removeWeapon" :weapon="weapon" :drone="drone" removable :index="index" />
        </div>

        <!-- Mod/Fitting Dialog -->
        <ItemPickerDialog v-model:visible="visible" v-model:searchText="searchText" title="Modify Drone">
            <template #toolbar-pills>
                <span class="slot-pill" :class="{ 'over-limit': tooManyFittings }">
                    <span class="slot-label">Fit</span>
                    <span class="slot-value">{{ addedFittings.length + (drone.extraFittings ?? 0) }}/{{ drone.fittings + (drone.extraMaxFittings ?? 0) }}</span>
                </span>
                <span class="slot-pill">
                    <span class="slot-label">Mods</span>
                    <span class="slot-value">{{ addedMods.length }}</span>
                </span>
            </template>

            <template #item-list>
                <div class="section-header">Fittings</div>
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
                        <button class="circle-add-btn" @click.stop="select(fitting)" title="Add">+</button>
                    </template>
                </ModBlock>

                <div class="section-header">Mods</div>
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
                        <button class="circle-add-btn" @click.stop="select(fitting)" title="Add">+</button>
                    </template>
                </ModBlock>

                <div v-if="filteredFittings.length === 0 && filteredMods.length === 0" class="no-results">
                    No results found
                </div>
            </template>

            <template #detail-panel>
                <div v-if="!previewedMod" class="detail-empty">
                    Click an item to view details
                </div>
                <div v-else class="detail-panel">
                    <h3 class="detail-panel-name">
                        {{ previewedMod.name }}
                        <span class="detail-panel-cost">{{ money(previewedMod.cost_multiplier * drone.cost) }}</span>
                    </h3>
                    <div class="detail-meta">
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
                    <p class="detail-effect">{{ previewedMod.effect_text }}</p>
                    <button
                        v-if="canAddItem(previewedMod)"
                        class="detail-action-btn"
                        @click="select(previewedMod)"
                    >
                        Add to Drone
                    </button>
                    <div v-else class="detail-unavailable-msg">Already equipped</div>
                </div>
            </template>
        </ItemPickerDialog>

        <!-- Weapon Dialog -->
        <ItemPickerDialog v-model:visible="weaponDialogVisible" v-model:searchText="weaponSearchText" title="Mount Weapon">
            <template #toolbar-pills>
                <span class="slot-pill" :class="{ 'over-limit': tooManyHardpoints }">
                    <span class="slot-label">Hardpoints</span>
                    <span class="slot-value">{{ hardpointSlotDisplay }}</span>
                </span>
            </template>

            <template #item-list>
                <div v-if="hardpointsAtCapacity" class="capacity-warning">
                    Hardpoints full &mdash; {{ hardpointSlotDisplay }}
                </div>
                <template v-for="cat in ['pistol', 'rifle', 'heavy']" :key="cat">
                    <template v-if="filteredWeaponsByCategory[cat]">
                        <div class="section-header">{{ cat }}</div>
                        <WeaponBlock
                            v-for="weapon in filteredWeaponsByCategory[cat]"
                            :key="weapon.name"
                            compact
                            :weapon="weapon"
                            :drone="drone"
                            :searchText="weaponSearchText"
                            :selected="previewedWeapon?.name === weapon.name"
                            :equipped="equippedWeaponNames.has(weapon.name)"
                            :class="{ 'mod-just-added': weaponAddedThisSession.includes(weapon.name) }"
                            @click="previewWeapon(weapon)"
                        >
                            <template #add-button>
                                <button class="circle-add-btn" @click.stop="selectWeapon(weapon)" title="Mount">+</button>
                            </template>
                        </WeaponBlock>
                    </template>
                </template>

                <div v-if="noWeaponResults" class="no-results">
                    No results found
                </div>
            </template>

            <template #detail-panel>
                <div v-if="!previewedWeapon" class="detail-empty">
                    Click a weapon to view details
                </div>
                <div v-else class="detail-panel">
                    <h3 class="detail-panel-name">
                        {{ previewedWeapon.name }}
                        <span class="detail-panel-cost">{{ money(previewedWeapon.cost) }}</span>
                    </h3>
                    <div class="detail-meta">
                        <div class="meta-item">
                            <span class="meta-label">Damage</span>
                            <span class="meta-value">{{ previewedWeapon.damage }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Range</span>
                            <span class="meta-value">{{ previewedWeapon.range }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Magazine</span>
                            <span class="meta-value">{{ previewedWeapon.magazine ?? 'N/A' }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Category</span>
                            <span class="meta-value">{{ previewedWeapon.category }}</span>
                        </div>
                        <div v-if="previewedWeapon.trauma_die" class="meta-item">
                            <span class="meta-label">Trauma Die</span>
                            <span class="meta-value">{{ previewedWeapon.trauma_die }}</span>
                        </div>
                        <div v-if="previewedWeapon.trauma_roll" class="meta-item">
                            <span class="meta-label">Trauma Roll</span>
                            <span class="meta-value">{{ previewedWeapon.trauma_roll }}</span>
                        </div>
                    </div>
                    <div v-if="previewedWeapon.traits.length" class="weapon-traits">
                        <span v-for="trait in previewedWeapon.traits" :key="trait" class="weapon-trait-tag">{{ trait }}</span>
                    </div>
                    <p class="detail-effect">{{ previewedWeapon.effect_text }}</p>
                    <button
                        v-if="!equippedWeaponNames.has(previewedWeapon.name) && !hardpointsAtCapacity"
                        class="detail-action-btn"
                        @click="selectWeapon(previewedWeapon)"
                    >
                        Mount Weapon
                    </button>
                    <div v-else-if="equippedWeaponNames.has(previewedWeapon.name)" class="detail-unavailable-msg">Already mounted</div>
                    <div v-else class="detail-unavailable-msg">No hardpoints available</div>
                </div>
            </template>
        </ItemPickerDialog>
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
    align-items: center;
    padding: 2px 12px;
    border-radius: 4px 4px 0 0;
}

.drone-heading-rows {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 4px;
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
    padding: 2px 0 0;
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

/* Weapons section */
.drone-weapons {
    padding: 6px 4px 8px;
}

.weapon-block {
    margin-bottom: 2px;
}

/* Weapon traits in detail panel */
.weapon-traits {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
}

.weapon-trait-tag {
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 2px;
    color: var(--cwn-yellow);
    border: 1px solid rgba(240, 224, 0, 0.3);
    background: rgba(240, 224, 0, 0.08);
}
</style>
