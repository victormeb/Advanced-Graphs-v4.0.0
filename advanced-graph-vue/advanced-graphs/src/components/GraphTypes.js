// GraphTypes.js

import BarGraphForm from './BarGraph/BarGraphForm.vue';
import BarGraph from './BarGraph/BarGraph.vue';
import GroupedBarGraphForm from './GroupedBarGraph/GroupedBarGraphForm.vue';
import GroupedBarGraph from './GroupedBarGraph/GroupedBarGraph.vue';
import LikertGraphForm from './Likert/LikertGraphForm.vue';
import LikertGraph from './Likert/LikertGraph.vue';
// import GroupedBarPlot from './GroupedBarPlot.vue';
// import Table from './Table.vue';
// import ScatterPlot from './ScatterPlot.vue';
// import Map from './Map.vue';
// import LinePlot from './LinePlot.vue';
// import Likert from './Likert.vue';

export default {
    'bar_pie': {form: BarGraphForm, graph: BarGraph},
    'grouped_stacked': {form: GroupedBarGraphForm, graph: GroupedBarGraph},
    'likert': {form: LikertGraphForm, graph: LikertGraph},
};