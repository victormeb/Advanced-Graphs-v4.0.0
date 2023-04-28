// GraphTypes.js

import BarGraphForm from './BarGraph/BarGraphForm.vue';
import BarGraph from './BarGraph/BarGraph.vue';
import GroupedBarGraphForm from './GroupedBarGraph/GroupedBarGraphForm.vue';
import GroupedBarGraph from './GroupedBarGraph/GroupedBarGraph.vue';
import LikertGraphForm from './Likert/LikertGraphForm.vue';
import LikertGraph from './Likert/LikertGraph.vue';
import ScatterPlotForm from "@/components/ScatterPlot/ScatterPlotForm.vue";
import ScatterPlot from "@/components/ScatterPlot/ScatterPlot.vue";
import TableComponent from "@/components/Tables/TableComponent.vue";
import TableForm from "@/components/Tables/TableForm.vue";
import Maps from "@/components/Maps/Maps.vue";
import MapsForm from "@/components/Maps/MapsForm.vue";
import NetworkGraphForm from "@/components/Network/NetworkGraphForm.vue";
import NetworkGraph from "@/components/Network/NetworkGraph.vue";
// import GroupedBarPlot from './GroupedBarPlot.vue';
// import Table from './Table.vue';
// import ScatterPlot from './ScatterPlot.vue';
// import Map from './Map.vue';
// import LinePlot from './LinePlot.vue';
// import Likert from './Likert.vue';

export default {
    'bar_pie': {form: BarGraphForm, graph: BarGraph},
    'grouped_stacked': {form: GroupedBarGraphForm, graph: GroupedBarGraph},
    'scatter': {form: ScatterPlotForm, graph: ScatterPlot},
    'likert': {form: LikertGraphForm, graph: LikertGraph},
    'table': {form: TableForm, graph: TableComponent},
    'map': {form: MapsForm, graph: Maps},
    'network_graph': {form: NetworkGraphForm, graph: NetworkGraph},
};