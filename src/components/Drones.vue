<script setup>
import { ref } from 'vue'
import { useDroneStore } from '@/stores/drones'
import Drone from '@/components/Drone.vue'

const store = useDroneStore()
await store.loadDroneData()

const droneList = ref([])

const newDrone = (idx) => droneList.value.push(store.drones[idx])
const money = (cost) => "$" + cost.toLocaleString("en-US")
</script>

<template>
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
    <Drone v-for="(drone, index) in droneList" 
        :index="index" 
        @remove-drone="(idx) => droneList.splice(idx, 1)"
        :drone="droneList[index]"
    />
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
</style>