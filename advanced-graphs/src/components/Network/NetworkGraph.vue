<!-- NetworkGraph.vue -->
<template>
  <div class="AG-graph-container">
    <div class="AG-graph-title">
      <h3>{{ parameters.title || "" }}</h3>
    </div>
    <div ref="graphContainer" class="AG-graphContainer"></div>
    <div class="AG-graph-description">
      <p>{{ parameters.description || "" }}</p>
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
import NetworkGraphOptions from './NetworkGraphOptions.vue';

import {markRaw} from 'vue';

export default {
  name: 'NetworkGraph',
  components: {
    NetworkGraphOptions,
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
      if ((this.parameters.graph_type == 'network_graph')) {
        this.moreOptionsComponent = markRaw(NetworkGraphOptions);
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
      var choices = parseChoicesOrCalculations(this.data_dictionary[parameters.numeric_field]);

      var this_report = this.report;

      // If the category is a checkbox field, get a checkbox field report
      // if (isCheckboxField(parameters.categorical_field)) {
      //     this_report = getCheckboxReport(parameters.categorical_field);
      // }

      // Get a dataframe that only has entries for the instrument specified by the instrument parameter
      var filteredReport = this_report.filter(function (d) {
        return d['redcap_repeat_instrument'] == parameters.instrument;
      });

      // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
      if (parameters.na_category == 'drop') {
        filteredReport = filteredReport.filter(function (d) {
          return d[parameters.numeric_field] != '';
        });
        filteredReport = filteredReport.filter(function (d) {
          return d[parameters.numeric_field_y] != '';
        });
      }

      // If there are some NA entries for the category in the filtered report
      if (filteredReport.some(d => d[parameters.numeric_field] == ""))
        // Add an NA category to choices
        choices[""] = this.module.tt("na");

      // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
      if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'drop') {
        filteredReport = filteredReport.filter(function (d) {
          return d[parameters.numeric_field] != '';
        });
        filteredReport = filteredReport.filter(function (d) {
          return d[parameters.numeric_field_y] != '';
        });
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

      var xValues = filteredReport.map((obj) => obj[parameters.numeric_field]);

      var yValues = filteredReport.map((obj) => obj[parameters.numeric_field_y]);


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
      const x_title_size = 15; //parameters.x_title_size ? Number(parameters.x_title_size) : 15;
      const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
      // const x_label_limit = parameters.x_label_limit ? parameters.x_label_limit : null;
      // const x_label_length = parameters.x_label_length; //? Number(parameters.x_label_length) : Math.max(...domain.map(d => choices[d].length));

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
      const x_rotate = parameters.x_rotate; //|| parameters.x_rotate == 0 ? Number(parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / domain.length ? 90 : 0;
      const x_title_offset = parameters.x_title_offset ; //? Number(parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180) * 0.5 + x_title_size + 20;
      //const bottom_margin = parameters.bottom_margin ? Number(parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180) * 0.5 + x_title_size * 2 + 20;

      const y_title_size = 0; //parameters.y_title_size ? Number(parameters.y_title_size) : 15;
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
      const y_title = getFieldLabel(this.data_dictionary[parameters.numeric_field_y]);  // parameters.numeric_field_y;// ?  + ' ' + this.module.tt(parameters.aggregation_function): this.module.tt('count')

      var graph = null;

      // Create x axis labels
      // eslint-disable-next-line no-unused-vars
      const xAxisLabels = Plot.axisX({
        //domain: domain,
        type: 'band',
        // tickFormat: x_tick_format,
        tickRotate: x_rotate,
        fontSize: x_label_size,
      });

      // Create x axis title
      // eslint-disable-next-line no-unused-vars
      const xAxisTitle = Plot.axisX({
        //domain: domain,
        type: 'band',
        label: getFieldLabel(this.data_dictionary[parameters.numeric_field]),
        labelOffset: x_title_offset,
        ticks: null,
        tickFormat: null,
        fontSize: x_title_size
      });

      // Create y axis labels
      // eslint-disable-next-line no-unused-vars
      const yAxisLabels = Plot.axisY({
        label: null,
        // tickFormat: y_tick_format,
        tickRotate: y_rotate,
        fontSize: y_label_size
      });

      // Create y axis title
      // eslint-disable-next-line no-unused-vars
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

      const nodes = [
        // nodes from xValues
        ...xValues.map((x,i) => ({
          id: x,
          group: i,
          //x: i,
          //y: yValues[i]
        })),
        // nodes from yValues
        ...yValues.map((y,i) => ({
          id: y,
          group: i,
          //x: i,
          //y: xValues[i]
        }))
      ]
      const edges = xValues.map((x, i) => ({
        source: x,
        target: yValues[i],
        value: 1,
        width: 1
      }))

      // const nodes = [
      //   { id: "Myriel", group: 1 },
      //   { id: "Napoleon", group: 1 },
      //   { id: "Mlle.Baptistine", group: 1 },
      //   { id: "Mme.Magloire", group: 1 },
      //   { id: "CountessdeLo", group: 1 },
      //   { id: "Geborand", group: 1 },
      //   { id: "Champtercier", group: 1 },
      //   { id: "Cravatte", group: 1 },
      //   { id: "Count", group: 1 },
      //   { id: "OldMan", group: 1 },
      //   { id: "Labarre", group: 2 },
      //   { id: "Valjean", group: 2 },
      //   { id: "Marguerite", group: 3 },
      //   { id: "Mme.deR", group: 2 },
      //   { id: "Isabeau", group: 2 },
      //   { id: "Gervais", group: 2 },
      //   { id: "Tholomyes", group: 3 },
      //   { id: "Listolier", group: 3 },
      //   { id: "Fameuil", group: 3 },
      //   { id: "Blacheville", group: 3 },
      //   { id: "Favourite", group: 3 },
      //   { id: "Dahlia", group: 3 },
      //   { id: "Zephine", group: 3 },
      //   { id: "Fantine", group: 3 },
      //   { id: "Mme.Thenardier", group: 4 },
      //   { id: "Thenardier", group: 4 },
      //   { id: "Cosette", group: 5 },
      //   { id: "Javert", group: 4 },
      //   { id: "Fauchelevent", group: 0 },
      //   { id: "Bamatabois", group: 2 },
      //   { id: "Perpetue", group: 3 },
      //   { id: "Simplice", group: 2 },
      //   { id: "Scaufflaire", group: 2 },
      //   { id: "Woman1", group: 2 },
      //   { id: "Judge", group: 2 },
      // ];
      // const edges = [
      //   { source: "Napoleon", target: "Myriel", value: 1 },
      //   { source: "Mlle.Baptistine", target: "Myriel", value: 8 },
      //   { source: "Mme.Magloire", target: "Myriel", value: 10 },
      //   { source: "Mme.Magloire", target: "Mlle.Baptistine", value: 6 },
      //   { source: "CountessdeLo", target: "Myriel", value: 1 },
      //   { source: "Geborand", target: "Myriel", value: 1 },
      //   { source: "Champtercier", target: "Myriel", value: 1 },
      //   { source: "Cravatte", target: "Myriel", value: 1 },
      //   { source: "Count", target: "Myriel", value: 2 },
      //   { source: "OldMan", target: "Myriel", value: 1 },
      //   { source: "Valjean", target: "Labarre", value: 1 },
      //   { source: "Valjean", target: "Mme.Magloire", value: 3 },
      //   { source: "Valjean", target: "Mlle.Baptistine", value: 3 },
      //   { source: "Valjean", target: "Myriel", value: 5 },
      //   { source: "Marguerite", target: "Valjean", value: 1 },
      //   { source: "Mme.deR", target: "Valjean", value: 1 },
      //   { source: "Isabeau", target: "Valjean", value: 1 },
      //   { source: "Gervais", target: "Valjean", value: 1 },
      //   { source: "Listolier", target: "Tholomyes", value: 4 },
      //   { source: "Fameuil", target: "Tholomyes", value: 4 },
      //   { source: "Fameuil", target: "Listolier", value: 4 },
      //   { source: "Blacheville", target: "Tholomyes", value: 4 },
      //   { source: "Blacheville", target: "Listolier", value: 4 },
      //   { source: "Blacheville", target: "Tholomyes", value: 4 },
      //   { source: "Favourite", target: "Tholomyes", value: 3 },
      //   { source: "Favourite", target: "Listolier", value: 3 },
      //   { source: "Favourite", target: "Fameuil", value: 3 },
      //   { source: "Dahlia", target: "Tholomyes", value: 3 },
      //   { source: "Dahlia", target: "Listolier", value: 3 },
      //   { source: "Dahlia", target: "Fameuil", value: 3 },
      //   { source: "Dahlia", target: "Favourite", value: 5 },
      //   { source: "Zephine", target: "Tholomyes", value: 3 },
      //   { source: "Zephine", target: "Listolier", value: 3 },
      //   { source: "Zephine", target: "Fameuil", value: 3 },
      //   { source: "Zephine", target: "Favourite", value: 4 },
      // ];

      console.log("nodes: ");
      console.log(nodes);
      console.log("edges: ");
      console.log(edges);

      // Create the network graph using D3.js
      var width = 600;
      var height = 600 - parameters.bottom_margin;

      var svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(parameters.x_rotate * 0.001 ) )
        .force("y", d3.forceY(height / 2).strength(parameters.y_rotate * 0.001 ) )
        .force("collide", d3.forceCollide().radius(parameters.x_label_length).strength(parameters.y_label_length*.06).iterations(1))    // 20,  0.75
        .force("charge", d3.forceManyBody().strength(-50));  //-50

      svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 13)
        .attr('markerHeight', 13)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke','none');

      /*var link = svg.selectAll(".link")
        .data(edges)
        .enter().append("line")
        .attr("class", "link");*/
      // draw line for each link, color it black, make it 1px wide


      var link;
      if (parameters.marker_type == "directed") {
          link = svg.selectAll(".link")
              .data(edges)
              .enter().append("line")
              .attr("class", "link")
              .style("stroke", "black")
              .style("stroke-width", "1px")
              .attr('marker-end', 'url(#arrowhead)');
      } else {
          link = svg.selectAll(".link")
              .data(edges)
              .enter().append("line")
              .attr("class", "link")
              .style("stroke", "black")
              .style("stroke-width", "1px");
      }

        //     var node = svg.selectAll(".node")
  //       .data(nodes)
  //       .enter().append("circle")
  //       //  .enter().append("path")
  //       //  .attr("d", d3.symbol().type(d3.symbolTriangle))
  //       .attr("class", "node")
  //         .text("12345")
  // //      .attr("fill", colorScale(parameters.dot_color*12))
  //       .attr("r", parameters.dot_size+2);

        let node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g");

        node.append("circle")
            // enter().append("circle")
            .attr("class", "node")
            .attr("fill", colorScale(parameters.dot_color*12))
            .attr("r", parameters.dot_size+2)
            .attr("dx", 0)  // offset the label to the right of the node
            .attr("dy", 0);  // vertically align the label with the node

        if(parameters.show_legend) {
            node.append("text")
                .text(function (d) {
                    return d.id;  // replace 'id' with the property name for your label
                })
                .style("font-size", parameters.x_label_size + "px")  // control the font size here

                .attr("dx", parameters.x_title_offset)  // offset the label to the right of the node
                .attr("dy", parameters.y_title_offset); //".35em");  // vertically align the label with the node
        }

      // node.append("title")
      //   .text(function(d) { return d.id; }); //  .. .label; });

      // // Append "text" elements to the nodes
      // node.append("label")
      //   .text("test123") //function(d) {
      //   //   return d.id;
      //   // })
      //   .attr('x', 39)
      //   .attr('y', 69);

      simulation.nodes(nodes)
        .on("tick", ticked);

      simulation.force("link")
        .links(edges);

      //// Add zoom functionality
      // svg.call(d3.zoom()
      //   .scaleExtent([1 / 2, 8])
      //   .on("zoom", zoomed));

      // function zoomed() {
      //   g.attr("transform", d3.event.transform);
      // }




      function ticked() {
        link
          .attr("x1", function (d) {
            return d.source.x;
          })
          .attr("y1", function (d) {
            return d.source.y;
          })
          .attr("x2", function (d) {
            return d.target.x;
          })
          .attr("y2", function (d) {
            return d.target.y;
          });

        node
          // .attr("cx", function (d) {
          //   return d.x;
          // })
          // .attr("cy", function (d) {
          //   return d.y;
          // });
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

      }

      graph = svg.node();
      if (graph) {
        return graph;
      }

      // Return a paragraph tag element with the error message
      var errorDiv = document.createElement('p');
      errorDiv.innerHTML = this.module.tt('NetworkGraphs are not supported in this version of the module.' + xValues.length + ',' + yValues.length + ',' + parameters.graph_type, colorScale);
      return errorDiv;
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
