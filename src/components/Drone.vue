<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ModBlock from '@/components/ModBlock.vue'
import { useDroneStore } from '@/stores/drones'
import { addModEffect, removeModEffect } from '@/services/fitting_effects'

const store = useDroneStore()
const props = defineProps(['index', 'drone'])
const emit = defineEmits(['updated'])

const searchText = ref('')
const visible = ref(false)
const mods = ref([])

const removeMod = function(data) {
    removeModEffect(mods.value[data.index], props.drone);
    mods.value.splice(data.index, 1);
    emit('updated', { index: props.index, cost: totalCost.value });
};

const select = function(fitting) {
    addModEffect(fitting, props.drone);
    mods.value.push(fitting);
    emit('updated', { index: props.index, cost: totalCost.value });
};

const money = (cost) => "$" + cost.toLocaleString("en-US");
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
    (addedFittings.value.length + props.drone.extraFittings ?? 0) 
    > (props.drone.fittings + (props.drone.extraMaxFittings ?? 0)));

const searchResults = computed(() => {
    if (searchText.value.length < 2) {
        return store.droneMods;
    }

    return store.droneMods.filter(m => 
        m.name.toLowerCase().includes(searchText.value.toLowerCase()) 
        || m.effect_text.toLowerCase().includes(searchText.value.toLowerCase()))
});

const totalCost = computed(() => {
    if (mods.value.length === 0)
        return props.drone.cost;

    const modCosts = mods.value.reduce((prev, cur) => 
        prev + (props.drone.cost * cur.cost_multiplier),  0);

    return props.drone.cost + modCosts;
})
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
                    <td :class="{error: tooManyFittings}">{{ addedFittings.length + (drone.extraFittings ?? 0) }} / {{ drone.fittings + (drone.extraMaxFittings ?? 0)}}</td>
                    <td>{{ modifiedMove(drone.move, drone.extraMove ?? 0) }}</td>
                    <td>{{ drone.hardpoints + (drone.extraHardpoints ?? 0) }}</td>
                    <td v-if="parseInt(drone.encumbrance)">{{ drone.encumbrance }}<span v-if="drone.extraEncumbrance ?? 0 !== 0">({{ drone.encumbrance + drone.extraEncumbrance }})</span></td>
                    <td v-else="parseInt(drone.encumbrance)">{{ drone.encumbrance }}</td>
                </tr>
            </tbody>
        </table>
        <ModBlock class="indented mod-block" v-for="(mod, index) in mods" @remove-mod="removeMod" :fitting="mod" :drone="drone" removable="true" :index="index" />
        <a class="indented clickable" @click="visible = true">+ Add Mod/Fitting</a>

        <Dialog v-model:visible="visible" modal header="Modify Drone" :style="{ width: '60%' }">
            <div style="display: flex; justify-content: flex-end;">
                <div>
                    <label for="mod-search">Search</label>
                    <InputText v-model="searchText" id="mod-search"></InputText>
                </div>               
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
    margin-bottom: 1%;
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
    font-size: 0.8em;
}

div.p-dialog label {
    display: block;
}

.error {
    color: red;
}
</style>
