<!-- GraphTypeSelector.vue -->
<template>
    <div>
        <select v-model="selectedGraphType">
            <option :value="null" :selected="true"> {{ module.tt('select_a_graph_type') }} </option>
            <option v-for="(graphType, index) in availableGraphTypes" 
            :key="index" 
            :value="graphType" 
            :selected="currentGraphType==graphType">
                {{ module.tt(graphType) }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'GraphTypeSelector',
    inject: ['module'],
    props: {
        currentGraphType: {
            type: String,
            default: null,
        },
        availableGraphTypes: {
            type: Array,
            default: null,
        }
    },
    data() {
        return {
            selectedGraphType: this.currentGraphType,
        };
    },
    watch: {
        selectedGraphType(newVal) {
            if (newVal)
                this.$emit('graphTypeChange', newVal);
            // console.log(newVal);
        },
    },
    methods: {
        onGraphTypeChange() {
            console.log(this.selectedGraphType);
            if (this.selectedGraphType)
                this.$emit('graphTypeChange', this.selectedGraphType);
        },
    }
};
</script>

<style scoped>
    select {
        min-width: 100px;
        width: 100%;
        height: 100%;
        font-size: 1.2em;
        color: #000;
    }
</style>