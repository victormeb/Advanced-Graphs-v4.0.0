<!-- EditorCell.vue -->
<template>
  <div class="AG-editor-cell-container">
    <div class="AG-editor-cell">
      <div class="AG-editor-cell-buttons">
        <button class="btn btn-primary" @click="$emit('moveCellLeft')">
          <i class="fa fa-arrow-left" aria-hidden="true"></i>
        </button>
        <GraphTypeSelector 
        :currentGraphType="currentGraphType"
        :availableGraphTypes="availableGraphTypes"
        @graphTypeChange="graphTypeChange" />
        <button class="btn btn-primary" @click="$emit('moveCellRight')">
          <i class="fa fa-arrow-right" aria-hidden="true"></i>
        </button>
        <button class="btn btn-danger" @click="confirmDelete">
          <i class="fa fa-trash" aria-hidden="true"></i>
        </button>
        <button class="btn btn-success AG-editor-cell-button-add-right" @click="$emit('addCellRight')">
          <i class="fa fa-plus" aria-hidden="true"></i>
        </button>
      </div>
      <div class="AG-editor-graph-form-container">
        <component 
          :is="currentGraphForm" 
          :cellData="cellData"
          @updateCellData="updateCellData"
          @isReady="updateFormStatus"/>
      </div>
      <div class="AG-editor-graph-container">
        <component 
          v-if="showGraph"
          :editorMode="true"
          :key="graphId"
          :is="currentGraph" 
          :parameters="cellData"
          @updateParameters="updateCellData" />
      </div>
      <div class="AG-editor-graph-buttons">
        <button 
          class="btn btn-primary"
          :disabled="!formReady"
          @click="previewGraph">
          {{module.tt('editor_cell_preview')}}
        </button>
      </div>
    </div>
  </div>
  <confirmation-modal
    ref="confirmationModal"
  >
  </confirmation-modal>
</template>
  
  <script>
  import GraphTypeSelector from './GraphTypeSelector.vue';
  import GraphTypes from './GraphTypes.js'
  import ConfirmationModal from './ConfirmationModal.vue';
  import { markRaw } from 'vue';

  
  export default {
    name: 'EditorCell',
    components: {
      GraphTypeSelector,
      ConfirmationModal,
    },
    inject: ['module', 'report_fields_by_repeat_instrument'],
    props: {
      cell: {
        type: Object,
        default: null,
      },
    },
    emits: ['updateCell', 'deleteCell', 'moveCellLeft', 'moveCellRight', 'addCellRight'],
    data() {
      return {
        currentGraphType: this.cell && this.cell.type ? this.cell.type : null,
        currentGraphForm: this.cell && this.cell.type && GraphTypes[this.cell.type] ? markRaw(GraphTypes[this.cell.type].form) : null,
        currentGraph: this.cell && this.cell.type && GraphTypes[this.cell.type] ? markRaw(GraphTypes[this.cell.type].graph) : null,
        cellData: this.cell ? this.cell.parameters : {},
        cellID: this.cell ? this.cell.id : null,
        graphId: 0,
        showGraph: false,
        formReady: false,
      };
    },
    mounted() {
      if (this.cell && this.cell.type) {
        // Initial setup if cell prop is passed
        this.createGraphFormFromSelectedGraphType(this.cell.type);
      }
    },
    computed: {
      availableGraphTypes() {
        return Object.keys(GraphTypes).filter(graphType => {
          return GraphTypes[graphType].form.methods.isCreatable(this.report_fields_by_repeat_instrument);
        });
      },
    },
    methods: {
      graphTypeChange(graphType) {
        this.updateCellData({});

        this.createGraphFormFromSelectedGraphType(graphType);
      },
      createGraphFormFromSelectedGraphType(graphType) {
        // Implementation for creating the graph form from the selected graph type
        if (!graphType) {
          return;
        }

        this.currentGraphType = graphType;

        this.currentGraphObject = GraphTypes[graphType];

        this.currentGraphForm = markRaw(this.currentGraphObject.form);

        this.currentGraph = markRaw(this.currentGraphObject.graph);

        this.showGraph = false;

        this.$emit('updateCell', {type: graphType, parameters: this.cellData, id: this.cellID});
      },
      updateFormStatus(status) {
        this.formReady = status;
        if (!status) {
          this.showGraph = false;
        }
      },
      updateCellData(data) {
        this.cellData = data;
        this.$emit('updateCell', {type: this.currentGraphType, parameters: this.cellData, id: this.cellID});
      },
      previewGraph() {
        this.showGraph = true;
        this.graphId++;
      },
      async confirmDelete() {
        const confirmed = await this.$refs.confirmationModal.show({
          title: this.module.tt('editor_cell_delete_cell'),
          message: this.module.tt('editor_cell_delete_cell_confirmation'),
        });

        if (confirmed) {
          this.$emit('deleteCell');
        }
        
      },
    },
  };
  </script>

  <style scoped>
.AG-editor-cell-container {
  display: flex;
  flex-direction: column;
  margin-right: 30px;
  border: 1px solid #ccc;
}

.AG-editor-cell {
  /* Add these lines */
  display: flex;
  flex-direction: column;
  /* align-items: center; */
}

.AG-editor-cell-buttons {
  /* Set a fixed height or min-height, so the button container doesn't get affected by the content */
  min-height: 40px;
  display: flex;
  flex-direction: row;
  /* Remove these lines */
  /* align-items: flex-start; */
  /* justify-content: flex-start; */
  /* Add these lines */
  align-items: center;
  justify-content: center;
  /* Add a margin-bottom to create some space between the buttons and the content */
  margin-bottom: 10px;
}

.AG-editor-graph-form-container {
  grid-area: graph-form-container;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}

.AG-editor-graph-container {
  grid-area: graph-container;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}

.AG-editor-graph-buttons {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}

.AG-add-cell-button {
  float: left;
  margin-right: 10px;
}
  </style>