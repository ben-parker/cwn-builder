<script setup>
import Badge from 'primevue/badge'

const props = defineProps(['index', 'fitting', 'drone', 'removable']);
</script>

<template>
    <div>
        <div class="mod-heading">
            <div>
                <h4>{{ fitting.name }}</h4><span class="mod-cost">${{ fitting.cost_multiplier * drone.cost }}</span>
                <Badge :value="props.fitting.type"></Badge>
            </div>
            <a v-if="props.removable" class="remove clickable" @click="$emit('removeMod', { index: index, type: fitting.type })">&#x274C;</a>
        </div>
        <div><small>{{ props.fitting.effect_text }}</small></div>
    </div>
</template>

<style scoped>
.mod-cost {
    font-size: 12px;
    margin-right: 5px;  
}

h3, h4 {
    display: inline;
    margin-right: 5px;
}

.mod-heading {
    display: flex;
}
</style>