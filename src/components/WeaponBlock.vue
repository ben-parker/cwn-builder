<script setup>
import { computed } from 'vue'
import Badge from 'primevue/badge'

defineEmits(['removeWeapon'])

const props = defineProps({
    index: { type: Number, default: null },
    weapon: { type: Object, required: true },
    drone: { type: Object, required: true },
    removable: { type: [Boolean, String], default: false },
    compact: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
    equipped: { type: Boolean, default: false },
    searchText: { type: String, default: '' }
})

const money = (cost) => cost < 0 ? "-$" + Math.abs(cost).toLocaleString("en-US") : "$" + cost.toLocaleString("en-US")

// Split text into segments: [{ text, match }]
const highlightSegments = (text, query) => {
    if (!query || query.length < 2) return [{ text, match: false }]
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return [{ text, match: false }]
    return [
        { text: text.slice(0, idx), match: false },
        { text: text.slice(idx, idx + query.length), match: true },
        { text: text.slice(idx + query.length), match: false }
    ].filter(s => s.text.length > 0)
}

const nameSegments = computed(() => highlightSegments(props.weapon.name, props.searchText))

const descriptionSnippet = computed(() => {
    if (!props.searchText || props.searchText.length < 2 || !props.compact) return null
    if (props.weapon.name.toLowerCase().includes(props.searchText.toLowerCase())) return null
    const text = props.weapon.effect_text
    const q = props.searchText.toLowerCase()
    const idx = text.toLowerCase().indexOf(q)
    if (idx === -1) return null
    const padBefore = 20
    const padAfter = 40
    const start = Math.max(0, idx - padBefore)
    const end = Math.min(text.length, idx + q.length + padAfter)
    let snippet = text.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    return highlightSegments(snippet, props.searchText)
})
</script>

<template>
    <!-- Compact mode: single-line row for dialog list -->
    <div v-if="compact"
        class="weapon-compact"
        :class="{
            'weapon-selected': selected,
            'weapon-equipped': equipped
        }"
    >
        <div class="compact-info">
            <div class="compact-left">
                <span class="compact-name"><template v-for="(seg, i) in nameSegments" :key="i"><strong v-if="seg.match" class="highlight">{{ seg.text }}</strong><template v-else>{{ seg.text }}</template></template></span>
                <span class="compact-stat">{{ weapon.damage }}</span>
                <span class="compact-stat">{{ weapon.range }}</span>
                <span class="compact-cost">{{ money(weapon.cost) }}</span>
                <Badge :value="weapon.category" :severity="weapon.category === 'pistol' ? 'info' : weapon.category === 'rifle' ? 'warn' : 'danger'" />
            </div>
            <div v-if="descriptionSnippet" class="compact-snippet">
                <template v-for="(seg, i) in descriptionSnippet" :key="i"><strong v-if="seg.match" class="highlight">{{ seg.text }}</strong><template v-else>{{ seg.text }}</template></template>
            </div>
        </div>
        <div class="compact-right">
            <span v-if="equipped" class="equipped-indicator">&#10003;</span>
            <slot name="add-button" v-else />
        </div>
    </div>

    <!-- Full mode: display for drone cards -->
    <div v-else class="weapon-full">
        <div class="weapon-heading">
            <div class="weapon-title-row">
                <h4>{{ weapon.name }}</h4>
                <span class="weapon-type-tag">{{ weapon.category }}</span>
                <span class="weapon-cost">{{ money(weapon.cost) }}</span>
            </div>
            <a v-if="removable" class="weapon-remove clickable" @click="$emit('removeWeapon', { index: index })" title="Remove">&times;</a>
        </div>
        <div class="weapon-stats-row">
            <span class="weapon-stat"><span class="weapon-stat-label">Dmg</span> {{ weapon.damage }}</span>
            <span class="weapon-stat"><span class="weapon-stat-label">Rng</span> {{ weapon.range }}</span>
            <span v-if="weapon.magazine" class="weapon-stat"><span class="weapon-stat-label">Mag</span> {{ weapon.magazine }}</span>
            <span v-for="trait in weapon.traits" :key="trait" class="weapon-trait">{{ trait }}</span>
        </div>
    </div>
</template>

<style scoped>
/* Full mode styles */
.weapon-full {
    padding: 6px 10px;
    border-radius: 3px;
    border-left: 2px solid var(--cwn-yellow);
}

.weapon-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.weapon-title-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
}

.weapon-title-row h4 {
    display: inline;
    font-size: 0.9em;
    font-weight: bold;
    color: var(--cwn-text-bright);
}

.weapon-type-tag {
    font-size: 0.55em;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 1.4;
    flex-shrink: 0;
    color: var(--cwn-yellow);
    border: 1px solid rgba(240, 224, 0, 0.3);
}

.weapon-cost {
    font-size: 0.75em;
    color: var(--cwn-text-muted);
    flex-shrink: 0;
}

.weapon-remove {
    color: var(--cwn-text-muted);
    font-size: 1.1em;
    line-height: 1;
    padding: 2px 4px;
    opacity: 0.4;
    transition: opacity 0.2s, color 0.2s;
}

.weapon-full:hover .weapon-remove {
    opacity: 0.7;
}

.weapon-remove:hover {
    opacity: 1 !important;
    color: var(--cwn-magenta);
}

.weapon-stats-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 3px;
    flex-wrap: wrap;
}

.weapon-stat {
    font-size: 0.75em;
    color: var(--cwn-text-muted);
}

.weapon-stat-label {
    color: var(--cwn-text-muted);
    opacity: 0.7;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 0.5px;
    margin-right: 2px;
}

.weapon-trait {
    font-size: 0.65em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 1px 4px;
    border-radius: 2px;
    color: var(--cwn-yellow);
    border: 1px solid rgba(240, 224, 0, 0.2);
    background: rgba(240, 224, 0, 0.06);
}

/* Compact mode styles */
.weapon-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid var(--cwn-border);
    border-left: 2px solid var(--cwn-yellow);
    transition: background 0.15s;
    cursor: pointer;
}

.weapon-compact:not(.weapon-equipped):hover {
    background: var(--cwn-bg-soft);
}

.weapon-compact.weapon-selected {
    background: var(--cwn-bg-mute);
    border-left: 2px solid var(--cwn-yellow);
}

.weapon-compact.weapon-equipped {
    opacity: 0.45;
    cursor: default;
}

.compact-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.compact-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.compact-name {
    color: var(--cwn-text-bright);
    font-size: 0.9em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.compact-stat {
    color: var(--cwn-text-muted);
    font-size: 0.75em;
    white-space: nowrap;
}

.compact-cost {
    color: var(--cwn-text-muted);
    font-size: 0.8em;
    white-space: nowrap;
}

.compact-right {
    display: flex;
    align-items: center;
    margin-left: 8px;
    flex-shrink: 0;
}

.equipped-indicator {
    color: var(--cwn-text-muted);
    font-size: 0.85em;
}

.compact-snippet {
    font-size: 0.75em;
    color: var(--cwn-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.highlight {
    color: var(--cwn-cyan);
    font-weight: bold;
}

/* Flash animation applied by parent */
.weapon-compact.mod-just-added {
    animation: weapon-added-flash 0.6s ease-out;
}

@keyframes weapon-added-flash {
    0% { background: rgba(240, 224, 0, 0.3); }
    100% { background: transparent; }
}
</style>
