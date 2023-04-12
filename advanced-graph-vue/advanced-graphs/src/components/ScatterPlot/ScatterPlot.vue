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
import * as d3Force from 'd3-force';
// import {PieChart} from "@d3/pie-chart";
import {parseChoicesOrCalculations, isCheckboxField, getCheckboxReport, getFieldLabel, wrapString, truncateString} from '@/utils';
import ScatterPlotOptions from './ScatterPlotOptions.vue';

//import { markRaw } from 'vue';
//import ScatterPlot from "@/components/ScatterPlot/ScatterPlot.vue";

export default {
    name: 'ScatterPlot',
    components: {
        ScatterPlotOptions,
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
            // if (this.parameters.graph_type == 'bar') {
            //     this.moreOptionsComponent = markRaw(BarGraphOptions);
            // }

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
            var choices = parseChoicesOrCalculations(this.data_dictionary[parameters.categorical_field]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            if (isCheckboxField(parameters.categorical_field)) {
                this_report = getCheckboxReport(parameters.categorical_field);
            }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == parameters.instrument; });

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (parameters.na_category == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.categorical_field] != ''; });
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[parameters.categorical_field] == ""))
                // Add an NA category to choices
                choices[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field] != ''; });
            }

            var barHeightFunction = function (d) { return d[parameters.numeric_field]; };

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'replace') {
                barHeightFunction = function (d) { return d[parameters.numeric_field] == '' ? parameters.na_numeric_value : d[parameters.numeric_field]; };
            }

            var counts = d3.rollup(filteredReport, v => v.length, d => d[parameters.categorical_field]);


            // If we are not using a numeric field, get the counts for each category
            if (!(parameters.is_count || parameters.numeric_field == '')) {
                counts = d3.rollup(filteredReport, v => d3[parameters.aggregation_function](v, barHeightFunction), d => d[parameters.categorical_field]);
            }

            var countKeys = Array.from(counts, ([key]) => key);

            var domain = Object.keys(choices).filter(function (d) { return countKeys.includes(d); });

            // If unused_categories is set to keep, set the domain to all the choices
            if (parameters.unused_categories == 'keep') {
                domain = Object.keys(choices);
            }

            var barHeights = Array.from(counts, ([key, value]) => ({key: key, value: value}));

            // Create a function to interpolate between colors for each category
            var interpolateColors = d3.interpolateRgbBasis(parameters.palette_brewer ? parameters.palette_brewer : ['red', 'green', 'blue']);
        
            var colorScale = d3.scaleOrdinal()
                .domain(domain)
                .range(domain.map((d, i) => interpolateColors(i / (domain.length > 1 ? domain.length-1: 1))));
                const x_title_size = parameters.x_title_size ? Number(parameters.x_title_size) : 15;
                const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
                const x_label_limit = parameters.x_label_limit ? parameters.x_label_limit : null;
                const x_label_length = parameters.x_label_length ? Number(parameters.x_label_length) : Math.max(...domain.map(d => choices[d].length));
                
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
            
            const x_rotate = parameters.x_rotate || parameters.x_rotate == 0 ? Number(parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / domain.length ? 90 : 0;
            const x_title_offset = parameters.x_title_offset ? Number(parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size + 20;
            const bottom_margin = parameters.bottom_margin ? Number(parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size * 2 + 20;
            
            const y_title_size = parameters.y_title_size ? Number(parameters.y_title_size) : 15;
            const y_label_size = parameters.y_label_size ? Number(parameters.y_label_size) : 10;
            const y_label_limit = parameters.y_label_limit ? parameters.y_label_limit : null;
            const y_label_length = parameters.y_label_length ? Number(parameters.y_label_length) : Math.max(...barHeights.map(d => d.value.toString().length));
            
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


            const y_rotate = parameters.y_rotate ? Number(parameters.y_rotate) : 0;
            const y_title_offset = parameters.y_title_offset ? Number(parameters.y_title_offset) : 45;

            const bar_label_size = parameters.bar_label_size ? Number(parameters.bar_label_size) : 10;
            const bar_label_position = parameters.bar_label_position ? Number(parameters.bar_label_position) : 0.5;

            const show_legend = parameters.show_legend ? true : false;

            const y_title = parameters.numeric_field ?  getFieldLabel(this.data_dictionary[parameters.numeric_field]) + ' ' + this.module.tt(parameters.aggregation_function): this.module.tt('count')

            var graph = null;

            // If the graph type is bar
            if (parameters.graph_type == 'bar') {     
                

                // Create x axis labels
                const xAxisLabels = Plot.axisX(domain, {
                    domain: domain,
                    type: 'band',
                    tickFormat: x_tick_format,
                    tickRotate:  x_rotate,
                    fontSize: x_label_size, 
                });

                // Create x axis title
                const xAxisTitle = Plot.axisX({
                    domain: domain,
                    type: 'band',
                    label:  getFieldLabel(this.data_dictionary[parameters.categorical_field]),
                    labelOffset: x_title_offset,
                    ticks: null,
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

                // Create a bar chart
                const bars = Plot.barY(barHeights, {
                    domain: domain,
                    x: d => d.key,
                    y: 'value',
                    fill: d=>colorScale(d.key)
                });

                // Create bar labels
                const barLabels = Plot.text(barHeights, {
                    x: d => d.key,
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
                        domain: domain,
                        type: 'band'
                    },
                    y: {
                        type: 'linear'
                    },
                    color: {
                        type: 'categorical',
                        domain: domain.map(d => choices[d]),
                        range: domain.map(d => colorScale(d)),
                        title: getFieldLabel(this.data_dictionary[parameters.categorical_field]),
                        format: x_tick_format,
                        legend: show_legend
                    },
                    marks: [
                        yAxisTitle,
                        yAxisLabels,
                        xAxisTitle,
                        xAxisLabels,
                        bars,
                        barLabels,
                        // legend
                    ],
                    marginLeft: parameters.left_margin ? parameters.left_margin : 80,
                    marginBottom: bottom_margin
                });

                return graph;
            } else if (parameters.graph_type == 'pie') {
                const label_spacing = parameters.label_spacing ? Number(parameters.label_spacing) : 0.1;
                const label_size = parameters.label_size ? Number(parameters.label_size) : 10;
                const value_size = parameters.value_size ? Number(parameters.value_size) : 10;
                const value_precision = parameters.value_precision ? parameters.value_precision : '1';
                const seperation_force = parameters.seperation_force ? Number(parameters.seperation_force) : 28;
                const seperation_strength = parameters.seperation_strength ? Number(parameters.seperation_strength) : 1.1;
                const seperation_iterations = parameters.seperation_iterations ? Number(parameters.seperation_iterations) : 50;
                // Create a pie chart
                graph = this.PieChart(barHeights, {
                    width: 640,
                    height: 480,
                    innerRadius: 0,
                    outerRadius: Math.min(640, 400) / 2,
                    title: d => x_tick_format(d.key) + '\n' + d.value,
                    value: d => d.value,
                    name: d => choices[d.key],
                    displayLegend: show_legend,
                    categoryName: getFieldLabel(this.data_dictionary[parameters.categorical_field]),
                    numericName: y_title,
                    colors: colorScale,
                    spacing: label_spacing,
                    labelFont: label_size,
                    valueFont: value_size,
                    precision: value_precision + '',
                    separationForce: seperation_force,
                    separationStrength: seperation_strength,
                    separationIterations: seperation_iterations
                });

                return graph;

            }

            // Return a paragraph tag element with the error message
            var errorDiv = document.createElement('p');
            errorDiv.innerHTML = this.module.tt('Pie charts are not supported in this version of the module.');
            return errorDiv;
        },
        // Copyright 2021 Observable, Inc.
        // Released under the ISC license.
        // https://observablehq.com/@d3/pie-chart
        PieChart(data, {
            name = ([x]) => x,  // given d in data, returns the (ordinal) label
            value = ([, y]) => y, // given d in data, returns the (quantitative) value
            categoryName = "Category", // the name of the category dimension
            numericName = "Value", // the name of the numeric dimension
            title, // given d in data, returns the title text
            displayLegend = true, // whether to show a legend
            width = 640, // outer width, in pixels
            height = 400, // outer height, in pixels
            innerRadius = 0, // inner radius of pie, in pixels (non-zero for donut)
            outerRadius = Math.min(width, height) / 2, // outer radius of pie, in pixels
            labelRadius = (innerRadius * 0.2 + outerRadius * 0.8), // center radius of labels
            format = ",", // a foe =rmat specifier for values (in the label)
            names, // array of names (the domain of the color scale)
            colors, // array of colors for names
            stroke = innerRadius > 0 ? "none" : "white", // stroke separating widths
            strokeWidth = 1, // width of stroke separating wedges
            strokeLinejoin = "round", // line join of stroke separating wedges
            padAngle = stroke === "none" ? 1 / outerRadius : 0, // angular separation between wedges
            spacing = 0, // Adjust this value to change the space between the first n-1 lines and the last line
            precision = 1, // Adjust this value to change the precision for the last line
            labelFont = 10, // Adjust this value to change the font size of the first n-1 lines
            valueFont = 12, // Adjust this value to change the font size of the last line
            separationForce = 28, // Adjust this value to change the seperation force between the first n-1 lines and the last line
            separationIterations = 50, // Adjust this value to change the number of iterations for the seperation force
            separationStrength = 1.1, // Adjust this value to change the strength of the seperation force
            } = {}) {
            // Compute values.
            const N = d3.map(data, name);
            const V = d3.map(data, value);
            const I = d3.range(N.length).filter(i => !isNaN(V[i]));

            // Unique the names.
            if (names === undefined) names = N;
            names = new d3.InternSet(names);

            // Chose a default color scheme based on cardinality.
            // if (colors === undefined) colors = d3.schemeSpectral[names.size];
            // if (colors === undefined) colors = d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), names.size);

            // Construct scales.
            const color = colors;

            // Compute titles.
            if (title === undefined) {
                const formatValue = d3.format(format);
                title = i => `${N[i]}\n${formatValue(V[i])}`;
            } else {
                const O = d3.map(data, d => d);
                const T = title;
                title = i => T(O[i], i, data);
            }

            // Construct arcs.
            const arcs = d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I);
            const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
            const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);
            
            // Construct the SVG.
            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [-width / 2, -height / 2, width, height])
                // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

            // Add the pie chart.
            svg.append("g")
                .attr("stroke", stroke)
                .attr("stroke-width", strokeWidth)
                .attr("stroke-linejoin", strokeLinejoin)
                .selectAll("path")
                .data(arcs)
                .join("path")
                .attr("fill", d => color(N[d.data]))
                .attr("d", arc)
                .append("title")
                .text(d => title(d.data));

            // Seperate the labels
            const simulation = d3Force.forceSimulation(arcs)
                .force("x", d3Force.forceX(d => arcLabel.centroid(d)[0]).strength(separationStrength))
                .force("y", d3Force.forceY(d => arcLabel.centroid(d)[1]).strength(separationStrength))
                .force("collide", d3Force.forceCollide(separationForce))
                .stop();

            // Run the simulation for a fixed number of iterations
            for (let i = 0; i < separationIterations; ++i) {
                simulation.tick();
            }

            // Add the labels.
            svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "middle")
                .selectAll("text")
                .data(arcs)
                .join("text")
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .selectAll("tspan")
                .data(d => `${title(d.data)}`.split(/\n/))
                .join("tspan")
                .attr("x", 0)
                .attr("y", (_, i, nodes) => `${i * 1.1 + (i === nodes.length - 1 ? spacing : 0)}em`)
                .attr("font-weight", (_, i, nodes) => i === nodes.length - 1 ? null : "bold")
                .attr("font-size", (_, i, nodes) => i === nodes.length - 1 ? valueFont : labelFont)
                .text((d, i, nodes) => i === nodes.length - 1 ? Number(Math.round(Number(d) / Number(precision)) * Number(precision)).toFixed(precision.includes('.') ? precision.split('.')[1].length : 0) : d);


            // Add legend
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${outerRadius}, ${-height / 2 + 30})`);

            // Add the category name to the legend
            legend.append("text")
                .attr("class", "legend-title")
                .attr("y", -10)
                .attr("x", 0)
                .attr("font-weight", "bold")
                .attr("font-size", 25)
                .text(categoryName)
                
            const legendItems = legend.selectAll(".legend-item")
                .data(arcs)
                // .data(d => `${title(d.data)}`)
                .join("g")
                .attr("class", "legend-item")
                .attr("transform", (_, i) => `translate(0, ${i * 20})`);


            legendItems.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", (_) => color(_));

            legendItems.append("text")
                .data(arcs)
                .attr("x", 15)
                .attr("y", 10)
                // Get the name of the legend item
                .text((d) => `${title(d.data)}`.split(/\n/).slice(0, -1).join(' '))

            // Hide the legend if the displayLegend is false
            if (!displayLegend) {
                legend.style("display", "none");
                numericName += " " + categoryName;
            } else {
                // shift the pie chart to the left
                svg.attr("transform", `translate(${-outerRadius/2}, 0)`);
            }

            // Add the numeric title to the center of the chart
            svg.append("text")
                .attr("class", "numeric-title")
                .attr("text-anchor", "middle")
                .attr("y", -outerRadius - 10)
                .attr("x", 0)
                .attr("font-weight", "bold")
                .attr("font-size", 25)
                .text(numericName)


            return Object.assign(svg.node(), {scales: {color}});
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