<!-- App.vue -->
<template>
  <div>
    <DashboardEditor v-if="currentPage === 'dashboard-editor'" />
    <DashboardList v-else-if="currentPage === 'dashboard-list'" />
    <DashboardViewer v-else-if="currentPage === 'dashboard-viewer'" />
    <DashboardViewerPublic v-else-if="currentPage === 'public-dashboard-viewer'" />
  </div>
</template>

<script>
import { reactive } from 'vue';
import DashboardEditor from './DashboardEditor.vue';
import DashboardList from './DashboardList.vue';
import DashboardViewer from './DashboardViewer.vue';
import DashboardViewerPublic from './DashboardViewerPublic.vue';

export default {
  props: ['currentPage', 'module', 'dashboard', 'report', 'data_dictionary', 'report_fields_by_repeat_instrument',],
  components: {
    DashboardEditor,
    DashboardList,
    DashboardViewer,
    DashboardViewerPublic,
  },
  setup(props) {
    const reactiveDashboard = reactive(props.dashboard);

    return {
      reactiveDashboard,
    };
  },
  provide() {
    return {
      module: this.module,
      reactiveDashboard: this.reactiveDashboard,
      data_dictionary: this.data_dictionary,
      report: this.report,
      report_fields_by_repeat_instrument: this.report_fields_by_repeat_instrument,
    };
  },
};
</script>