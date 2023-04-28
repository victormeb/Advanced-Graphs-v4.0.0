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
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import * as d3 from 'd3';
// import {PieChart} from "@d3/pie-chart";
import {parseChoicesOrCalculations/*, getFieldLabel, wrapString, truncateString*/} from '@/utils';
import MapOptions from './MapOptions.vue';
// import { map } from '@observablehq/plot/dist/options';

import { markRaw } from 'vue';

export default {
    name: 'MapsGraph',
    components: {
        MapOptions,
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

            this.moreOptionsComponent = markRaw(MapOptions);

            this.$nextTick(() => {
                this.updateGraph();
            });
            this.getGraph.bind(this)();

        } catch (e) {
            console.error(e);
        }
    },
    methods: {
        updateParameters(parameters) {
            this.$emit('updateParameters', parameters);
            this.$nextTick(() => {
                this.updateGraph();
            });
        },
        updateGraph() {
            this.$refs.graphContainer.innerHTML = '';
            this.getGraph.bind(this)();
        },
        getGraph() {
            const processedData = this.processData();

            // Create an empty div to hold the map
            var mapDiv = this.$refs.graphContainer

            if (this.graph) {
                this.graph.remove();
            }

            // Create the map
            this.graph = L.map(mapDiv, {
            }).setView([48.5, -123.7], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.graph);

            // Add the dots to the map
            // If cluster_dots is true, cluster the dots
            if (this.parameters.cluster_dots) {
                this.addClusteredDotsToMap(this.graph, processedData);
            } else {
                this.addDotsToMap(this.graph, processedData);
            }

            // If show legend is true, add a legend to the map
            if (this.parameters.show_legend) {
                this.addLegendToMap(this.graph, processedData);
            }
        },
        addLegendToMap(map, processedData) {
            // Get the unique location identifiers from the processed data
            const locationIdentifiers = [...new Set(processedData.map(row => row.identifier))];

            // Get the choices for the category field if it exists
            const categoryChoices = this.parameters.location_identifier ? parseChoicesOrCalculations(this.data_dictionary[this.parameters.location_identifier]) : null;

            // Create a color scale for the dots
            const colorScale = d3.scaleOrdinal()
                .domain(locationIdentifiers)
                .range(this.parameters.palette_brewer || d3.schemeCategory10);

            // Create a legend
            const legend = L.control({position: 'bottomright'});

            // Add the legend to the map
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend');
                const labels = [];

                // loop through our density intervals and generate a label with a colored square for each interval
                locationIdentifiers.forEach((identifier,) => {
                    labels.push('<i class="fas fa-square" style="color:' + colorScale(identifier) + '"></i> ' + (categoryChoices ? categoryChoices[identifier] : identifier));
                });

                div.innerHTML = labels.join('<br>');
                return div;
            };

            legend.addTo(map);
        },
        addDotsToMap(map, processedData) {
            // Get the unique location identifiers from the processed data
            const locationIdentifiers = [...new Set(processedData.map(row => row.identifier))];

            // Get the choices for the category field if it exists
            const categoryChoices = this.parameters.location_identifier ? parseChoicesOrCalculations(this.data_dictionary[this.parameters.location_identifier]) : null;

            // Create a color scale for the dots
            const colorScale = d3.scaleOrdinal()
                .domain(locationIdentifiers)
                .range(this.parameters.palette_brewer || d3.schemeCategory10);

            // Create  a function that calculates the radius of the dots
            const radiusScale = d3.scaleSqrt()
                .domain([0, d3.max(processedData, d => d.count)])
                .range([0, 15]);

            const node_scaling = this.parameters.node_scaling || 1;

            // Add the dots to the map
            processedData.forEach(row => {
                const circle = L.circleMarker([row.latitude, row.longitude], {
                    color: colorScale(row.identifier),
                    fillColor: colorScale(row.identifier),
                    fillOpacity: 1,
                    radius: radiusScale(row.count) * node_scaling
                });

                if (this.parameters.location_identifier) {
                    circle.bindPopup(categoryChoices[row.identifier] + ': ' + row.count);
                } else {
                    circle.bindPopup(row.latitude + ', ' + row.longitude + ': ' + row.count);
                }

                circle.addTo(map);
            });
        },
        addClusteredDotsToMap(map, processedData) {
            // Create a new marker group
            var markers = L.markerClusterGroup();

            // Add the circles to the marker group
            this.addDotsToMap(markers, processedData);

            // Add the marker group to the map
            map.addLayer(markers);
        },
        processData() {
            var filteredReport = this.report;

            if (this.parameters.na_numeric === 'drop') {
                filteredReport = filteredReport.filter(row => row[this.parameters.numeric_field] !== '');
            }

            if (this.parameters.na_numeric === 'replace') {
                filteredReport = filteredReport.map(row => {
                    if (row[this.parameters.numeric_field] === '') {
                        row[this.parameters.numeric_field] = this.parameters.na_numeric_value;
                    }
                    return row;
                });
            }

            var aggregationParameters = [filteredReport];

            if (this.parameters.is_count || !this.parameters.numeric_field)
                aggregationParameters.push(d => d.length);
            else
                aggregationParameters.push(d => d3[this.parameters.aggregation_function](d, v => v[this.parameters.numeric_field]));

            const coordinateFields = JSON.parse(this.parameters.coordinate_selector);
            const longitude = coordinateFields.longitude.field_name;
            const latitude = coordinateFields.latitude.field_name;

            console.log('coordinateFields', coordinateFields);

            aggregationParameters.push(d => d[longitude]);
            aggregationParameters.push(d => d[latitude]);

            if (this.parameters.location_identifier) {
                aggregationParameters.push(d => d[this.parameters.location_identifier]);
            }


            var aggregatedData = d3.rollup(...aggregationParameters);

            // Flatten the data
            var flattenedData = [];

            aggregatedData.forEach((latitudes, longitude) => {
                latitudes.forEach((count, latitude) => {
                    var row = {
                        longitude: longitude,
                        latitude: latitude,
                     };

                    if (this.parameters.location_identifier) {
                        count.forEach((count, identifier) => {
                            row.identifier = identifier;
                            row.count = count;
                        });
                    } else {
                        row.identifier = longitude + ',' + latitude;
                        row.count = count;
                    }

                    flattenedData.push(row);
                });
            });

            
            return flattenedData;
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