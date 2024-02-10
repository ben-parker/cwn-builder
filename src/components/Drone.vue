<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const props = defineProps(['index', 'drone'])
const mods = ref([])
let visible = ref(false)
</script>

<template>
    <div class="drone">
        <div class="drone-heading">
            <h3>{{ drone.name }}</h3>
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
                    <td>{{ drone.fittings }}</td>
                    <td>{{ drone.move }}</td>
                    <td>{{ drone.hardpoints }}</td>
                    <td>{{ drone.encumbrance }}</td>
                </tr>
            </tbody>
        </table>
        <a class="add-link" @click="visible = true">+ Add Mod/Fitting</a>

        <Dialog v-model:visible="visible" modal header="Edit Profile" :style="{ width: '25rem' }">
            <span class="p-text-secondary block mb-5">Update your information.</span>
            <div class="flex align-items-center gap-3 mb-3">
                <label for="username" class="font-semibold w-6rem">Username</label>
                <InputText id="username" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <label for="email" class="font-semibold w-6rem">Email</label>
                <InputText id="Email" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
                <Button type="button" label="Save" @click="visible = false"></Button>
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
</style>
