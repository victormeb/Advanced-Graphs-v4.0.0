<!-- DashboardEditor.vue -->
<template>
    <div>
      <h1>Dashboard Editor</h1>
      <DashboardOptions />
      <editor-table
        :rows="body"
        @moveRowUp="moveRowUp($event)"
        @moveRowDown="moveRowDown($event)"
        @updateRow="updateDashboardRow($event)"
        @removeRow="removeDashboardRow($event)"
        @addRow="addDashboardRow"
      ></editor-table>
      <div class="AG-editor-final-buttons">
        <button @click="saveDashboard" class="btn btn-primary">
          {{ dashboard ? module.tt('save') : module.tt('create') }}
        </button>
        <button class="btn btn-secondary">{{ module.tt('cancel') }}</button>
      </div>
    </div>
  </template>
  
  <script>
  import DashboardOptions from './components/DashboardOptions.vue';
  import EditorTable from './components/EditorTable.vue';
  import { reactive } from 'vue';
  import { getUuid } from './utils.js';

  export default {
    name: "DashboardEditor",
    components: {
        DashboardOptions,
        EditorTable,
    },
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
    data() {
        return {
            title: this.dashboard.title || this.module.tt('new_dashboard'),
            isPublic: this.dashboard.is_public || false,
            body: reactive( 
              this.dashboard.body ? 
              JSON.parse(this.dashboard.body).map(row => row.map(cell => ({ ...cell, id: getUuid() }))): 
              [],
            ),
        }
    },
    methods: {
        moveRowUp(index) {
            if (index > 0) {
                const row = this.body[index];
                this.body.splice(index, 1);
                this.body.splice(index - 1, 0, row);
            }
        },
        moveRowDown(index) {
            if (index < this.body.length - 1) {
                const row = this.body[index];
                this.body.splice(index, 1);
                this.body.splice(index + 1, 0, row);
            }
        },
        updateDashboardRow({ index, row }) {
            this.body.splice(index, 1, row);
            console.log('updateBody', this.body);
        },
        removeDashboardRow(index) {
            this.body.splice(index, 1);
        },
        addDashboardRow() {
            this.body.push([]);
        },
      saveDashboard() {
        // TODO: Save dashboard
      },
    },
    watch: {
      body: {
        handler: function (newBody) {
          this.body = newBody;
        },
        deep: true,
      },
    },
  };
  </script>