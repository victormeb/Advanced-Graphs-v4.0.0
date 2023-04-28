<!-- BarGraphOptions.vue -->
<template>
    <div class="AG-bar-graph-options">
        <div class="AG-bar-graph-options-row">
            <div class="AG-bar-graph-options-block">
                <!-- Show legend -->
                <label><input ref="show_legend" type="checkbox" v-model="show_legend" @change="updateParameters" /> {{module.tt("grouped_show_legend")}}</label>
            </div>
        </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
            <h3>{{ module.tt("grouped_x_axis") }}</h3>
            <label>{{module.tt("grouped_bottom_margin")}}:<input ref="bottom_margin" type="number" v-model.number="bottom_margin" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_x_title_size")}}:<input ref="x_title_size" type="range" min="0" max="50" v-model.number="x_title_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_x_label_size")}}:<input ref="x_label_size" type="range" min="0" max="50" v-model.number="x_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_x_label_wrap")}}:
                <radio-component
                    v-model="x_label_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('grouped_truncate'), module.tt('grouped_wrap'), module.tt('grouped_bar_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("grouped_x_label_length")}}:<input ref="x_label_length" type="range" min="0" max="50" v-model.number="x_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_x_rotate")}}:<input ref="x_rotate" type="range" min="0" max="360" v-model.number="x_rotate" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_x_title_offset")}}:<input ref="x_title_offset" type="range" :min="0" :max="bottom_margin" v-model.number="x_title_offset" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_color_label_size")}}:<input ref="color_label_size" type="range" min="0" max="50" v-model.number="color_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_color_label_wrap")}}:
                <radio-component
                    v-model="color_tick_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('grouped_truncate'), module.tt('grouped_wrap'), module.tt('grouped_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("grouped_color_label_length")}}:<input ref="color_label_length" type="range" min="0" max="50" v-model.number="color_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_color_label_rotate")}}:<input ref="color_label_rotate" type="range" min="0" max="360" v-model.number="color_label_rotate" @input="updateParameters" /></label>
        </div>
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("grouped_y_axis")}}</h3>
            <label>{{module.tt("grouped_y_title_size")}}:<input ref="y_title_size" type="range" min="0" max="50" v-model.number="y_title_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_y_label_size")}}:<input ref="y_label_size" type="range" min="0" max="50" v-model.number="y_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_y_label_wrap")}}:
                <radio-component
                    v-model="y_label_limit"
                    :values="['truncate', 'wrap', 'none']"
                    :labels="[module.tt('grouped_truncate'), module.tt('grouped_wrap'), module.tt('grouped_none')]"
                    :defaultValue="'none'"
                    @update:modelValue="updateParameters"
                ></radio-component>
            </label>
            <label>{{module.tt("grouped_y_label_length")}}:<input ref="y_label_length" type="range" min="0" max="50" v-model.number="y_label_length" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_y_rotate")}}:<input ref="y_rotate" type="range" min="0" max="360" v-model.number="y_rotate" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_y_title_offset")}}:<input ref="y_title_offset" type="range" min="0" max="100" v-model.number="y_title_offset" @input="updateParameters" /></label>
        </div>
      </div>
      <div class="AG-bar-graph-options-row">
        <div class="AG-bar-graph-options-block">
            <h3>{{module.tt("grouped_bar_labels")}}</h3>
            <label>{{module.tt("grouped_bar_label_size")}}:<input ref="bar_label_size" type="range" min="0" max="50" v-model.number="bar_label_size" @input="updateParameters" /></label>
            <label>{{module.tt("grouped_bar_label_position")}}:<input ref="bar_label_position" type="range" min="-50" max="50" step="0.1" v-model.number="bar_label_position" @input="updateParameters" /></label>
        </div>   
      </div>                 
  </div>
</template>

<script>
    import { parseChoicesOrCalculations, /*isCheckboxField, getCheckboxReport,*/ truncateString, wrapString} from '@/utils.js';
    import * as d3 from 'd3'; 
    import RadioComponent from '@/components/RadioComponent.vue';

    export default {
        name: "GroupedBarGraphOptions",
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
            var choices_one = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field_one]);
            var choices_two = parseChoicesOrCalculations(this.data_dictionary[this.parameters.categorical_field_two]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            // if (isCheckboxField(this.parameters.categorical_field_one)) {
            //     this_report = getCheckboxReport(this.parameters.categorical_field_one);
            // }

            // if (isCheckboxField(this.parameters.categorical_field_one)) {
            //     this_report = getCheckboxReport(this.parameters.categorical_field_one);
            // }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == this.parameters.instrument; }.bind(this));

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category_one == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field_one] != ''; }.bind(this));
            }

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (this.parameters.na_category_two == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.categorical_field_two] != ''; }.bind(this));
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field_one] == ""))
                // Add an NA category to choices
                choices_one[""] = this.module.tt("na");
            
            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[this.parameters.categorical_field_two] == ""))
                // Add an NA category to choices
                choices_two[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[this.parameters.numeric_field] != ''; }.bind(this));
            }

            var barHeightFunction = function (d) { return d[this.parameters.numeric_field]; }.bind(this);

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!this.parameters.is_count && this.parameters.numeric_field != '' && this.parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[this.parameters.numeric_field] == '' ? this.parameters.na_numeric_value : d[this.parameters.numeric_field]; }.bind(this);
            }

            var countsNested = d3.rollup(filteredReport, v => v.length, d => d[this.parameters.categorical_field_one], d => d[this.parameters.categorical_field_two]);


            // If we are not using a numeric field, get the counts for each category
            if (!(this.parameters.is_count || this.parameters.numeric_field == '')) {
                countsNested = d3.rollup(filteredReport, v => d3[this.parameters.aggregation_function](v, barHeightFunction), d => d[this.parameters.categorical_field_one], d => d[this.parameters.categorical_field_two]);
            }

            const countsFlattened = Array.from(countsNested, ([category, typeMap]) => {
                return Array.from(typeMap, ([type, value]) => ({category, type, value}));
            }).flatMap(d => d)
            // Reorder by category, then by type
            .sort((a, b) => {
                if (Number(a.category) < Number(b.category)) return -1;
                if (Number(a.category) > Number(b.category)) return 1;
                if (Number(a.type) < Number(b.type)) return -1;
                if (Number(a.type) > Number(b.type)) return 1;
                return 0;
            });

            var barDomain = Object.keys(choices_one);

            var colorDomain = Object.keys(choices_two);


            if (this.parameters.unused_categories_one == 'drop') {
                barDomain = barDomain.filter(d => countsFlattened.some(e => e.category == d));
            }       
            
            // If unused_categories_two is set to drop, set the domain of the stacks to the categories in countsFlattened ordered by the order of choices
            if (this.parameters.unused_categories_two == 'drop') {
                colorDomain = colorDomain.filter(d => countsFlattened.some(e => e.type == d));
            }

            const x_title_size = this.parameters.x_title_size ? Number(this.parameters.x_title_size) : 15;
            const x_label_size = this.parameters.x_label_size ? Number(this.parameters.x_label_size) : 10;
            const x_label_limit = this.parameters.x_label_limit ? this.parameters.x_label_limit : null;
            const x_label_length = this.parameters.x_label_length ? Number(this.parameters.x_label_length) : Math.max(...barDomain.map(d => choices_one[d].length));
 

            // Get the x tick format
            var x_tick_format = d => choices_one[d];

            // If x_label_limit is set to truncate, truncate the labels
            if (x_label_limit == 'truncate') {
                x_tick_format = d => truncateString(choices_one[d], x_label_length);
            }
            // If x_label_limit is set to wrap, wrap the labels
            if (x_label_limit == 'wrap') {
                x_tick_format = d => wrapString(choices_one[d], x_label_length);
            }
            
            const x_rotate = this.parameters.x_rotate || this.parameters.x_rotate == 0 ? Number(this.parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / barDomain.length ? 90 : 0;
            const x_title_offset = this.parameters.x_title_offset ? Number(this.parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size + 20;
            const bottom_margin = this.parameters.bottom_margin ? Number(this.parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size * 2 + 20;
            
            const y_title_size = this.parameters.y_title_size ? Number(this.parameters.y_title_size) : 15;
            const y_label_size = this.parameters.y_label_size ? Number(this.parameters.y_label_size) : 10;
            const y_label_limit = this.parameters.y_label_limit ? this.parameters.y_label_limit : null;
            const y_label_length = this.parameters.y_label_length ? Number(this.parameters.y_label_length) : Math.max(...countsFlattened.map(d => d.category.toString().length));
            
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
            const y_title_offset = this.parameters.y_title_offset ? Number(this.parameters.y_title_offset) : 45;

            const bar_label_size = this.parameters.bar_label_size ? Number(this.parameters.bar_label_size) : 10;
            const bar_label_position = this.parameters.bar_label_position ? Number(this.parameters.bar_label_position) : 0.5;

            const show_legend = this.parameters.show_legend ? true : false; 

            const color_label_size = this.parameters.color_label_size ? Number(this.parameters.color_label_size) : 10;
            const color_tick_limit = this.parameters.color_tick_limit ? Number(this.parameters.color_tick_limit) : null;
            const color_label_length = this.parameters.color_label_length ? Number(this.parameters.color_label_length) : Math.max(...colorDomain.map(d => choices_two[d].length));
            const color_label_rotate = this.parameters.color_label_rotate ? Number(this.parameters.color_label_rotate) : color_label_length * color_label_size * 1.2 > 640 / colorDomain.length ? 90 : 0;

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
                bar_label_size,
                bar_label_position,
                show_legend,
                color_label_size,
                color_tick_limit,
                color_label_length,
                color_label_rotate,
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
                bar_label_size: this.bar_label_size,
                bar_label_position: this.bar_label_position,
                show_legend: this.show_legend,
                color_label_size: this.color_label_size,
                color_tick_limit: this.color_tick_limit,
                color_label_length: this.color_label_length,
                color_label_rotate: this.color_label_rotate,
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
                this.$refs.bar_label_size.value = this.bar_label_size;
                this.$refs.bar_label_position.value = this.bar_label_position;
                this.$refs.show_legend.checked = this.show_legend;
                this.$refs.color_label_size.value = this.color_label_size;
                // this.$refs.color_tick_limit.value = this.color_tick_limit;
                this.$refs.color_label_length.value = this.color_label_length;
                this.$refs.color_label_rotate.value = this.color_label_rotate;
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