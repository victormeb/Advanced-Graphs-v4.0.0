<!-- BarGraphOptions.vue -->
<template>
    <div class="AG-bar-graph-options">
        <div class="AG-bar-graph-options-row">
            <div class="AG-bar-graph-options-block">
                <!-- Show legend -->
                <label>{{module.tt("likert_show_legend")}}:<input ref="show_legend" type="checkbox" v-model="show_legend" @change="updateParameters" /></label>
            </div>
        </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("likert_y_axis")}}</h3>
            <label>{{module.tt("likert_left_margin")}}:<input ref="left_margin" type="range" min="0" max="400" v-model.number="left_margin" @input="updateParameters" /></label>
            <label>{{module.tt("likert_y_label_size")}}:<input ref="y_label_size" type="range" min="0" max="50" v-model.number="y_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("likert_y_label_wrap")}}:
                <radio-component
                    v-model="y_label_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('likert_truncate'), module.tt('likert_wrap'), module.tt('likert_bar_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("likert_y_label_length")}}:<input ref="y_label_length" type="range" min="0" max="50" v-model.number="y_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("likert_y_rotate")}}:<input ref="y_rotate" type="range" min="-90" max="90" v-model.number="y_rotate" @input="updateParameters" /></label>
        </div>
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("likert_bar_labels")}}</h3>
            <label>{{module.tt("likert_bar_label_size")}}:<input ref="bar_label_size" type="range" min="0" max="50" v-model.number="bar_label_size" @input="updateParameters" /></label>
        </div>
      </div>              
  </div>
</template>

<script>
    import {stripChoicesOrCalculations, truncateString, wrapString} from '@/utils.js';
    import RadioComponent from '@/components/RadioComponent.vue';



    export default {
        name: "LikertGraphOptions",
        components: {
            RadioComponent,
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
            var choices = stripChoicesOrCalculations(this.parameters.likert_choices);

             // Get the choices for the category field
            const y_label_size = this.parameters.y_label_size ? Number(this.parameters.y_label_size) : 10;
            const y_label_limit = this.parameters.y_label_limit ? Number(this.parameters.y_label_limit) : null;
            const y_label_length = this.parameters.y_label_length ? Number(this.parameters.y_label_length) : Math.max(...Object.keys(choices).map(key => choices[key].length));

            const left_margin = this.parameters.left_margin ? Number(this.parameters.left_margin) : 0;

            // Get the y tick format
            var y_tick_format = d => d;

            // If y_label_limit is set to truncate, truncate the labels
            if (y_label_limit == 'truncate') {
                y_tick_format = d => truncateString(d, y_label_length);
            }
            // If y_label_limit is set to wrap, wrap the labels
            if (y_label_limit == 'wrap') {
                y_tick_format = d => wrapString(d, y_label_length);
            }

            const y_rotate = this.parameters.y_rotate ? Number(this.parameters.y_rotate) : 0;

            const bar_label_size = this.parameters.bar_label_size ? Number(this.parameters.bar_label_size) : 10;


 
           
            const show_legend = this.parameters.show_legend === true ? true : false;

            return {
                left_margin,
                y_label_size,
                y_label_limit,
                y_label_length,
                y_tick_format,
                y_rotate,
                bar_label_size,
                show_legend,
            }
        },
        methods: {
            updateParameters() {
                console.log('updateParameters', this.show_legend);
                this.$emit("updateParameters", {
                ...this.parameters,
                left_margin: this.left_margin,
                y_label_size: this.y_label_size,
                y_label_limit: this.y_label_limit,
                y_label_length: this.y_label_length,
                y_rotate: this.y_rotate,
                bar_label_size: this.bar_label_size,
                show_legend: this.show_legend,
                });
            },
        },
        mounted() {
            this.$nextTick(function () {
                this.$refs.left_margin.value = this.left_margin;
                this.$refs.y_label_size.value = this.y_label_size;
                // this.$refs.y_label_limit.value = this.y_label_limit;
                this.$refs.y_label_length.value = this.y_label_length;
                this.$refs.y_rotate.value = this.y_rotate;
                this.$refs.bar_label_size.value = this.bar_label_size;
                this.$refs.show_legend.checked = this.show_legend;
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