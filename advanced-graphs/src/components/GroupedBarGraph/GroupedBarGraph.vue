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
// import {PieChart} from "@d3/pie-chart";
// import {map, flatMap} from "d3-array";
import {parseChoicesOrCalculations, /*isCheckboxField, getCheckboxReport,*/ getFieldLabel, wrapString, truncateString} from '@/utils';
import GroupedBarGraphOptions from './GroupedBarGraphOptions.vue';
import StackedBarGraphOptions from './StackedBarGraphOptions.vue';

import { markRaw } from 'vue';

export default {
    name: 'BarGraph',
    components: {
        GroupedBarGraphOptions,
        StackedBarGraphOptions,
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
        try {
            if (this.parameters.graph_type == 'stacked') {
                this.moreOptionsComponent = markRaw(StackedBarGraphOptions);
            } 
            else if (this.parameters.graph_type == 'grouped') {
                this.moreOptionsComponent = markRaw(GroupedBarGraphOptions);
            }
            // wait until the moreOptionsComponent updates the parameters before updating the graph
            this.$nextTick(() => {
                this.updateGraph();
            });
            // this.graph = this.getGraph.bind(this)(this.parameters);
            // this.$refs.graphContainer.appendChild(this.graph);
        } catch (e) {
            console.error(e);
        }
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
            this.graph = this.getGraph.bind(this)(this.parameters);
            this.$refs.graphContainer.appendChild(this.graph);
        },
        getGraph(parameters) {
            // Get the choices for the category
            var choices_one = parseChoicesOrCalculations(this.data_dictionary[parameters.categorical_field_one]);
            var choices_two = parseChoicesOrCalculations(this.data_dictionary[parameters.categorical_field_two]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            // if (isCheckboxField(parameters.categorical_field_one)) {
            //     this_report = getCheckboxReport(parameters.categorical_field_one);
            // }

            // if (isCheckboxField(parameters.categorical_field_one)) {
            //     this_report = getCheckboxReport(parameters.categorical_field_one);
            // }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == parameters.instrument; });

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (parameters.na_category_one == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.categorical_field_one] != ''; });
            }

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (parameters.na_category_two == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.categorical_field_two] != ''; });
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[parameters.categorical_field_one] == ""))
                // Add an NA category to choices
                choices_one[""] = this.module.tt("na");
            
            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[parameters.categorical_field_two] == ""))
                // Add an NA category to choices
                choices_two[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field] != ''; });
            }

            var barHeightFunction = function (d) { return d[parameters.numeric_field]; };

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[parameters.numeric_field] == '' ? parameters.na_numeric_value : d[parameters.numeric_field]; };
            }

            var countsNested = d3.rollup(filteredReport, v => v.length, d => d[parameters.categorical_field_one], d => d[parameters.categorical_field_two]);


            // If we are not using a numeric field, get the counts for each category
            if (!(parameters.is_count || parameters.numeric_field == '')) {
                countsNested = d3.rollup(filteredReport, v => d3[parameters.aggregation_function](v, barHeightFunction), d => d[parameters.categorical_field_one], d => d[parameters.categorical_field_two]);
            }

            // const countsFlattened = flatMap(countsNested, ([category, typeMap]) => {
            //     return map(typeMap, (type, value) => ({category, type, value}));
            // });

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

            console.log("countsFlattened", countsFlattened);

            // var countKeys = Array.from(countsNested, ([key]) => key);
            var barDomain = Object.keys(choices_one);

            var colorDomain = Object.keys(choices_two);

            // Get the bar domain from the categories in countsFlattened
            // var barDomain = Array.from(new Set(countsFlattened.map(d => d.category)));

            // Get the color domain from the types in countsFlattened
            // var colorDomain = Array.from(new Set(countsFlattened.map(d => d.type)));

            // If unused_categories_one is set to drop, set the domain of the bars to the categories in countsFlattened ordered by the order of choices
            if (parameters.unused_categories_one == 'drop') {
                barDomain = barDomain.filter(d => countsFlattened.some(e => e.category == d));
            }            
            
            // If unused_categories_two is set to drop, set the domain of the stacks to the categories in countsFlattened ordered by the order of choices
            if (parameters.unused_categories_two == 'drop') {
                colorDomain = colorDomain.filter(d => countsFlattened.some(e => e.type == d));
            }

            // var barHeights = Array.from(counts, ([key, value]) => ({key: key, value: value}));

            // Create a function to interpolate between colors for each category
            var interpolateColors = d3.interpolateRgbBasis(parameters.palette_brewer ? parameters.palette_brewer : ['red', 'green', 'blue']);
        
            var colorScale = d3.scaleOrdinal()
                .domain(colorDomain)
                // .range(["steelblue", "orange"]);
                .range(colorDomain.map((d, i) => interpolateColors(i / (colorDomain.length > 1 ? colorDomain.length-1: 1))));

            const x_title_size = parameters.x_title_size ? Number(parameters.x_title_size) : 15;
            const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
            const x_label_limit = parameters.x_label_limit ? parameters.x_label_limit : null;
            const x_label_length = parameters.x_label_length ? Number(parameters.x_label_length) : Math.max(...barDomain.map(d => choices_one[d].length));
                
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
            
            const x_rotate = parameters.x_rotate || parameters.x_rotate == 0 ? Number(parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / barDomain.length ? 90 : 0;
            const x_title_offset = parameters.x_title_offset ? Number(parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size + 20;
            const bottom_margin = parameters.bottom_margin ? Number(parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size * 2 + 20;
            
            const y_title_size = parameters.y_title_size ? Number(parameters.y_title_size) : 15;
            const y_label_size = parameters.y_label_size ? Number(parameters.y_label_size) : 10;
            const y_label_limit = parameters.y_label_limit ? parameters.y_label_limit : null;
            const y_label_length = parameters.y_label_length ? Number(parameters.y_label_length) : Math.max(...countsFlattened.map(d => d.category.toString().length));
            
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


            const y_rotate = parameters.y_rotate ? Number(parameters.y_rotate) : 0;
            const y_title_offset = parameters.y_title_offset ? Number(parameters.y_title_offset) : 45;

            const bar_label_size = parameters.bar_label_size ? Number(parameters.bar_label_size) : 10;
            const bar_label_position = parameters.bar_label_position ? Number(parameters.bar_label_position) : 0.5;

            const show_legend = parameters.show_legend ? true : false;

            const y_title = parameters.numeric_field ?  getFieldLabel(this.data_dictionary[parameters.numeric_field]) + ' ' + this.module.tt(parameters.aggregation_function): this.module.tt('count')

            var graph = null;

            // Create x axis labels
            var xAxisLabels = Plot.axisX(barDomain, {
                domain: barDomain,
                type: 'band',
                tickFormat: x_tick_format,
                tickRotate:  x_rotate,
                fontSize: x_label_size,
            });

            // Create x axis title
            const xAxisTitle = Plot.axisX({
                domain: barDomain,
                type: 'band',
                label:  getFieldLabel(this.data_dictionary[parameters.categorical_field_one]),
                labelOffset: x_title_offset,
                tick: null,
                tickFormat: null,
                fontSize: x_title_size
            });

            // Create y axis labels
            const yAxisLabels = Plot.axisY({
                label: null,
                tickFormat: y_tick_format,
                tickRotate: y_rotate,
                fontSize: y_label_size
            });

            // Create y axis title
            const yAxisTitle = Plot.axisY({
                label: y_title,
                labelAnchor: 'center',
                labelOffset: y_title_offset,
                fontSize: y_title_size,
                tick: null,
                tickFormat: () => ''
            });

            // Create bar labels
            var barLabels = Plot.text(
            // Create an array of the total value for each category
            countsFlattened.reduce((acc, d) => {
                const existing = acc.find(a => a.category === d.category);
                if (existing) {
                    existing.value += d.value;
                } else {
                    acc.push({ category: d.category, value: d.value });
                }
                return acc;
            }, []),
            {
                x: d => d.category,
                y: d => d.value,
                dx: 0,
                dy: -bar_label_position, // Adjust the vertical position of the labels relative to the bars
                textAnchor: "middle",
                fontSize: bar_label_size, // Set the font size for the bar labels
                text: d => y_tick_format(d.value)
            });

            // If the graph type is bar
            if (parameters.graph_type == 'stacked') {     
                // Create a bar chart
                const stackedBars = Plot.barY(countsFlattened, {
                    domain: barDomain,
                    x: d => d.category,
                    y: 'value',
                    fill: d => colorScale(d.type),

                });
                console.log("colorDomain", colorDomain);
                graph = Plot.plot({
                    width: 640,
                    height: 480,
                    x: {
                        domain: barDomain,
                        type: 'band'
                    },
                    y: {
                        type: 'linear'
                    },
                    color: {
                        type: 'ordinal',
                        domain: colorDomain.map(d => choices_two[d]),
                        range: colorDomain.map(d => colorScale(d)),
                        title: getFieldLabel(this.data_dictionary[parameters.categorical_field_two]),
                        format: x_tick_format,
                        legend: show_legend ? true : false,
                    },
                    marks: [
                        yAxisTitle,
                        yAxisLabels,
                        xAxisTitle,
                        xAxisLabels,
                        stackedBars,
                        barLabels,
                    ],
                    marginLeft: parameters.left_margin ? parameters.left_margin : 80,
                    marginBottom: bottom_margin
                });

                return graph;
            } else if (parameters.graph_type == 'grouped') {
                // Create a bar chart
                const groupedBars = Plot.barY(countsFlattened, {
                    domain: barDomain,
                    x: d => d.type,
                    y: 'value',
                    fill: d => colorScale(d.type),
                    width: 0.8
                });

                const color_label_length = parameters.color_label_length ? Number(parameters.color_label_length) : Math.max(...colorDomain.map(d => choices_two[d].toString().length));

                var color_tick_format = d => choices_two[d];

                if (parameters.color_tick_limit == 'truncate') {
                    color_tick_format = d => truncateString(choices_two[d], color_label_length)
                } else if (parameters.color_tick_limit == 'wrap') {
                    color_tick_format = d => wrapString(choices_two[d], color_label_length)
                }

                const color_label_rotate = parameters.color_label_rotate ? Number(parameters.color_label_rotate) : 0;
                const color_label_size = parameters.color_label_size ? Number(parameters.color_label_size) : 10;

                console.log(color_label_size,color_label_rotate);
                xAxisLabels = Plot.axisX(colorDomain, {
                    domain: colorDomain,
                    type: 'band',
                    tickFormat: color_tick_format,
                    tickRotate:  color_label_rotate,
                    fontSize: color_label_size,
                });

                barLabels = Plot.text(
                    countsFlattened,
                    {
                        x: d => d.type,
                        y: d => d.value,
                        dx: 0,
                        dy: -bar_label_position, // Adjust the vertical position of the labels relative to the bars
                        textAnchor: "middle",
                        fontSize: bar_label_size, // Set the font size for the bar labels
                        text: d => y_tick_format(d.value)
                    });
                
                graph = Plot.plot({
                    width: 640,
                    height: 480,
                    x: {
                        domain: colorDomain,
                        type: 'band'
                    },
                    y: {
                        type: 'linear'
                    },
                    color: {
                        type: 'ordinal',
                        domain: colorDomain.map(d => choices_two[d]),
                        range: colorDomain.map(d => colorScale(d)),
                        title: getFieldLabel(this.data_dictionary[parameters.categorical_field_two]),
                        format: x_tick_format,
                        legend: show_legend
                    },
                    facet: {
                        data: countsFlattened,
                        x: d => d.category,
                    },
                    fx: {
                        tickFormat: x_tick_format,
                    },
                    marks: [
                        yAxisTitle,
                        yAxisLabels,
                        xAxisTitle,
                        xAxisLabels,
                        groupedBars,
                        barLabels,
                    ],
                    marginLeft: parameters.left_margin ? parameters.left_margin : 80,
                    marginBottom: bottom_margin
                });
                    d3.select(graph).attr('font-size', x_label_size);
                    
                return graph;
            }

            // Return a paragraph tag element with the error message
            var errorDiv = document.createElement('p');
            errorDiv.innerHTML = 'Pie charts are not supported in this version of the module.';
            return errorDiv;
        },
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