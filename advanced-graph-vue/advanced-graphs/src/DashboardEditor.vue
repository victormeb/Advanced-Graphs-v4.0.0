<!-- DashboardEditor.vue -->
  <template>
    <div>
      <h1>Dashboard Editor</h1>
      <DashboardOptions 
      :title="title" 
      :isPublic="isPublic" 
      @updateTitle="updateTitle($event)"
      @updatePublic="updatePublic($event)"/>
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
    <saved-modal
        v-if="savedModal"
        :name="savedModal.name"
        :list_link="savedModal.list_link"
        :dash_link="savedModal.dash_link"
        @close="savedModal=null">
    </saved-modal>
    <confirmation-modal ref="confirmationModal"></confirmation-modal>
  </template>
  
  <script>
  import DashboardOptions from './components/DashboardOptions.vue';
  import EditorTable from './components/EditorTable.vue';
  import SavedModal from './components/SavedModal.vue';
  import ConfirmationModal from './components/ConfirmationModal.vue';
  import { reactive } from 'vue';
  import { getUuid } from './utils.js';

  export default {
    name: "DashboardEditor",
    components: {
        DashboardOptions,
        EditorTable,
        SavedModal,
        ConfirmationModal,
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
            localDashboard: this.dashboard,
            savedModal: null,
        }
    },
    methods: {
      updateTitle(new_title) {
        this.title = new_title;
      },
      updatePublic(new_public) {
        this.isPublic = new_public;
      },
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
        async removeDashboardRow(index) {
            const confirm = await this.$refs.confirmationModal.show(
                {
                  title: this.module.tt('confirm_delete_row'),
                  message: this.module.tt('confirm_delete_row_message'),
                }
            );

            if (!confirm) {
                return;
            }

            this.body.splice(index, 1);
        },
        addDashboardRow() {
            this.body.push([]);
        },
      async saveDashboard() {
        this.localDashboard = this.localDashboard && this.localDashboard.body ? this.localDashboard : await this.newDashboard();
        this.localDashboard.body = this.body;
        this.localDashboard.title = this.title;
        this.localDashboard.is_public = this.isPublic;
        this.module.ajax('saveDashboard', this.localDashboard).then(function (result) {
          console.log('saveDashboard', result);
          this.savedModal = {
            name: result.title,
            list_link: this.module.getUrl('advanced_graphs.php'),
            dash_link: this.module.getUrl('view_dash.php') + '&report_id=' + result.report_id 
        + '&dash_id=' + result.dash_id,
          };
        }.bind(this)).catch(function (error) {
          console.log(error);
        });
      },
      async newDashboard() {
        try {
            var result = await this.module.ajax('newDashboard', this.module.getUrlParameter('report_id'));
            console.log('new_dashboard', result);
            return JSON.parse(result);
        } catch (error) {
            console.log(error);
        }
    }
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