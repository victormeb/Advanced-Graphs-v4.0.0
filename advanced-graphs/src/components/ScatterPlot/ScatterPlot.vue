<!-- ScatterPlot.vue -->
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
//import * as d3Force from 'd3-force';
// import {PieChart} from "@d3/pie-chart";
// import {parseChoicesOrCalculations, isCheckboxField, getCheckboxReport, getFieldLabel, wrapString, truncateString} from '@/utils';
import {parseChoicesOrCalculations, getFieldLabel} from '@/utils';
// import {parseChoicesOrCalculations} from '@/utils';
import ScatterPlotOptions from './ScatterPlotOptions.vue';

import { markRaw } from 'vue';
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
            // if (( this.parameters.graph_type == 'scatter') || (this.parameters.graph_type == 'network')) {
            // }

            this.moreOptionsComponent = markRaw(ScatterPlotOptions);

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
            var choices = parseChoicesOrCalculations(this.data_dictionary[parameters.numeric_field]);

            var this_report = this.report;

            // If the category is a checkbox field, get a checkbox field report
            // if (isCheckboxField(parameters.categorical_field)) {
            //     this_report = getCheckboxReport(parameters.categorical_field);
            // }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == parameters.instrument; });

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (parameters.na_category == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field] != ''; });
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field_y] != ''; });
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[parameters.numeric_field] == ""))
                // Add an NA category to choices
                choices[""] = this.module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field] != ''; });
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field_y] != ''; });
            }

            //var barHeightFunction = function ( d) { return d[parameters.numeric_field]; };

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            // if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'replace') {
            //     barHeightFunction = function (d) { return d[parameters.numeric_field] == '' ? parameters.na_numeric_value : d[parameters.numeric_field]; };
            // }
            //
            // var counts = d3.rollup(filteredReport, v => v.length, d => d[parameters.categorical_field]);
            //
            //
            // // If we are not using a numeric field, get the counts for each category
            // if (!(parameters.is_count || parameters.numeric_field == '')) {
            //     counts = d3.rollup(filteredReport, v => d3[parameters.aggregation_function](v, barHeightFunction), d => d[parameters.categorical_field]);
            // }

            //var countKeys = Array.from(counts, ([key]) => key);

            //var domain = Object.keys(choices).filter(function (d) { return countKeys.includes(d); });

            // If unused_categories is set to keep, set the domain to all the choices
            // if (parameters.unused_categories == 'keep') {
            //     domain = Object.keys(choices);
            // }

            //var barHeights = Array.from(counts, ([key, value]) => ({key: key, value: value}));

            var xValues =   filteredReport.map((obj) => obj[parameters.numeric_field]);

            var yValues =   filteredReport.map((obj) => obj[parameters.numeric_field_y]);


            // Create a function to interpolate between colors for each category
            var interpolateColors = d3.interpolateRgbBasis(parameters.palette_brewer ? parameters.palette_brewer : ['red', 'green', 'blue']);
            //
            var colorScale = d3.scaleSequential()
                .domain([1, 100])
                .interpolator(interpolateColors);

            // d3.scaleLinear()
            //     .domain([d3.min(yValues), d3.max(yValues)])
            //     .range(interpolateColors(0,  1));  //d3.scaleOrdinal();
            //     .domain(domain)
            //     .range(domain.map((d, i) => interpolateColors(i / (domain.length > 1 ? domain.length-1: 1))));
                const x_title_size = parameters.x_title_size ? Number(parameters.x_title_size) : 15;
                const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
                // const x_label_limit = parameters.x_label_limit ? parameters.x_label_limit : null;
                const x_label_length = parameters.x_label_length; //? Number(parameters.x_label_length) : Math.max(...domain.map(d => choices[d].length));

            // Get the x tick format
            // var x_tick_format = d => choices[d];

            // If x_label_limit is set to truncate, truncate the labels
            // if (x_label_limit == 'truncate') {
            //     x_tick_format = d => truncateString(choices[d], x_label_length);
            // }
            // // If x_label_limit is set to wrap, wrap the labels
            // if (x_label_limit == 'wrap') {
            //     x_tick_format = d => wrapString(choices[d], x_label_length);
            // }
            //
            const x_rotate = parameters.x_rotate ; //|| parameters.x_rotate == 0 ? Number(parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / domain.length ? 90 : 0;
            const x_title_offset = parameters.x_title_offset ? Number(parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size + 20;
            const bottom_margin = parameters.bottom_margin ? Number(parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180)*0.5 + x_title_size * 2 + 20;

            const y_title_size = parameters.y_title_size ? Number(parameters.y_title_size) : 15;
            const y_label_size = parameters.y_label_size ? Number(parameters.y_label_size) : 10;
            // const y_label_limit = parameters.y_label_limit ? parameters.y_label_limit : null;
            // const y_label_length = parameters.y_label_length ; //? Number(parameters.y_label_length) : Math.max(...domain.map(d => choices[d].length));

            // Get the y tick format
            // var y_tick_format = d => d;

            // If y_label_limit is set to truncate, truncate the labels
            // if (y_label_limit == 'truncate') {
            //     y_tick_format = d => truncateString(d, y_label_length);
            // }
            // // If y_label_limit is set to wrap, wrap the labels
            // if (y_label_limit == 'wrap') {
            //     y_tick_format = d => wrapString(d, y_label_length);
            // }

            // If y_label_limit is a string and not truncate or wrap, use it as the tick format
            // if (typeof y_label_limit != 'undefined' && y_label_limit != 'truncate' && y_label_limit != 'wrap' && y_label_limit != null) {
            //     y_tick_format = d => d3.format(y_label_limit)(d);
            // }

            //
            const y_rotate = parameters.y_rotate ? Number(parameters.y_rotate) : 0;
            const y_title_offset = parameters.y_title_offset ? Number(parameters.y_title_offset) : 45;

            // const bar_label_size = parameters.bar_label_size ? Number(parameters.bar_label_size) : 10;
            // const bar_label_position = parameters.bar_label_position ? Number(parameters.bar_label_position) : 0.5;
            //
            // const show_legend = parameters.show_legend ? true : false;

            // const y_title = parameters.numeric_field ?  getFieldLabel(this.data_dictionary[parameters.numeric_field]) + ' ' + this.module.tt(parameters.aggregation_function): this.module.tt('count')
            const y_title =  getFieldLabel(this.data_dictionary[parameters.numeric_field_y]);  // parameters.numeric_field_y;// ?  + ' ' + this.module.tt(parameters.aggregation_function): this.module.tt('count'

            var graph = null;

            const xAxisLabels = Plot.axisX( {
                //domain: domain,
                type: 'band',
                // tickFormat: x_tick_format,
                tickRotate:  x_rotate,
                fontSize: x_label_size,
                label: null,
            });

            // Create x axis title
            const xAxisTitle = Plot.axisX({
                //domain: domain,
                type: 'band',
                label:  getFieldLabel(this.data_dictionary[parameters.numeric_field]),
                labelOffset: x_title_offset,
                tick: null,
                tickFormat: () => '',
                fontSize: x_title_size
            });

            // Create y axis labels
            const yAxisLabels = Plot.axisY({
                label: null,
                // tickFormat: y_tick_format,
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

            if (xValues.length !== yValues.length) {
                throw new Error("xValues and yValues must have the same length.");
            }

            const data = xValues.map((x, i) => ({ x, y: yValues[i] }));

            //const square = d3.symbol().type(d3.symbolSquare).size(164);


            //In Observable Plot, you can use the Plot.mark function to create custom markers for your scatterplot. To use square or triangle markers instead of circular dots, you can define a custom SVG path and use it as the shape of the markers.

            // Square marker
            //const squarePath = "M -5 -5 L 5 -5 L 5 5 L -5 5 Z";

            // Triangle marker
            //const trianglePath = "M 0 -5 L 5 5 L -5 5 Z";

            let dotPlot = Plot.dot(data, {
                x: "x",
                y: "y",
                r: parameters.scatter_dot_size,
                fill: colorScale(parameters.scatter_dot_color*10)
            });

            let squarePlot = Plot.vector(data, {
                x: "x",
                y: "y",
                //x2: "x" ,
                //y2: "y"
                r: parameters.scatter_dot_size+1,
                length: parameters.scatter_dot_size+1,
                //d: trianglePath, //squarePath,
                shape: "spike", //square,
                anchor: "start",

                fill: colorScale(parameters.scatter_dot_color*10)
            });
            let squarePlot2 = Plot.vector(data, {
                x: "x",
                y: "y",
                //x2: "x" ,
                //y2: "y"
                r: parameters.scatter_dot_size+1,
                length: parameters.scatter_dot_size+1,
                rotate: 180,
                //d: trianglePath, //squarePath,
                shape: "spike", //square,
                anchor: "start",

                fill: colorScale(parameters.scatter_dot_color*10)
            });

            let trianglePlot = Plot.vector(data, {
                x: "x",
                y: "y",
                //x2: "x" ,
                //y2: "y"
                r: parameters.scatter_dot_size+1,
                length: parameters.scatter_dot_size+1,
                //d: trianglePath, //squarePath,
                shape: "spike", //square,
                anchor: "start",

                fill: colorScale(parameters.scatter_dot_color*10)
            });
            console.log("yAxisLabels")
            console.log(yAxisLabels)
            //calc min and max of x axis
            let minx = Math.min(...xValues);
            let maxx = Math.max(...xValues);
            let domainX = [minx, maxx];
            let miny = Math.min(...yValues);
            let maxy = Math.max(...yValues);
            let domainY = [miny, maxy];
            graph = Plot.plot({
                marks: [ (parameters.marker_type == "circle")? dotPlot :
                    (parameters.marker_type == "square")?squarePlot:squarePlot,
                    (parameters.marker_type == "square")?squarePlot2:trianglePlot,
                            yAxisTitle,
                            yAxisLabels,
                            xAxisTitle,
                            xAxisLabels,
                ],
                    marginBottom: bottom_margin,
                    marginLeft: parameters.left_margin ? parameters.left_margin : 80,
                x: {
                    //label: getFieldLabel(this.data_dictionary[parameters.numeric_field]),
                    domain: domainX,
                    //tickRotate: x_rotate,
                },
                y: {
                    label: '',
                    domain: domainY,
                },
            });
            console.log("xAxisTitle",xAxisTitle)
            // return scatterplot;
            return graph;
        },

        Scatterplot(xValues, yValues) {
          if (xValues.length !== yValues.length) {
            throw new Error("xValues and yValues must have the same length.");
          }


            const width = 500;
            const height = 500;
            const margin = { top: 20, right: 20, bottom: 30, left: 40 };

            const data = xValues.map((x, i) => ({ x, y: yValues[i] }));

            const xScale = d3.scaleLinear()
                .domain([d3.min(xValues), d3.max(xValues)])
                .range([margin.left, width - margin.right]);

            const yScale = d3.scaleLinear()
                .domain([d3.min(yValues), d3.max(yValues)])
                .range([height - margin.bottom, margin.top]);

            const xAxis = d3.axisBottom(xScale);
            const yAxis = d3.axisLeft(yScale);

            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height);

            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(xAxis);

            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(yAxis);

            svg.selectAll("circle")
                .data(data)
                .join("circle")
                .attr("cx", (d) => xScale(d.x))
                .attr("cy", (d) => yScale(d.y))
                .attr("r", 3)
                .attr("fill", "steelblue");
            return svg.node();
          //   return Object.assign(svg.node());

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
