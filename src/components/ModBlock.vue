<script setup>
import { computed } from 'vue'
import Badge from 'primevue/badge'

defineEmits(['removeMod'])

const props = defineProps({
    index: { type: Number, default: null },
    fitting: { type: Object, required: true },
    drone: { type: Object, required: true },
    removable: { type: [Boolean, String], default: false },
    compact: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
    equipped: { type: Boolean, default: false },
    equipCount: { type: Number, default: 0 },
    stackable: { type: Boolean, default: false },
    searchText: { type: String, default: '' }
})

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

const nameSegments = computed(() => highlightSegments(props.fitting.name, props.searchText))

// When the match is in effect_text but NOT in the name, show a snippet
const descriptionSnippet = computed(() => {
    if (!props.searchText || props.searchText.length < 2 || !props.compact) return null
    // If name already matches, no need for a snippet
    if (props.fitting.name.toLowerCase().includes(props.searchText.toLowerCase())) return null
    const text = props.fitting.effect_text
    const q = props.searchText.toLowerCase()
    const idx = text.toLowerCase().indexOf(q)
    if (idx === -1) return null
    // Extract a window around the match
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
        class="mod-compact"
        :class="{
            'mod-selected': selected,
            'mod-equipped': equipped && !stackable,
            'type-fitting': fitting.type === 'fitting',
            'type-mod': fitting.type === 'mod'
        }"
    >
        <div class="compact-info">
            <div class="compact-left">
                <span class="compact-name"><template v-for="(seg, i) in nameSegments" :key="i"><strong v-if="seg.match" class="highlight">{{ seg.text }}</strong><template v-else>{{ seg.text }}</template></template></span>
                <span v-if="stackable && equipCount > 0" class="equip-count">x{{ equipCount }}</span>
                <span class="compact-cost">{{ Math.round(fitting.cost_multiplier * 100) }}%</span>
                <Badge :value="fitting.type" :severity="fitting.type === 'fitting' ? 'info' : 'warn'" />
            </div>
            <div v-if="descriptionSnippet" class="compact-snippet">
                <template v-for="(seg, i) in descriptionSnippet" :key="i"><strong v-if="seg.match" class="highlight">{{ seg.text }}</strong><template v-else>{{ seg.text }}</template></template>
            </div>
        </div>
        <div class="compact-right">
            <span v-if="equipped && !stackable" class="equipped-indicator">&#10003;</span>
            <slot name="add-button" v-else />
        </div>
    </div>

    <!-- Full mode: display for drone cards -->
    <div v-else class="mod-full" :class="{ 'type-fitting': fitting.type === 'fitting', 'type-mod': fitting.type === 'mod' }">
        <div class="mod-heading">
            <div class="mod-title-row">
                <h4>{{ fitting.name }}</h4>
                <span class="mod-type-tag" :class="fitting.type">{{ fitting.type }}</span>
                <span class="mod-cost">${{ fitting.cost_multiplier * drone.cost }}</span>
            </div>
            <a v-if="removable" class="mod-remove clickable" @click="$emit('removeMod', { index: index, type: fitting.type })" title="Remove">&times;</a>
        </div>
        <div class="mod-effect">{{ fitting.effect_text }}</div>
    </div>
</template>

<style scoped>
/* Full mode styles */
.mod-full {
    padding: 6px 10px;
    border-radius: 3px;
    border-left: 2px solid transparent;
    transition: background 0.15s;
}

.mod-full.type-fitting {
    border-left-color: var(--cwn-cyan-dim);
}

.mod-full.type-mod {
    border-left-color: var(--cwn-magenta-dim);
}

.mod-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mod-title-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
}

.mod-title-row h4 {
    display: inline;
    font-size: 0.9em;
    font-weight: bold;
    color: var(--cwn-text-bright);
}

.mod-type-tag {
    font-size: 0.55em;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 1.4;
    flex-shrink: 0;
}

.mod-type-tag.fitting {
    color: var(--cwn-cyan-dim);
    border: 1px solid rgba(0, 240, 255, 0.2);
}

.mod-type-tag.mod {
    color: var(--cwn-magenta-dim);
    border: 1px solid rgba(255, 0, 170, 0.2);
}

.mod-cost {
    font-size: 0.75em;
    color: var(--cwn-text-muted);
    flex-shrink: 0;
}

.mod-remove {
    color: var(--cwn-text-muted);
    font-size: 1.1em;
    line-height: 1;
    padding: 2px 4px;
    opacity: 0.4;
    transition: opacity 0.2s, color 0.2s;
}

.mod-full:hover .mod-remove {
    opacity: 0.7;
}

.mod-remove:hover {
    opacity: 1 !important;
    color: var(--cwn-magenta);
}

.mod-effect {
    font-size: 0.75em;
    color: var(--cwn-text-muted);
    line-height: 1.4;
    margin-top: 3px;
}

/* Compact mode styles */
.mod-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid var(--cwn-border);
    transition: background 0.15s;
    cursor: pointer;
}

.mod-compact.type-fitting {
    border-left: 2px solid var(--cwn-cyan-dim);
}

.mod-compact.type-mod {
    border-left: 2px solid var(--cwn-magenta-dim);
}

.mod-compact:not(.mod-equipped):hover {
    background: var(--cwn-bg-soft);
}

.mod-compact.mod-selected {
    background: var(--cwn-bg-mute);
    border-left: 2px solid var(--cwn-cyan);
}

.mod-compact.mod-equipped {
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

.equip-count {
    color: var(--cwn-cyan-dim);
    font-size: 0.75em;
    font-weight: bold;
    padding: 1px 5px;
    border: 1px solid var(--cwn-cyan-dim);
    border-radius: 2px;
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
.mod-compact.mod-just-added {
    animation: mod-added-flash 0.6s ease-out;
}

@keyframes mod-added-flash {
    0% { background: rgba(0, 240, 255, 0.3); }
    100% { background: transparent; }
}
</style>
