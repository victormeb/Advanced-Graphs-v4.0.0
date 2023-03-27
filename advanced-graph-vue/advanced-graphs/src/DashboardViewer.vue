<template>
  <div>
    <div 
      v-for="(row, index) in rows" :key="index" class="row" style="display: flex; flex-wrap: wrap;">
      <div
        v-for="(graph, index) in row"
        :key="index"
        class="col-md-{{ 12 / row.length }}"
        :style="{ minWidth: '200px' }"
      >
        <div class="card">
          <component
            :is="GraphTypes[graph.type].graph"
            :parameters="graph.parameters"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import GraphTypes from "./components/GraphTypes.js";

  export default {
    name: "DashboardViewer",
    props: ['module', 'dashboard', 'report', 'data_dictionary', 'report_fields_by_repeat_instrument'],
    provide() {
        return {
            module: this.module,
            dashboard: this.dashboard,
            data_dictionary: this.data_dictionary,
            report: this.report,
            report_fields_by_repeat_instrument: this.report_fields_by_repeat_instrument,
        };
    },
    mounted() {
      console.log(this.rows);
    },
    computed: {
      rows() {
        return this.dashboard && this.dashboard.body ? JSON.parse(this.dashboard.body) : [];
      },
    },
    data() {
      return {
        GraphTypes,
      };
    }
  };
</script>