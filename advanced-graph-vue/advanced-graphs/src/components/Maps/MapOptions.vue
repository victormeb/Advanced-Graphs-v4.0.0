<!-- BarGraphOptions.vue -->
<template>
    <div class="AG-bar-graph-options">
        <div class="AG-bar-graph-options-row">
            <div class="AG-bar-graph-options-block">
                <!-- Show legend -->
                <label>{{module.tt("map_show_legend")}}:<input ref="show_legend" type="checkbox" v-model="show_legend" @change="updateParameters" /></label>
                <label>{{module.tt("map_cluster_dots")}}:<input ref="cluster_dots" type="checkbox" v-model="cluster_dots" @change="updateParameters" /></label>
                <label>{{module.tt("map_node_scaling")}}:<input ref="node_scaling" type="range" min="0" max="5" step="0.1" v-model.number="node_scaling" @input="updateParameters" /></label>
            </div>
      </div>             
  </div>
</template>

<script>
    // import { parseChoicesOrCalculations, isCheckboxField, getCheckboxReport, truncateString, wrapString} from '@/utils.js';
    // import * as d3 from 'd3'; 
    // import RadioComponent from '@/components/RadioComponent.vue';

    export default {
        name: "MapOptions",
        components: {
            // RadioComponent,
        },
        props: {
            parameters: {
                type: Object,
                required: true
            },
        },
        inject: ['module', 'data_dictionary', 'report'],
        emits: ['updateParameters'],
        data() {
            const show_legend = this.parameters.show_legend === true ? true : false;
            const cluster_dots = this.parameters.cluster_dots === true ? true : false;
            const node_scaling = this.parameters.node_scaling || 1;

            return {
                show_legend: show_legend,
                cluster_dots: cluster_dots,
                node_scaling: node_scaling,
            }
        },
        methods: {
            updateParameters() {
                console.log('updateParameters', this.show_legend);
                this.$emit("updateParameters", {
                ...this.parameters,
                show_legend: this.show_legend,
                cluster_dots: this.cluster_dots,
                node_scaling: this.node_scaling,
                });
            },
        },
        mounted() {
            this.$nextTick(function () {
                this.$refs.show_legend.checked = this.show_legend;
                this.$refs.cluster_dots.checked = this.cluster_dots;
                this.$refs.node_scaling.value = this.node_scaling;
            });

            // emit the parameters to the parent with the new values, keeping the unchanged values
            this.updateParameters();
        },
    }
</script>

<style scoped>
    .AG-bar-graph-options {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 100%;
    }
    .AG-bar-graph-options-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        height: 100%;
    }
    .AG-bar-graph-options-row > div {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        height: 100%;
    }

    input[type=checkbox] {
        width: 20px;
        height: 20px;
    }
</style>