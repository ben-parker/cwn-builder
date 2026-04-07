<script setup>
import { defineAsyncComponent, shallowRef, provide, ref } from 'vue'
import { hasShareHash, readShareState, clearShareHash } from '@/services/share'

const tools = [
  { id: 'drones', label: 'Drones', component: defineAsyncComponent(() => import('./components/Drones.vue')) },
  { id: 'vehicles', label: 'Vehicles', component: defineAsyncComponent(() => import('./components/Vehicles.vue')) },
]

const activeTool = shallowRef(tools[0])
const sharedState = ref(null)
provide('sharedState', sharedState)

// Check hash synchronously (no lz-string import needed), then decode async and provide to children
if (hasShareHash()) {
  readShareState().then(state => {
    if (state) {
      const matchedTool = tools.find(t => t.id === state.t)
      if (matchedTool) activeTool.value = matchedTool
      sharedState.value = state
    }
  })
}
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-header">CWN Tools</div>
    <ul class="sidebar-nav">
      <li
        v-for="tool in tools"
        :key="tool.id"
        :class="[{ active: activeTool.id === tool.id }, 'tool-' + tool.id]"
        @click="activeTool = tool"
      >
        {{ tool.label }}
      </li>
    </ul>
    <footer class="sidebar-footer">
      Tab icon by <a href="https://www.flaticon.com/free-icons/cyberpunk" title="cyberpunk icons">Freepik - Flaticon</a>
    </footer>
  </nav>
  <main class="content">
    <Suspense>
      <KeepAlive>
        <component :is="activeTool.component" />
      </KeepAlive>
    </Suspense>
  </main>
</template>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: var(--cwn-bg-soft);
  border-right: 1px solid var(--cwn-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 3px;
  border-bottom: 1px solid var(--cwn-border);
  background: linear-gradient(
    90deg,
    var(--cwn-cyan) 0%,
    var(--cwn-magenta) 50%,
    var(--cwn-yellow) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))
          drop-shadow(0 0 12px rgba(255, 0, 170, 0.2));
}

.sidebar-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  color: var(--cwn-text-muted);
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.sidebar-nav li:hover {
  color: var(--cwn-text-bright);
  background: var(--cwn-bg-mute);
}

.sidebar-nav li.tool-drones:hover {
  border-left-color: var(--cwn-cyan-dim);
}

.sidebar-nav li.tool-drones.active {
  color: var(--cwn-cyan);
  background: var(--cwn-bg-mute);
  border-left-color: var(--cwn-cyan);
  text-shadow: var(--cwn-glow-cyan);
}

.sidebar-nav li.tool-vehicles:hover {
  border-left-color: var(--cwn-yellow-dim);
}

.sidebar-nav li.tool-vehicles.active {
  color: var(--cwn-yellow);
  background: var(--cwn-bg-mute);
  border-left-color: var(--cwn-yellow);
  text-shadow: var(--cwn-glow-yellow);
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
  font-size: 0.7em;
  color: var(--cwn-text-muted);
  border-top: 1px solid var(--cwn-border);
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  max-width: 1280px;
}
</style>
