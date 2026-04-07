<script setup>
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

defineProps({
    title: { type: String, default: 'Select Item' }
})

const visible = defineModel('visible', { type: Boolean, default: false })
const searchText = defineModel('searchText', { type: String, default: '' })
</script>

<template>
    <Dialog v-model:visible="visible" modal :dismissableMask="true" :header="title" :style="{ width: '75%' }">
        <!-- Toolbar -->
        <div class="dialog-toolbar">
            <div class="search-wrapper">
                <InputText v-model="searchText" placeholder="Search..." class="search-input" />
                <a v-if="searchText" class="search-clear clickable" @click="searchText = ''" title="Clear search">&times;</a>
            </div>
            <div class="toolbar-right">
                <slot name="toolbar-pills" />
                <button class="done-btn" @click="visible = false">Done</button>
            </div>
        </div>

        <!-- Two-column body -->
        <div class="dialog-body">
            <!-- Left: compact list -->
            <div class="mod-list-col">
                <slot name="item-list" />
            </div>

            <!-- Right: detail panel -->
            <div class="mod-detail-col">
                <slot name="detail-panel" />
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
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

/* ===== Shared slot styles (exposed via :deep from parent or global) ===== */
:deep(.section-header) {
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

:deep(.capacity-warning) {
    padding: 4px 12px;
    font-size: 0.75em;
    color: var(--cwn-magenta);
    background: rgba(255, 0, 170, 0.08);
    border-bottom: 1px solid var(--cwn-magenta-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
}

:deep(.row-add-btn) {
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

:deep(.row-add-btn:hover) {
    background: rgba(0, 240, 255, 0.15);
    border-color: var(--cwn-cyan);
    box-shadow: var(--cwn-glow-cyan);
}

:deep(.no-results) {
    padding: 24px;
    text-align: center;
    color: var(--cwn-text-muted);
    font-size: 0.85em;
}

:deep(.detail-empty) {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--cwn-text-muted);
    font-size: 0.85em;
}

:deep(.detail-panel) {
    background: var(--cwn-bg-mute);
    border: 1px solid var(--cwn-border);
    border-radius: 4px;
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

:deep(.detail-panel-name) {
    color: var(--cwn-cyan);
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--cwn-border);
}

:deep(.detail-panel-cost) {
    color: var(--cwn-text-muted);
    font-size: 0.85em;
    font-weight: normal;
    margin-left: 8px;
}

:deep(.detail-meta) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-bottom: 12px;
}

:deep(.meta-item) {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

:deep(.meta-label) {
    color: var(--cwn-text-muted);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
}

:deep(.meta-value) {
    color: var(--cwn-text-bright);
    font-size: 0.9em;
}

:deep(.detail-effect) {
    color: var(--cwn-text);
    font-size: 0.85em;
    line-height: 1.5;
    margin-bottom: 16px;
    flex: 1;
}

:deep(.detail-action-btn) {
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

:deep(.detail-action-btn:hover) {
    background: rgba(0, 240, 255, 0.15);
    box-shadow: var(--cwn-glow-cyan);
}

:deep(.detail-unavailable-msg) {
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

:deep(.slot-pill) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7em;
}

:deep(.slot-pill .slot-label) {
    color: var(--cwn-text-muted);
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 1px;
}

:deep(.slot-pill .slot-value) {
    color: var(--cwn-text-muted);
}

:deep(.slot-pill.over-limit .slot-value) {
    color: var(--cwn-magenta);
}
</style>
