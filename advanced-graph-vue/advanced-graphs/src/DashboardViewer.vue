<template>
  <div class="AG-viewer-dashboard">
    <div 
      v-for="(row, index) in rows" :key="index" class="AG-viewer-row">
      <div
        v-for="(graph, index) in row"
        :key="index"
      >
        <div class="AG-viewer-col">
          <component
            :is="GraphTypes[graph.type].graph"
            :parameters="graph.parameters"
            :editorMode="false"
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

<style scoped>
.AG-viewer-dashboard{
  overflow: auto;
}

.AG-viewer-row {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
}

.AG-viewer-col {
  min-width: 400px;
  margin-right: 1rem;
}
</style>