<!-- BarGraphOptions.vue -->
<template>
    <div class="AG-bar-graph-options">
        <div class="AG-bar-graph-options-row">
            <div class="AG-bar-graph-options-block">
                <!-- Show legend -->
                <label><input ref="show_legend" type="checkbox" v-model="show_legend" @change="updateParameters" /> {{module.tt("bar_show_legend")}}</label>
            </div>
        </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
            <h3>{{ module.tt("bar_x_axis") }}</h3>
            <label>{{module.tt("bar_bottom_margin")}}:<input ref="bottom_margin" type="number" v-model.number="bottom_margin" @input="updateParameters" /></label>
            <label>{{module.tt("bar_x_title_offset")}}:<input ref="x_title_offset" type="range" :min="0" :max="bottom_margin" v-model.number="x_title_offset" @input="updateParameters" /></label>
            <label>{{module.tt("bar_x_title_size")}}:<input ref="x_title_size" type="range" min="0" max="50" v-model.number="x_title_size" @input="updateParameters" /></label>
            <label>{{module.tt("bar_x_label_size")}}:<input ref="x_label_size" type="range" min="0" max="50" v-model.number="x_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("bar_x_label_wrap")}}:
                <radio-component
                    v-model="x_label_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('bar_truncate'), module.tt('bar_wrap'), module.tt('bar_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("bar_x_label_length")}}:<input ref="x_label_length" type="range" min="0" max="50" v-model.number="x_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("bar_x_rotate")}}:<input ref="x_rotate" type="range" min="0" max="360" v-model.number="x_rotate" @input="updateParameters" /></label>
        </div>
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("bar_y_axis")}}</h3>
            <label>{{module.tt("bar_left_margin")}}:<input ref="bottom_margin" type="number" v-model.number="left_margin" @input="updateParameters" /></label>
            <label>{{module.tt("bar_y_title_offset")}}:<input ref="y_title_offset" type="range" min="0" max="100" v-model.number="y_title_offset" @input="updateParameters" /></label>
            <label>{{module.tt("bar_y_title_size")}}:<input ref="y_title_size" type="range" min="0" max="50" v-model.number="y_title_size" @input="updateParameters" /></label>
            <label>{{module.tt("bar_y_label_size")}}:<input ref="y_label_size" type="range" min="0" max="50" v-model.number="y_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("bar_y_label_wrap")}}:
                <radio-component
                    v-model="y_label_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('bar_truncate'), module.tt('bar_wrap'), module.tt('bar_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("bar_y_label_length")}}:<input ref="y_label_length" type="range" min="0" max="50" v-model.number="y_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("bar_y_rotate")}}:<input ref="y_rotate" type="range" min="0" max="360" v-model.number="y_rotate" @input="updateParameters" /></label>
        </div>
      </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("bar_bar_labels")}}</h3>
            <label>{{module.tt("bar_bar_label_size")}}:<input ref="bar_label_size" type="range" min="0" max="50" v-model.number="bar_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("bar_bar_label_position")}}:<input ref="bar_label_position" type="range" min="-50" max="50" step="0.1" v-model.number="bar_label_position" @input="updateParameters" /></label>
        </div>   
      </div>                 
  </div>
</template>

<script>
    import { parseChoicesOrCalculations, isCheckboxField, getCheckboxReport, truncateString, wrapString} from '@/utils.js';
    import * as d3 from 'd3'; 
    import RadioComponent from '@/components/RadioComponent.vue';

    export default {
        name: "BarGraphOptions",
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
             // Get the choices for the category
             var choices = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            if (isCheckboxField(this.parameters.categorical_field)) {
                this_report = getCheckboxReport(this.parameters.categorical_field);
            }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == this.parameters.instrument; }.bind(this));

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field] != ''; }.bind(this));
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field] == ""))
                // Add an NA category to choices
                choices[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.numeric_field] != ''; }.bind(this));
            }

            var barHeightFunction = function (d) { return d[this.parameters.numeric_field]; }.bind(this);

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[this.parameters.numeric_field] == '' ? this.parameters.na_numeric_value : d[this.parameters.numeric_field]; }.bind(this);
            }

            var counts = d3.rollup(filteredReport, v => v.length, d => d[this.parameters.categorical_field]);


            // If we are not using a numeric field, get the counts for each category
            if (!(this.parameters.is_count || this.parameters.numeric_field == '')) {
                counts = d3.rollup(filteredReport, v => d3[this.parameters.aggregation_function](v, barHeightFunction), d => d[this.parameters.categorical_field]);
            }

            var countKeys = Array.from(counts, ([key]) => key);

            var domain = Object.keys(choices).filter(function (d) { return countKeys.includes(d); });

            // If unused_categories is set to keep, set the domain to all the choices
            if (this.parameters.unused_categories == 'keep') {
                domain = Object.keys(choices);
            }

            var barHeights = Array.from(counts, ([key, value]) => ({key: key, value: value}));

            // Create a function to interpolate between colors for each category
            // var interpolateColors = d3.interpolateRgbBasis(this.parameters.palette_brewer ? this.parameters.palette_brewer : ['red', 'green', 'blue']);

            // var colorScale = d3.scaleOrdinal()
            //     .domain(domain)
            //     .range(domain.map((d, i) => interpolateColors(i / (domain.length > 1 ? domain.length-1: 1))));

            const x_title_size = this.parameters.x_title_size ? Number(this.parameters.x_title_size) : 15;
            const x_label_size = this.parameters.x_label_size ? Number(this.parameters.x_label_size) : 10;
            const x_label_limit = this.parameters.x_label_limit ? Number(this.parameters.x_label_limit) : null;
            const x_label_length = this.parameters.x_label_length ? Number(this.parameters.x_label_length) : Math.max(...domain.map(d => choices[d].length));

            // Get the x tick format
            var x_tick_format = d => choices[d];

            // If x_label_limit is set to truncate, truncate the labels
            if (x_label_limit == 'truncate') {
                x_tick_format = d => truncateString(choices[d], x_label_length);
            }
            // If x_label_limit is set to wrap, wrap the labels
            if (x_label_limit == 'wrap') {
                x_tick_format = d => wrapString(choices[d], x_label_length);
            }

            const x_rotate = this.parameters.x_rotate ? Number(this.parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / domain.length ? 90 : 0;
            const x_title_offset = this.parameters.x_title_offset ? Number(this.parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size + 20;
            const bottom_margin = this.parameters.bottom_margin ? Number(this.parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size * 2 + 20;


            const y_title_size = this.parameters.y_title_size ? Number(this.parameters.y_title_size) : 15;
            const y_label_size = this.parameters.y_label_size ? Number(this.parameters.y_label_size) : 10;
            const y_label_limit = this.parameters.y_label_limit ? Number(this.parameters.y_label_limit) : null;
            const y_label_length = this.parameters.y_label_length ? Number(this.parameters.y_label_length) : Math.max(...barHeights.map(d => d.value.toString().length));

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

            // If y_label_limit is a string and not truncate or wrap, use it as the tick format
            // if (typeof y_label_limit != 'undefined' && y_label_limit != 'truncate' && y_label_limit != 'wrap' && y_label_limit != null) {
            //     y_tick_format = d => d3.format(y_label_limit)(d);
            // }
            const bar_label_size = this.parameters.bar_label_size ? Number(this.parameters.bar_label_size) : 10;
            const bar_label_position = this.parameters.bar_label_position ? Number(this.parameters.bar_label_position) : 4.5;


            const y_rotate = this.parameters.y_rotate ? Number(this.parameters.y_rotate) : 0;
            const y_title_offset = this.parameters.y_title_offset ? Number(this.parameters.y_title_offset) : 45;
            const left_margin = this.parameters.left_margin ? Number(this.parameters.left_margin) : y_label_length * y_label_size * Math.sin(y_rotate * Math.PI / 180)*0.5 + y_title_size * 2 + 20;

            const show_legend = this.parameters.show_legend === true ? true : false;

            return {
                x_title_size,
                x_label_size,
                x_label_limit,
                x_label_length,
                x_tick_format,
                x_rotate,
                x_title_offset,
                bottom_margin,
                y_title_size,
                y_label_size,
                y_label_limit,
                y_label_length,
                y_tick_format,
                y_rotate,
                y_title_offset,
                left_margin,
                bar_label_size,
                bar_label_position,
                show_legend,
            }
        },
        methods: {
            updateParameters() {
                console.log('updateParameters', this.show_legend);
                this.$emit("updateParameters", {
                ...this.parameters,
                x_title_size: this.x_title_size,
                x_label_size: this.x_label_size,
                x_label_limit: this.x_label_limit,
                x_label_length: this.x_label_length,
                x_rotate: this.x_rotate,
                x_title_offset: this.x_title_offset,
                bottom_margin: this.bottom_margin,
                y_title_size: this.y_title_size,
                y_label_size: this.y_label_size,
                y_label_limit: this.y_label_limit,
                y_label_length: this.y_label_length,
                y_rotate: this.y_rotate,
                y_title_offset: this.y_title_offset,
                left_margin: this.left_margin,
                bar_label_size: this.bar_label_size,
                bar_label_position: this.bar_label_position,
                show_legend: this.show_legend,
                });
            },
        },
        mounted() {
            this.$nextTick(function () {
                this.$refs.x_title_size.value = this.x_title_size;
                this.$refs.x_label_size.value = this.x_label_size;
                // this.$refs.x_label_limit.value = this.x_label_limit;
                this.$refs.x_label_length.value = this.x_label_length;
                this.$refs.x_rotate.value = this.x_rotate;
                this.$refs.x_title_offset.value = this.x_title_offset;
                this.$refs.bottom_margin.value = this.bottom_margin;
                this.$refs.y_title_size.value = this.y_title_size;
                this.$refs.y_label_size.value = this.y_label_size;
                // this.$refs.y_label_limit.value = this.y_label_limit;
                this.$refs.y_label_length.value = this.y_label_length;
                this.$refs.y_rotate.value = this.y_rotate;
                this.$refs.y_title_offset.value = this.y_title_offset;
                // this.$refs.left_margin.value = this.left_margin;
                this.$refs.bar_label_size.value = this.bar_label_size;
                this.$refs.bar_label_position.value = this.bar_label_position;
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