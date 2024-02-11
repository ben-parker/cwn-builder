<script setup>
import { ref } from 'vue'
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Badge from 'primevue/badge'
import { useDroneStore } from '@/stores/drones'

const store = useDroneStore()
const props = defineProps(['index', 'drone'])

const searchText = ref('')
const visible = ref(false)
const fittings = ref([])
const searchResults = computed(() => {
    if (searchText.value.length < 2) {
        return store.droneMods;
    }

    return store.droneMods.filter(m => 
        m.name.toLowerCase().includes(searchText.value.toLowerCase()) 
        || m.effect_text.toLowerCase().includes(searchText.value.toLowerCase()))
})

// const totalCost = computed(() => {
//     if (fittings.value.length === 0) return props.drone.cost;
//     return props.drone.cost + fittings.value.map(f => f.cost_multiplier * props.drone.cost).reduce((prev, cur) => prev + cur, 0)
// })
</script>

<template>
    <div class="drone">
        <div class="drone-heading">
            <div>
                <h3>{{ drone.name }}</h3><span class="drone-cost"></span>
            </div>
            <a class="remove" @click="$emit('removeDrone', index)">&#x274C;</a>
        </div>
        <table>
            <thead>
                <th>AC</th>
                <th>TT</th>
                <th>HP</th>
                <th>Fittings</th>
                <th>Move</th>
                <th>Hardpoints</th>
                <th>Enc</th>
            </thead>
            <tbody>
                <tr>
                    <td>{{ drone.ac }}</td>
                    <td>{{ drone.tt }}</td>
                    <td>{{ drone.hp }}</td>
                    <td>{{ fittings.length }} / {{ drone.fittings }}</td>
                    <td>{{ drone.move }}</td>
                    <td>{{ drone.hardpoints }}</td>
                    <td>{{ drone.encumbrance }}</td>
                </tr>
            </tbody>
        </table>
        <a class="add-link" @click="visible = true">+ Add Mod/Fitting</a>

        <Dialog v-model:visible="visible" modal header="Modify Drone" :style="{ width: '25rem' }">
            <InputText v-model="searchText"></InputText>
            <div v-for="fitting in searchResults" class="mod-block">
                <div>
                    <h4>{{ fitting.name }}</h4><span class="mod-type">Fitting</span>
                    <Badge :value="fitting.cost_multiplier" severity="secondary"></Badge>
                </div>
                <div><small>{{ fitting.effect_text }}</small></div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
th {
    font-weight: bold;
}
thead, tr {
    text-align: center;
}

.drone-heading {
    background-color: black;
    color: white;
    display: flex;
    justify-content: space-between;
}

a {
    cursor:pointer;
}
a.add-link {
    margin-left: 20px;
}

h3, h4 {
    display: inline;
    margin-right: 5px;
}

.mod-type {
    font-size: 8px;
    margin-left: 5px;
    margin-right: 5px;  
}

.mod-block {
    margin-bottom: 10px;
}
</style>
