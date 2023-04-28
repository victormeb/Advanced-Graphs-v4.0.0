<!-- BarGraph.vue -->
<template>
    <div class="AG-graph-container">
        <div class="AG-graph-title">
            <h3>{{ parameters.title || "" }}</h3>
        </div>
        <div ref="graphContainer" class="AG-graphContainer"></div>
        <div class="AG-graph-description">
            <p>{{ parameters.description || ""}}</p>
        </div>
        <component
            v-if="editorMode"
            :is="moreOptionsComponent"
            :parameters="parameters"
            @updateParameters="updateParameters($event)"
        >
        </component>
    </div>
</template>

<script>
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
// import * as d3Force from 'd3-force';
// // import {PieChart} from "@d3/pie-chart";
import {stripChoicesOrCalculations, getFieldLabel, wrapString, truncateString} from '@/utils';
import LikertGraphOptions from './LikertGraphOptions.vue';

import { markRaw } from 'vue';

export default {
    name: 'LikertGraph',
    components: {
        LikertGraphOptions,
    },
    inject: ['module', 'data_dictionary', 'report'],
    props: {
        parameters: {
            type: Object,
            required: true
        },
        editorMode: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            title: this.parameters.title || "",
            description: this.parameters.description || "",
            graph: null,
            moreOptionsComponent: null,
        };
    },
    mounted() {
        this.updateGraph();

        this.moreOptionsComponent = markRaw(LikertGraphOptions);

        this.$nextTick(() => {
                this.updateGraph();
        });
    },
    methods: {
        updateParameters(parameters) {
            console.log(parameters);
            this.$emit('updateParameters', parameters);
            this.$nextTick(() => {
                this.updateGraph();
            });
        },
        updateGraph() {
            this.$refs.graphContainer.innerHTML = '';
            this.graph = this.getGraph.bind(this)();
            this.$refs.graphContainer.appendChild(this.graph);
        },
        getGraph() {
            console.log('getGraph');

            var this_report = this.report;

            var choices = stripChoicesOrCalculations(this.parameters.likert_choices);

            // Parse the choices or calculations
            
            // Get the field names
            var fieldNames = this.parameters.category_fields;

            // Get the field labels
            // var fieldLabels = this.parameters.category_fields.map(field => this.data_dictionary[field].field_label);

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == this.parameters.instrument; }.bind(this));

            



            // Create an array that for each pair of field and choice, contains the number of times that choice was selected for that field
            var getLikertCounts = function (report, fieldNames) {
                var likertCounts = [];
                for (var i = 0; i < fieldNames.length; i++) {
                    var fieldName = fieldNames[i];
                    var fieldChoices = Object.keys(choices);
                    if (this.parameters.na_category == 'keep') {
                        fieldChoices = ['', ...fieldChoices];
                    }

                    for (var choice of fieldChoices) {
                        var count = report.filter(function (d) { return d[fieldName] == choice; }).length;
                        likertCounts.push({ field: fieldName, choice: choice, count: count });
                    }
                }
                return likertCounts;
            }.bind(this);

            var likertCounts = getLikertCounts(filteredReport, fieldNames);

            // If there are some NA entries for the category in the filtered report
            if (likertCounts.some(d => d.choice == ""))
                // Add an NA category to choices
                choices[""] = this.module.tt("na");

            // Add a proportian field to each entry in likertCounts by field variable total and by data total
            var likertProportions = likertCounts.map(function (d) {
                var fieldTotal = likertCounts.filter(function (e) { return e.field == d.field; }).reduce(function (a, b) { return a + b.count; }, 0);
                var dataTotal = likertCounts.reduce(function (a, b) { return a + b.count; }, 0);
                return { variable: d.field, value: d.choice, count: d.count, variableProportion: d.count / fieldTotal, dataProportion: d.count / dataTotal };
            });


            

            console.log('likertProportions', likertProportions);
            // Get the choice codes
            const choiceCodes = Object.keys(choices);
            
            // Set the offset function for the bars
            // Calculate the offset based on the previous proportions for each variable

            // Create a map to store the previous proportions for each variable
            const map = {};
            const halfLength = Math.floor(choiceCodes.length / 2);

            for (let i = 0; i < choiceCodes.length; i++) {
                if (i < halfLength) {
                map[choiceCodes[i]] = -1;
                } else if (choiceCodes.length % 2 === 1 && i === halfLength) {
                map[choiceCodes[i]] = 0;
                } else {
                map[choiceCodes[i]] = 1;
                }
            }


            const offset = function (facetstacks, X1, X2, Z) {
                for (const stacks of facetstacks) {
                    for (const stack of stacks) {
                        const k =
                            d3.sum(stack, (i) => (X2[i] - X1[i]) * (1 - map[Z[i]])) / 2;
                        for (const i of stack) {
                            X1[i] -= k;
                            X2[i] -= k;
                        }
                    }
                }
            }
            // Create a function to interpolate between colors for each category
            var interpolateColors = d3.interpolateRgbBasis(this.parameters.palette_brewer ? this.parameters.palette_brewer : ['red', 'green', 'blue']);

            var colorScale = d3.scaleOrdinal()
                .domain(choiceCodes)
                .range(choiceCodes.map((d, i) => interpolateColors(i / (choiceCodes.length > 1 ? choiceCodes.length-1: 1))));

            // const x_title_size = parameters.x_title_size ? Number(parameters.x_title_size) : 15;
            // const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
            const y_label_limit = this.parameters.y_label_limit ? this.parameters.y_label_limit : null;
            const y_label_length = this.parameters.y_label_length ? Number(this.parameters.y_label_length) : Math.max(...choiceCodes.map(d => choices[d].length));
                
            // Get the x tick format
            var y_tick_format = d => getFieldLabel(this.data_dictionary[d]);

            // If x_label_limit is set to truncate, truncate the labels
            if (y_label_limit == 'truncate') {
                y_tick_format = d => truncateString(getFieldLabel(this.data_dictionary[d]), y_label_length);
            }
            // If x_label_limit is set to wrap, wrap the labels
            if (y_label_limit == 'wrap') {
                y_tick_format = d => wrapString(getFieldLabel(this.data_dictionary[d]), y_label_length);
            }

            console.log(y_tick_format);

            var show_legend = this.parameters.show_legend ? this.parameters.show_legend : false;

            const yAxisLabels = Plot.axisY({
                tickFormat: y_tick_format,
                tickSize: 0,
                tickRotate: this.parameters.y_rotate || this.parameters.y_rotate == 0 ? this.parameters.y_rotate : 0,
                fontSize: this.parameters.y_label_size || this.parameters.y_label_size == 0 ? this.parameters.y_label_size : 10,
            })

            return Plot.plot(   
            {
                width: 640,
                height: 480,
                x: { tickFormat: "%", label: "answers (%)" },
                y: { 
                    tickSize: 0, 
                    label: "",
                    tickFormat: () => '',
                 },
                // facet: { data: likertCounts, y: "variable" },
                color: { 
                    domain: Object.keys(choices), 
                    range: Object.keys(choices).map(d => colorScale(d)),
                    tickFormat: d => choices[d],
                    legend: show_legend,
                },
                marks: [
                Plot.barX(
                    likertProportions,
                    {
                        x: "variableProportion",
                        y: "variable",
                        fill: "value",
                        stroke: "white",
                        strokeWidth: 1,
                        offset: offset,
                        order: Object.keys(choices),
                    }
                ),
                Plot.textX(
                    likertProportions,
                    Plot.stackX(
                            {
                                x: "variableProportion",
                                y: "variable",
                                text: (d) => d.variableProportion ? d3.format(".0%")(d.variableProportion) : "",
                                z: "value",
                                fontSize: this.parameters.bar_label_size || this.parameters.bar_label_size == 0 ? this.parameters.bar_label_size : 10,
                                order: Object.keys(choices),
                                offset: offset,
                            }
                    ),
                ),
                yAxisLabels,
                ],
                marginLeft: this.parameters.left_margin || this.parameters.left_margin == 0  ? Number(this.parameters.left_margin) : 200,
            });
        }
    }
};
</script>

<style scoped>
    .AG-graph-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .AG-graphContainer {
        min-width: 640px;
        min-height: 480px;
        width: auto;
        height: auto;
    }
    .AG-graphContainer svg {
        max-width: unset !important;
    }
</style>