<script setup>
const props = defineProps({
  columns: { type: Number, default: 6 },
  rows: { type: Number, default: 5 },
  accentColor: { type: String, default: 'var(--cwn-cyan)' }
})
</script>

<template>
  <div class="ghost-table" :style="{ '--ghost-accent': accentColor }">
    <div class="ghost-header">
      <div v-for="c in columns" :key="'h' + c" class="ghost-cell ghost-header-cell" />
    </div>
    <div v-for="r in rows" :key="'r' + r" class="ghost-row" :style="{ animationDelay: (r * 0.12) + 's' }">
      <div v-for="c in columns" :key="'c' + c" class="ghost-cell">
        <div class="ghost-bar" :style="{ width: (40 + ((r * c * 17) % 45)) + '%' }" />
      </div>
    </div>
    <div class="ghost-scanline" />
  </div>
</template>

<style scoped>
.ghost-table {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--cwn-border);
  background: var(--cwn-bg-soft);
}

.ghost-header {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 2px solid var(--cwn-border-hover);
}

.ghost-header-cell {
  height: 12px;
  flex: 1;
  border-radius: 2px;
  background: var(--cwn-bg-elevated);
  opacity: 0.6;
}

.ghost-row {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--cwn-border);
  animation: ghost-fade 1.4s ease-in-out infinite alternate;
}

.ghost-cell {
  flex: 1;
  display: flex;
  align-items: center;
}

.ghost-bar {
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    var(--cwn-bg-elevated) 0%,
    var(--cwn-bg-mute) 50%,
    var(--cwn-bg-elevated) 100%
  );
  background-size: 200% 100%;
  animation: ghost-shimmer 2s ease-in-out infinite;
}

.ghost-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--ghost-accent) 50%,
    transparent 100%
  );
  opacity: 0.6;
  filter: blur(1px);
  box-shadow: 0 0 8px var(--ghost-accent);
  animation: ghost-scan 2.5s ease-in-out infinite;
}

@keyframes ghost-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes ghost-fade {
  0%   { opacity: 0.4; }
  100% { opacity: 0.8; }
}

@keyframes ghost-scan {
  0%   { top: 0; opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
}
</style>
