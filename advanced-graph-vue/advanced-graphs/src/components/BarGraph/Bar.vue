<!-- Bar.vue -->
<template>
  <div>
    <bar-graph-form @form-status-changed="onFormStatusChanged"></bar-graph-form>
    <button @click="previewGraph" :disabled="!isPreviewEnabled">Preview</button>
    <bar-graph v-if="showGraph" :parameters="graphParameters"></bar-graph>
  </div>
</template>

<script>
import BarGraphForm from "./BarGraphForm.vue";
import BarGraph from "./BarGraph.vue";

export default {
  components: {
    BarGraphForm,
    BarGraph,
  },
  data() {
    return {
      isPreviewEnabled: false,
      showGraph: false,
      graphParameters: null,
    };
  },
  methods: {
    onFormStatusChanged(isReady) {
      this.isPreviewEnabled = isReady;
      if (isReady) {
        // If the form is ready, get the parameters from the form component
        this.graphParameters = this.$refs.formComponent.parameters;
      }
    },
    previewGraph() {
      this.showGraph = true;
    },
  },
};
</script>