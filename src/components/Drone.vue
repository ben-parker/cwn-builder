<script setup>
import { ref, reactive, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ModBlock from '@/components/ModBlock.vue'
import { useDroneStore } from '@/stores/drones'
import { addFittingEffect, removeFittingEffect } from '@/services/fitting_effects'

const store = useDroneStore()
const props = defineProps(['index', 'drone'])
const emit = defineEmits(['updated'])

const searchText = ref('')
const visible = ref(false)
const fittings = ref([])
const mods = ref([])

const removeMod = function(data) {
    if (data.type === 'mod') {
        mods.value.splice(data.index, 1);
    } else if (data.type === 'fitting') {
        removeFittingEffect(fittings.value[data.index].name, props.drone);
        fittings.value.splice(data.index, 1);
    }

    emit('updated', { index: props.index, cost: totalCost.value });
};

const select = function(fitting) {
    if (fitting.type === 'fitting') {
        fittings.value.push(fitting);
        addFittingEffect(fitting.name, props.drone);
    } else if (fitting.type === 'mod') {
        mods.value.push(fitting);
    }

    emit('updated', { index: props.index, cost: totalCost.value });
};

const searchResults = computed(() => {
    if (searchText.value.length < 2) {
        return store.droneMods;
    }

    return store.droneMods.filter(m => 
        m.name.toLowerCase().includes(searchText.value.toLowerCase()) 
        || m.effect_text.toLowerCase().includes(searchText.value.toLowerCase()))
});

const totalCost = computed(() => {
    if (fittings.value.length === 0)
        return props.drone.cost;

    const modCosts = [...fittings.value, ...mods.value]
        .reduce((prev, cur) => prev + (props.drone.cost * cur.cost_multiplier),  0);
    return props.drone.cost + modCosts;
})

const money = (cost) => "$" + cost.toLocaleString("en-US");

defineExpose({ totalCost });
</script>

<template>
    <div class="drone">
        <div class="drone-heading">
            <div>
                <h3>{{ drone.name }}</h3><span class="drone-cost">{{ money(totalCost) }}</span>
            </div>
            <a class="clickable" @click="$emit('removeDrone', index)">&#x274C;</a>
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
                    <td>{{ drone.ac }}<span v-if="drone.extraAc ?? 0 > 0">({{ drone.ac + drone.extraAc }})</span></td>
                    <td>{{ drone.tt }}</td>
                    <td>{{ drone.hp }}<span v-if="drone.extraHp ?? 0 > 0">({{ drone.hp + drone.extraHp }})</span></td>
                    <td>{{ fittings.length + (drone.extraFittings ?? 0) }} / {{ drone.fittings }}</td>
                    <td>{{ drone.move }}</td>
                    <td>{{ drone.hardpoints }}</td>
                    <td v-if="parseInt(drone.encumbrance)">{{ drone.encumbrance + (drone.extraEncumbrance ?? 0)}}</td>
                    <td v-else="parseInt(drone.encumbrance)">{{ drone.encumbrance }}</td>
                </tr>
            </tbody>
        </table>
        <ModBlock class="indented mod-block" v-for="(mod, index) in mods" @remove-mod="removeMod" :fitting="mod" :drone="drone" removable="true" :index="index" />
        <ModBlock class="indented mod-block" v-for="(fitting, index) in fittings" @remove-mod="removeMod" :fitting="fitting" :drone="drone"  removable="true" :index="index"/>
        <a class="indented clickable" @click="visible = true">+ Add Mod/Fitting</a>

        <Dialog v-model:visible="visible" modal header="Modify Drone" :style="{ width: '60%' }">
            <div style="display: flex; justify-content: flex-end;">
                <InputText v-model="searchText"></InputText>
            </div>
            <ModBlock v-for="fitting in searchResults" class="mod-block clickable" @click="select(fitting)" :drone="drone" :fitting="fitting" />
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

table {
    width: 100%;
    table-layout: fixed;
}
.drone-heading {
    background-color: black;
    color: white;
    display: flex;
    justify-content: space-between;
}

.indented {
    margin-left: 20px;
}

h3, h4 {
    display: inline;
    margin-right: 5px;
}

.mod-block {
    margin-bottom: 10px;
}

.unavailable {
    color: gray;
}

.drone {
    width: 60%;
    font-size: 10pt;
}
</style>
