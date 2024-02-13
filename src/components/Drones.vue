<script setup>
import { ref, computed} from 'vue'
import { useDroneStore } from '@/stores/drones'
import Drone from '@/components/Drone.vue'

const store = useDroneStore()
await store.loadDroneData()

const droneList = ref([])
const costs = ref([])
const newDrone = (idx) => {
    droneList.value.push(store.drones[idx]);
    costs.value.push(store.drones[idx].cost);
};
const money = (cost) => "$" + cost.toLocaleString("en-US")

const allDroneCost = computed(() => {
    const totalCost = costs.value.reduce((prev, cur) => prev + cur, 0);
    return money(totalCost);
});
</script>

<template>
    <div>
        <div class="row">
            <div class="column">
                <table>
                    <thead>
                        <th></th>
                        <th>Drone</th>
                        <th>Cost</th>
                        <th>AC</th>
                        <th>TT</th>
                        <th>HP</th>
                        <th>Fittings</th>
                        <th>Move</th>
                        <th>Hardpoints</th>
                        <th>Enc</th>
                    </thead>
                    <tbody>
                        <tr v-for="(drone, index) in store.drones" :index="index">
                            <td><button @click="newDrone(index)">+</button></td>
                            <td>{{ drone.name }}</td>
                            <td>{{ money(drone.cost) }}</td>
                            <td>{{ drone.ac }}</td>
                            <td>{{ drone.tt }}</td>
                            <td>{{ drone.hp }}</td>
                            <td>{{ drone.fittings }}</td>
                            <td>{{ drone.move }}</td>
                            <td>{{ drone.hardpoints }}</td>
                            <td>{{ drone.encumbrance }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="column centered">
                <div id="drone-summary">Total cost of drones + mods/fittings: {{ allDroneCost }}</div>
            </div>
        </div>
        <Drone v-for="(drone, index) in droneList"
            :index="index"
            @remove-drone="(idx) => { droneList.splice(idx, 1); costs.splice(idx, 1); }"
            @updated="(data) => costs[data.index] = data.cost"
            :drone="droneList[index]"
        />
    </div>
</template>

<style scoped>
th {
    font-weight: bold;
}
thead, tr {
    text-align: center;
}

thead, td:nth-child(2) {
    text-align: left;
}

.drone {
    margin-bottom: 30px;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.column {
  display: flex;
  flex-direction: column;
  flex-basis: 100%;
  flex: 1;
}

.centered {
    align-items: center;
}

#drone-summary {
    width: 67%;
    text-align: left;
}
</style>