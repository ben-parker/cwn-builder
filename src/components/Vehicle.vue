<script setup>
import { ref, computed, onMounted } from 'vue'
import ModBlock from '@/components/ModBlock.vue'
import WeaponBlock from '@/components/WeaponBlock.vue'
import ItemPickerDialog from '@/components/ItemPickerDialog.vue'
import { useVehicleStore } from '@/stores/vehicles'
import { useWeaponStore } from '@/stores/weapons'
import { addModEffect, removeModEffect } from '@/services/vehicle_fitting_effects'

const store = useVehicleStore()
const weaponStore = useWeaponStore()
const props = defineProps(['index', 'vehicle', 'initialMods', 'initialWeapons'])
const emit = defineEmits(['updated'])

const searchText = ref('')
const visible = ref(false)
const mods = ref([])
const previewedMod = ref(null)
const addedThisSession = ref([])

const SIZE_ORDER = { S: 0, M: 1, L: 2 }

// Stackable limits: Infinity = unlimited stacking, object = per-size max
const STACKABLE_LIMITS = {
    'Cargo Space': Infinity,
    'Armor Plating': { S: 1, M: 2, L: 3 },
    'Extra Passengers': Infinity,
    "Smuggler's Hold": Infinity,
    'Drone Hub': { S: 1, M: 1, L: 2 },
}

const isStackable = (name) => name in STACKABLE_LIMITS

const maxStackCount = (name) => {
    const limit = STACKABLE_LIMITS[name]
    if (limit === undefined) return 1
    if (typeof limit === 'number') return limit
    return limit[props.vehicle.size] ?? 1
}

const canFitSize = (fitting) => {
    if (fitting.min_size && SIZE_ORDER[props.vehicle.size] < SIZE_ORDER[fitting.min_size])
        return false
    if (fitting.max_size && SIZE_ORDER[props.vehicle.size] > SIZE_ORDER[fitting.max_size])
        return false
    return true
}

const sizeDisabledLabel = (fitting) => {
    if (canFitSize(fitting)) return ''
    if (fitting.min_size && SIZE_ORDER[props.vehicle.size] < SIZE_ORDER[fitting.min_size])
        return fitting.min_size === 'M' ? 'Req. M+' : fitting.min_size === 'L' ? 'Req. L' : `Req. ${fitting.min_size}`
    if (fitting.max_size && SIZE_ORDER[props.vehicle.size] > SIZE_ORDER[fitting.max_size])
        return `Max ${fitting.max_size}`
    return ''
}

// Equipped tracking
const equippedNames = computed(() => new Set(mods.value.map(m => m.name)))
const equipCounts = computed(() => {
    const counts = {}
    mods.value.forEach(m => { counts[m.name] = (counts[m.name] || 0) + 1 })
    return counts
})

const removeMod = function(data) {
    removeModEffect(mods.value[data.index], props.vehicle);
    mods.value.splice(data.index, 1);
    emit('updated', { index: props.index, cost: totalCost.value });
};

const select = function(fitting) {
    if (!canAddItem(fitting)) return
    addModEffect(fitting, props.vehicle);
    mods.value.push(fitting);
    emit('updated', { index: props.index, cost: totalCost.value });
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

// Computed
const addedMods = computed(() => mods.value.filter(m => m.type === 'mod'));
const addedFittings = computed(() => mods.value.filter(m => m.type === 'fitting'));

// Power & Mass tracking
const usedPower = computed(() =>
    addedFittings.value.reduce((sum, f) => sum + (f.power || 0), 0))
const totalPower = computed(() =>
    props.vehicle.power + (props.vehicle.extraMaxPower ?? 0))
const overPower = computed(() => usedPower.value > totalPower.value)
const powerDisplay = computed(() => `${usedPower.value}/${totalPower.value}`)

const usedMass = computed(() =>
    addedFittings.value.reduce((sum, f) => sum + (f.mass || 0), 0))
const totalMass = computed(() =>
    props.vehicle.mass + (props.vehicle.extraMaxMass ?? 0))
const overMass = computed(() => usedMass.value > totalMass.value)
const massDisplay = computed(() => `${usedMass.value}/${totalMass.value}`)

const totalHardpoints = computed(() => props.vehicle.hardpoints + (props.vehicle.extraHardpoints ?? 0))
const hasHardpoints = computed(() => totalHardpoints.value > 0)

const filteredFittings = computed(() => {
    const items = store.vehicleMods.filter(m => m.type === 'fitting')
    if (searchText.value.length < 2) return items
    const q = searchText.value.toLowerCase()
    return items.filter(m =>
        m.name.toLowerCase().includes(q) || m.effect_text.toLowerCase().includes(q))
})

const filteredMods = computed(() => {
    const items = store.vehicleMods.filter(m => m.type === 'mod')
    if (searchText.value.length < 2) return items
    const q = searchText.value.toLowerCase()
    return items.filter(m =>
        m.name.toLowerCase().includes(q) || m.effect_text.toLowerCase().includes(q))
})

const totalCost = computed(() => {
    let cost = props.vehicle.cost;

    if (mods.value.length > 0) {
        cost += mods.value.reduce((prev, cur) => {
            if (cur.cost_multiplier !== undefined)
                return prev + (props.vehicle.cost * cur.cost_multiplier);
            return prev + (cur.cost || 0);
        }, 0);
    }

    if (weapons.value.length > 0) {
        cost += weapons.value.reduce((prev, cur) => prev + cur.cost, 0);
    }

    return cost;
})

const canAddItem = (fitting) => {
    if (!canFitSize(fitting)) return false
    const count = equipCounts.value[fitting.name] || 0
    if (count === 0) return true
    if (!isStackable(fitting.name)) return false
    return count < maxStackCount(fitting.name)
}

// Armor display helper
const armorDisplay = computed(() => {
    const base = props.vehicle.armor
    const extra = props.vehicle.extraArmor ?? 0
    if (typeof base === 'string') return base // *, ** special values
    const total = Math.max(0, base + extra)
    return extra !== 0 ? `${base} (${total})` : `${base}`
})

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

// Vehicle weapons: filter by platform
const availableWeapons = computed(() =>
    weaponStore.weapons.filter(w => w.platform?.includes('vehicle'))
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
            const mod = store.vehicleMods.find(m => m.name === name)
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

// Detail panel cost display for previewed mod
const previewCostDisplay = computed(() => {
    if (!previewedMod.value) return ''
    if (previewedMod.value.cost_multiplier !== undefined)
        return money(previewedMod.value.cost_multiplier * props.vehicle.cost)
    return money(previewedMod.value.cost || 0)
})

const previewCostLabel = computed(() => {
    if (!previewedMod.value) return ''
    if (previewedMod.value.cost_multiplier !== undefined)
        return Math.round(previewedMod.value.cost_multiplier * 100) + '% base'
    return '$' + (previewedMod.value.cost || 0).toLocaleString('en-US')
})
</script>

<template>
    <div class="vehicle-card">
        <div class="vehicle-heading">
            <div class="vehicle-heading-rows">
                <div class="vehicle-title">
                    <h3>{{ vehicle.name }}</h3>
                    <span class="vehicle-cost">{{ money(totalCost) }}</span>
                </div>
                <div class="heading-actions">
                    <a class="heading-action-btn clickable" @click="openDialog" title="Add Mod/Fitting">+ Mod/Fitting</a>
                    <a class="heading-action-btn" :class="{ clickable: hasHardpoints, disabled: !hasHardpoints }" @click="hasHardpoints && openWeaponDialog()" title="Add Weapon">+ Weapon</a>
                </div>
            </div>
            <a class="remove-btn clickable" @click="$emit('removeVehicle', index)" title="Remove">&times;</a>
        </div>
        <div class="vehicle-stats">
            <div class="stat">
                <span class="stat-label">AC</span>
                <span class="stat-value">{{ vehicle.ac }}<span v-if="(vehicle.extraAc ?? 0) !== 0" class="stat-mod">({{ vehicle.ac + vehicle.extraAc }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">TT</span>
                <span class="stat-value">{{ vehicle.tt }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">HP</span>
                <span class="stat-value">{{ vehicle.hp }}<span v-if="(vehicle.extraHp ?? 0) !== 0" class="stat-mod">({{ vehicle.hp + vehicle.extraHp }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">Armor</span>
                <span class="stat-value" :title="vehicle.armor_note || ''">{{ armorDisplay }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Spd</span>
                <span class="stat-value">{{ vehicle.speed }}<span v-if="(vehicle.extraSpeed ?? 0) !== 0" class="stat-mod">({{ vehicle.speed + vehicle.extraSpeed }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">Crew</span>
                <span class="stat-value">{{ vehicle.crew }}<span v-if="(vehicle.extraCrew ?? 0) !== 0" class="stat-mod">({{ vehicle.crew + vehicle.extraCrew }})</span></span>
            </div>
            <div class="stat" :class="{error: overPower}">
                <span class="stat-label">Pow.</span>
                <span class="stat-value">{{ powerDisplay }}</span>
            </div>
            <div class="stat" :class="{error: overMass}">
                <span class="stat-label">Mass</span>
                <span class="stat-value">{{ massDisplay }}</span>
            </div>
            <div class="stat" :class="{error: tooManyHardpoints}">
                <span class="stat-label">Hrd.</span>
                <span class="stat-value">{{ usedHardpoints }}/{{ totalHardpoints }}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Size</span>
                <span class="stat-value">{{ vehicle.size }}</span>
            </div>
        </div>
        <div v-if="mods.length" class="vehicle-mods">
            <ModBlock class="mod-block" v-for="(mod, index) in mods" @remove-mod="removeMod" :fitting="mod" :drone="vehicle" removable="true" :index="index" accent="yellow" />
        </div>
        <div v-if="weapons.length" class="vehicle-weapons">
            <WeaponBlock class="weapon-block" v-for="(weapon, index) in weapons" @remove-weapon="removeWeapon" :weapon="weapon" :drone="vehicle" removable :index="index" />
        </div>

        <!-- Mod/Fitting Dialog -->
        <ItemPickerDialog v-model:visible="visible" v-model:searchText="searchText" title="Modify Vehicle">
            <template #toolbar-pills>
                <span class="slot-pill" :class="{ 'over-limit': overPower }">
                    <span class="slot-label">Pow</span>
                    <span class="slot-value">{{ powerDisplay }}</span>
                </span>
                <span class="slot-pill" :class="{ 'over-limit': overMass }">
                    <span class="slot-label">Mass</span>
                    <span class="slot-value">{{ massDisplay }}</span>
                </span>
                <span class="slot-pill">
                    <span class="slot-label">Mods</span>
                    <span class="slot-value">{{ addedMods.length }}</span>
                </span>
            </template>

            <template #item-list>
                <div class="section-header">Fittings</div>
                <ModBlock
                    v-for="fitting in filteredFittings"
                    :key="'f-' + fitting.name"
                    compact
                    accent="yellow"
                    :fitting="fitting"
                    :drone="vehicle"
                    :searchText="searchText"
                    :selected="previewedMod?.name === fitting.name"
                    :equipped="equippedNames.has(fitting.name)"
                    :equipCount="equipCounts[fitting.name] || 0"
                    :stackable="isStackable(fitting.name)"
                    :disabled="!canFitSize(fitting)"
                    :disabledLabel="sizeDisabledLabel(fitting)"
                    :class="{ 'mod-just-added': addedThisSession.includes(fitting.name) }"
                    @click="preview(fitting)"
                >
                    <template #add-button>
                        <button v-if="canFitSize(fitting)" class="circle-add-btn cab-yellow" @click.stop="select(fitting)" title="Add">+</button>
                    </template>
                </ModBlock>

                <div class="section-header">Mods</div>
                <ModBlock
                    v-for="fitting in filteredMods"
                    :key="'m-' + fitting.name"
                    compact
                    accent="yellow"
                    :fitting="fitting"
                    :drone="vehicle"
                    :searchText="searchText"
                    :selected="previewedMod?.name === fitting.name"
                    :equipped="equippedNames.has(fitting.name)"
                    :equipCount="equipCounts[fitting.name] || 0"
                    :stackable="isStackable(fitting.name)"
                    :class="{ 'mod-just-added': addedThisSession.includes(fitting.name) }"
                    @click="preview(fitting)"
                >
                    <template #add-button>
                        <button class="circle-add-btn cab-yellow" @click.stop="select(fitting)" title="Add">+</button>
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
                        <span class="detail-panel-cost">{{ previewCostDisplay }}</span>
                    </h3>
                    <div class="detail-meta">
                        <div class="meta-item">
                            <span class="meta-label">Type</span>
                            <span class="meta-value">{{ previewedMod.type }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Cost</span>
                            <span class="meta-value">{{ previewCostLabel }}</span>
                        </div>
                        <template v-if="previewedMod.power !== undefined">
                            <div class="meta-item">
                                <span class="meta-label">Power</span>
                                <span class="meta-value">{{ previewedMod.power }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Mass</span>
                                <span class="meta-value">{{ previewedMod.mass }}</span>
                            </div>
                        </template>
                        <template v-if="previewedMod.min_size">
                            <div class="meta-item">
                                <span class="meta-label">Min. Size</span>
                                <span class="meta-value">{{ previewedMod.min_size }}</span>
                            </div>
                        </template>
                        <template v-if="previewedMod.type === 'mod'">
                            <div class="meta-item">
                                <span class="meta-label">Fix</span>
                                <span class="meta-value">{{ previewedMod.fix }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Drive</span>
                                <span class="meta-value">{{ previewedMod.drive }}</span>
                            </div>
                            <div v-if="previewedMod.special_components > 0" class="meta-item">
                                <span class="meta-label">Components</span>
                                <span class="meta-value">{{ previewedMod.special_components }}</span>
                            </div>
                        </template>
                    </div>
                    <p class="detail-effect">{{ previewedMod.effect_text }}</p>
                    <div v-if="!canFitSize(previewedMod)" class="detail-unavailable-msg">Vehicle too small</div>
                    <button
                        v-else-if="canAddItem(previewedMod)"
                        class="detail-action-btn"
                        @click="select(previewedMod)"
                    >
                        Add to Vehicle
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
                            :drone="vehicle"
                            :searchText="weaponSearchText"
                            :selected="previewedWeapon?.name === weapon.name"
                            :equipped="equippedWeaponNames.has(weapon.name)"
                            :class="{ 'mod-just-added': weaponAddedThisSession.includes(weapon.name) }"
                            @click="previewWeapon(weapon)"
                        >
                            <template #add-button>
                                <button class="circle-add-btn cab-yellow" @click.stop="selectWeapon(weapon)" title="Mount">+</button>
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
.vehicle-card {
    background: var(--cwn-bg-soft);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    width: 420px;
    min-width: 340px;
    font-size: 0.85em;
}

.vehicle-heading {
    background: var(--cwn-bg-mute);
    color: var(--cwn-yellow);
    border-left: 3px solid var(--cwn-yellow);
    display: flex;
    align-items: center;
    padding: 2px 12px;
    border-radius: 4px 4px 0 0;
}

.vehicle-heading-rows {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 4px;
}

.vehicle-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.vehicle-title h3 {
    display: inline;
    font-size: 1em;
    font-weight: bold;
}

.vehicle-cost {
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

.vehicle-heading:hover .remove-btn {
    opacity: 0.7;
}

.remove-btn:hover {
    opacity: 1 !important;
    color: var(--cwn-magenta);
}

/* Stat row */
.vehicle-stats {
    display: flex;
    gap: 0;
    padding: 8px 12px;
    border-bottom: 1px solid var(--cwn-border);
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2px 6px;
    min-width: 40px;
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
    color: var(--cwn-yellow-dim);
    margin-left: 2px;
}

.stat.error .stat-value {
    color: var(--cwn-magenta);
}

/* Mods section */
.vehicle-mods {
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
    color: var(--cwn-yellow-dim);
    padding: 2px 6px;
    border: 1px solid rgba(240, 224, 0, 0.15);
    border-radius: 2px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.heading-action-btn:not(.disabled):hover {
    background: rgba(240, 224, 0, 0.1);
    color: var(--cwn-yellow);
    border-color: var(--cwn-yellow-dim);
}

.heading-action-btn.disabled {
    color: var(--cwn-text-muted);
    opacity: 0.3;
    cursor: default;
    border-color: transparent;
}

/* Weapons section */
.vehicle-weapons {
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
