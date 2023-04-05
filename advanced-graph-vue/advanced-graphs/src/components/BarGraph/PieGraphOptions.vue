<!-- PieGraphOptions.vue -->
<template>
    <div class="AG-pie-graph-options">
      <div class="AG-bar-graph-options-row">
            <div class="AG-bar-graph-options-block">
                <!-- Show legend -->
                <label>{{module.tt("show_legend")}}:<input ref="show_legend" type="checkbox" v-model="show_legend" @change="updateParameters" /></label>
            </div>
        </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
          <h3>{{ module.tt('label_options') }}</h3>
          <label>{{ module.tt('label_spacing') }}: <input ref="label_spacing" type="range" min="0" max="3" step="0.2" v-model.number="label_spacing" @input="updateParameters" /></label>
          <label>{{ module.tt('label_size') }}: <input ref="label_size" type="range" min="0" max="50" v-model.number="label_size" @input="updateParameters" /></label>
          <label>{{ module.tt('value_size') }}: <input ref="value_size" type="range" min="0" max="50" v-model.number="value_size" @input="updateParameters" /></label>
          <label>{{ module.tt('value_precision') }}: <input ref="value_precision" type="number" min="0" max="10" v-model.number="value_precision" @input="updateParameters" /></label>
        </div>
        <div class="AG-bar-graph-options-block">
          <h3>{{ module.tt('separation_options') }}</h3>
          <label>{{ module.tt('separation_force') }}: <input ref="seperation_force" type="range" min="0" max="50" v-model.number="seperation_force" @input="updateParameters" /></label>
          <label>{{ module.tt('separation_strength') }}: <input ref="seperation_strength" type="range" min="1" max="2" step="0.1" v-model.number="seperation_strength" @input="updateParameters" /></label>
          <label>{{ module.tt('separation_iterations') }}: <input ref="seperation_iterations" type="range" min="0" max="300" v-model.number="seperation_iterations" @input="updateParameters" /></label>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "PieGraphOptions",
    inject: ["module"],
    emits: ["updateParameters"],
    props: {
      parameters: {
        type: Object,
        default: null,
      },
    },
    data() {
      return {
        show_legend: this.parameters.show_legend ? this.parameters.show_legend : false,
        label_spacing: this.parameters.label_spacing ? this.parameters.label_spacing : 0,
        label_size: this.parameters.label_size ? this.parameters.label_size : 12,
        value_size: this.parameters.value_size ? this.parameters.value_size : 10,
        value_precision: this.parameters.value_precision ? this.parameters.value_precision : 1,
        seperation_force: this.parameters.seperation_force ? this.parameters.seperation_force : 28,
        seperation_strength: this.parameters.seperation_strength ? this.parameters.seperation_strength : 1.1,
        seperation_iterations: this.parameters.seperation_iterations ? this.parameters.seperation_iterations : 50,
      };
    },
    methods: {
      updateParameters() {
        // Emit an event to update the parameters in the parent component
        this.$emit("updateParameters", {
          ...this.parameters,
          show_legend: this.show_legend,
          label_spacing: this.label_spacing,
          label_size: this.label_size,
          value_size: this.value_size,
          value_precision: this.value_precision,
          seperation_force: this.seperation_force,
          seperation_strength: this.seperation_strength,
          seperation_iterations: this.seperation_iterations,
        });
      },
    },
  };
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