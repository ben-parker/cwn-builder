<script setup>
import { ref, computed, onMounted } from 'vue'
import ModBlock from '@/components/ModBlock.vue'
import ItemPickerDialog from '@/components/ItemPickerDialog.vue'
import { useCyberdeckStore } from '@/stores/cyberdecks'
import { addModEffect, removeModEffect } from '@/services/cyberdeck_fitting_effects'

const store = useCyberdeckStore()
const props = defineProps(['index', 'deck', 'initialMods'])
const emit = defineEmits(['updated', 'removeDeck'])

const searchText = ref('')
const visible = ref(false)
const mods = ref([])
const previewedMod = ref(null)
const addedThisSession = ref([])

const equippedNames = computed(() => new Set(mods.value.map(m => m.name)))

const removeMod = function(data) {
    removeModEffect(mods.value[data.index], props.deck)
    mods.value.splice(data.index, 1)
    emit('updated', { index: props.index, cost: totalCost.value })
}

const select = function(mod) {
    if (equippedNames.value.has(mod.name)) return
    addModEffect(mod, props.deck)
    mods.value.push(mod)
    emit('updated', { index: props.index, cost: totalCost.value })
    addedThisSession.value.push(mod.name)
    setTimeout(() => {
        const idx = addedThisSession.value.indexOf(mod.name)
        if (idx !== -1) addedThisSession.value.splice(idx, 1)
    }, 600)
}

const preview = function(mod) {
    previewedMod.value = previewedMod.value?.name === mod.name ? null : mod
}

const openDialog = function() {
    searchText.value = ''
    previewedMod.value = null
    addedThisSession.value = []
    visible.value = true
}

const money = (cost) => cost < 0 ? "-$" + Math.abs(cost).toLocaleString("en-US") : "$" + cost.toLocaleString("en-US")

const filteredMods = computed(() => {
    const items = store.mods
    if (searchText.value.length < 2) return items
    const q = searchText.value.toLowerCase()
    return items.filter(m =>
        m.name.toLowerCase().includes(q) || m.effect_text.toLowerCase().includes(q))
})

const totalCost = computed(() => {
    let cost = props.deck.cost
    if (mods.value.length > 0) {
        cost += mods.value.reduce((prev, cur) =>
            prev + (props.deck.cost * cur.cost_multiplier), 0)
    }
    return cost
})

defineExpose({ mods })

onMounted(() => {
    if (props.initialMods?.length) {
        for (const name of props.initialMods) {
            const mod = store.mods.find(m => m.name === name)
            if (mod) select(mod)
        }
    }
})
</script>

<template>
    <div class="deck-card">
        <div class="deck-heading">
            <div class="deck-heading-rows">
                <div class="deck-title">
                    <h3>{{ deck.name }}</h3>
                    <span class="deck-cost">{{ money(totalCost) }}</span>
                </div>
                <div class="heading-actions">
                    <a class="heading-action-btn clickable" @click="openDialog" title="Add Mod">+ Mod</a>
                </div>
            </div>
            <a class="remove-btn clickable" @click="$emit('removeDeck', index)" title="Remove">&times;</a>
        </div>
        <div class="deck-stats">
            <div class="stat">
                <span class="stat-label">Access</span>
                <span class="stat-value">+{{ deck.bonus_access }}<span v-if="(deck.extraBonusAccess ?? 0) !== 0" class="stat-mod">(+{{ deck.bonus_access + deck.extraBonusAccess }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">Memory</span>
                <span class="stat-value">{{ deck.memory }}<span v-if="(deck.extraMemory ?? 0) !== 0" class="stat-mod">({{ deck.memory + deck.extraMemory }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">Shield</span>
                <span class="stat-value">{{ deck.shielding }}<span v-if="(deck.extraShielding ?? 0) !== 0" class="stat-mod">({{ deck.shielding + deck.extraShielding }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">CPU</span>
                <span class="stat-value">{{ deck.cpu }}<span v-if="(deck.extraCpu ?? 0) !== 0" class="stat-mod">({{ deck.cpu + deck.extraCpu }})</span></span>
            </div>
            <div class="stat">
                <span class="stat-label">Enc.</span>
                <span class="stat-value">{{ deck.enc }}<span v-if="(deck.extraEnc ?? 0) !== 0" class="stat-mod">({{ Math.max(0, deck.enc + deck.extraEnc) }})</span></span>
            </div>
        </div>
        <div v-if="mods.length" class="deck-mods">
            <ModBlock class="mod-block" v-for="(mod, index) in mods" @remove-mod="removeMod" :fitting="mod" :unit="deck" removable="true" :index="index" accent="magenta" />
        </div>

        <ItemPickerDialog v-model:visible="visible" v-model:searchText="searchText" title="Modify Cyberdeck">
            <template #toolbar-pills>
                <span class="slot-pill">
                    <span class="slot-label">Mods</span>
                    <span class="slot-value">{{ mods.length }}</span>
                </span>
            </template>

            <template #item-list>
                <div class="section-header">Mods</div>
                <ModBlock
                    v-for="mod in filteredMods"
                    :key="'m-' + mod.name"
                    compact
                    :fitting="mod"
                    :unit="deck"
                    :searchText="searchText"
                    :selected="previewedMod?.name === mod.name"
                    :equipped="equippedNames.has(mod.name)"
                    :equipCount="0"
                    :stackable="false"
                    accent="magenta"
                    :class="{ 'mod-just-added': addedThisSession.includes(mod.name) }"
                    @click="preview(mod)"
                >
                    <template #add-button>
                        <button class="circle-add-btn cab-magenta" @click.stop="select(mod)" title="Add">+</button>
                    </template>
                </ModBlock>

                <div v-if="filteredMods.length === 0" class="no-results">
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
                        <span class="detail-panel-cost">{{ money(previewedMod.cost_multiplier * deck.cost) }}</span>
                    </h3>
                    <div class="detail-meta">
                        <div class="meta-item">
                            <span class="meta-label">Cost</span>
                            <span class="meta-value">{{ Math.round(previewedMod.cost_multiplier * 100) }}% base</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Fix</span>
                            <span class="meta-value">{{ previewedMod.fix }}</span>
                        </div>
                    </div>
                    <p class="detail-effect">{{ previewedMod.effect_text }}</p>
                    <button
                        v-if="!equippedNames.has(previewedMod.name)"
                        class="detail-action-btn"
                        @click="select(previewedMod)"
                    >
                        Add to Deck
                    </button>
                    <div v-else class="detail-unavailable-msg">Already equipped</div>
                </div>
            </template>
        </ItemPickerDialog>
    </div>
</template>

<style scoped>
.deck-card {
    background: var(--cwn-bg-soft);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    width: 380px;
    min-width: 320px;
    font-size: 0.85em;
}

.deck-heading {
    background: var(--cwn-bg-mute);
    color: var(--cwn-magenta);
    border-left: 3px solid var(--cwn-magenta);
    display: flex;
    align-items: center;
    padding: 2px 12px;
    border-radius: 4px 4px 0 0;
}

.deck-heading-rows {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 4px;
}

.deck-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.deck-title h3 {
    display: inline;
    font-size: 1em;
    font-weight: bold;
}

.deck-cost {
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

.deck-heading:hover .remove-btn {
    opacity: 0.7;
}

.remove-btn:hover {
    opacity: 1 !important;
    color: var(--cwn-magenta);
}

/* Stat row */
.deck-stats {
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
    color: var(--cwn-magenta-dim);
    margin-left: 2px;
}

/* Mods section */
.deck-mods {
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
    color: var(--cwn-magenta-dim);
    padding: 2px 6px;
    border: 1px solid rgba(255, 0, 170, 0.15);
    border-radius: 2px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.heading-action-btn:not(.disabled):hover {
    background: rgba(255, 0, 170, 0.1);
    color: var(--cwn-magenta);
    border-color: var(--cwn-magenta-dim);
}
</style>
