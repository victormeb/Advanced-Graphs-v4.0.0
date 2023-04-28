<!-- BarGraphForm.vue -->
<template>
    <form>
      <!-- Your form elements for gathering the required parameters -->
      <instrument-selector
        v-model="formData.instrument"
        :availableInstruments="availableInstruments"
        ></instrument-selector>
        <div v-if="formData.instrument !== null && typeof formData.instrument === 'string'">
          <div class="AG-two-panes">
            <div class="AG-pane-left">
              <!-- Title -->
              <helpful-parameter
                  :label-text="module.tt('title')"
                  :help-text="module.tt('title_help')">
                  <input type="text" v-model="formData.title">
              </helpful-parameter>
              <!-- Description -->
              <helpful-parameter
                  :label-text="module.tt('description')"
                  :help-text="module.tt('description_help')">
                  <input type="text" v-model="formData.description">
              </helpful-parameter>
              <!-- Summary or Crosstab -->
              <helpful-parameter
                  :label-text="module.tt('table_type')"
                  :help-text="module.tt('table_help')"
              >
                  <radio-component
                      v-model="formData.table_type"
                      :name="'graph_type'"
                      :values="['summary', 'crosstab']"
                      :defaultValue="'summary'"
                      :labels="[module.tt('table_type_summary'), module.tt('table_type_crosstab')]"
                  ></radio-component>
              </helpful-parameter>
            </div>
            <div class="AG-pane-right">
              <summary-table-form
                v-if="formData.table_type === 'summary'"
                graphType="table"
                :cellData="formData"
                @updateCellData="$emit('updateCellData', $event)"
                @isReady="$emit('isReady', $event)">
              </summary-table-form>
              <crosstab-table-form
                v-else-if="formData.table_type === 'crosstab'"
                graphType="table"
                :cellData="formData"
                @updateCellData="$emit('updateCellData', $event)"
                @isReady="$emit('isReady', $event)">
              </crosstab-table-form>
            </div>
          </div>
        </div>
      </form>
  </template>
  
  <script>
  import HelpfulParameter from "@/components/HelpfulParameter.vue";
  import InstrumentSelector from "@/components/InstrumentSelector.vue";
  import RadioComponent from "@/components/RadioComponent.vue";
  import { isCategoricalField } from "@/utils";
  import SummaryTableForm from "./SummaryTableForm.vue";
  import CrosstabTableForm from "./CrosstabTableForm.vue";

  export default {
    components: {
      HelpfulParameter,
      InstrumentSelector,
      RadioComponent,
      SummaryTableForm,
      CrosstabTableForm,

    },
    inject: ["module", "report_fields_by_repeat_instrument"],
    props: {
      cellData: {
        type: Object,
        default: null,
      },
    },
    mounted() {
      this.$emit("isReady", this.isFormReady);
    },
    data() {
      return {
        formData: this.cellData || {},
      };
    },
    computed: {
      isFormReady() {
        // console.log('formData', this.formData);
        const instrument_selected = (typeof this.formData.instrument !== 'undefined') && this.formData.instrument !== null;

        if (!instrument_selected) {
          return false;
        }


        const table_type_selected = (typeof this.formData.table_type !== 'undefined') && this.formData.table_type !== null;

        if (!table_type_selected) {
          return false;
        }

        const numeric_field_selected = (typeof this.formData.numeric_field !== 'undefined') && this.formData.numeric_field !== null;
        const aggregation_function_selected = (typeof this.formData.aggregation_function !== 'undefined') && this.formData.aggregation_function !== null;
        const unused_categories_selected = (typeof this.formData.unused_categories !== undefined) && this.formData.unused_categories !== null;


        if (this.formData.table_type == "summary") {

          const categorical_field_selected = (typeof this.formData.categorical_field !== 'undefined') && this.formData.categorical_field !== null;
          const na_category_selected = (typeof this.formData.na_category !== 'undefined') && this.formData.na_category !== null;
          // console.log('isFormReady', instrument_selected, graph_type_selected, categorical_field_selected, numeric_field_selected, na_category_selected, 'unused', unused_categories_selected, 'agg', aggregation_function_selected);
          // If any of the required fields are not selected, return false
          if (!categorical_field_selected || !numeric_field_selected || !na_category_selected || !unused_categories_selected) {
            return false;
          }

          // If na_numeric is replace, but no value is provided, return false
          if (this.formData.na_numeric === 'replace' && !this.formData.na_numeric_value) {
            return false;
          }

          // If numeric field is selected, but no aggregation function is selected, return false
          if (numeric_field_selected && typeof this.formData.numeric_field === 'string' && this.formData.is_count != true && !aggregation_function_selected) {
            return false;
          }

        } 

        if (this.formData.table_type == "crosstab") {
          const categorical_field_one_selected = (typeof this.formData.categorical_field_one !== 'undefined') && this.formData.categorical_one_field !== null;
          const categorical_field_two_selected = (typeof this.formData.categorical_field_two !== 'undefined') && this.formData.categorical_two_field !== null;
          const na_category_one_selected = (typeof this.formData.na_category_one !== 'undefined') && this.formData.na_category_one !== null;
          const na_category_two_selected = (typeof this.formData.na_category_two !== 'undefined') && this.formData.na_category_two !== null;
          // console.log('isFormReady', instrument_selected, graph_type_selected, categorical_field_selected, numeric_field_selected, na_category_selected, 'unused', unused_categories_selected, 'agg', aggregation_function_selected);
          // If any of the required fields are not selected, return false
          if ( !categorical_field_one_selected || !categorical_field_two_selected || !numeric_field_selected || !na_category_one_selected || !na_category_two_selected || !unused_categories_selected) {
            return false;
          }

          // If category one is equal to category two, return false
          if (this.formData.categorical_field_one === this.formData.categorical_field_two) {
            return false;
          }

          // If na_numeric is replace, but no value is provided, return false
          if (this.formData.na_numeric === 'replace' && !this.formData.na_numeric_value) {
            return false;
          }

          // If numeric field is selected, but no aggregation function is selected, return false
          if (numeric_field_selected && typeof this.formData.numeric_field === 'string' && this.formData.is_count != true && !aggregation_function_selected) {
            return false;
          }
        }

        // If table type is neither summary nor crosstab, return false
        if (this.formData.table_type != "summary" && this.formData.table_type != "crosstab") {
          return false;
        }

        // Return true if there are enough selected parameters to create a summary or crosstabulation table
        return true;
      },
      availableInstruments() {
        const instruments = {};
        for (const instrument in this.report_fields_by_repeat_instrument) {
          if (this.instrumentCanCreate(this.report_fields_by_repeat_instrument, instrument)) {
            instruments[instrument] = this.report_fields_by_repeat_instrument[instrument];
          }
        }
        return instruments;
      },
    },
    watch: {
      isFormReady(newVal) {
        // Emit an event with the new status whenever the conditions change
        this.$emit("isReady", newVal);
      },
      formData: {
        handler(newVal) {
          newVal.is_count = newVal.numeric_field === "";

          // Emit an event with the new data whenever the form data changes
          this.$emit("updateCellData", newVal);
        },
        deep: true,
      },
    },
    methods: {
      isCreatable(report_fields_by_repeat_instrument) {
        // For each instrument in report_fields_by_reapeat_instrument
        for (const instrument in report_fields_by_repeat_instrument) {
          // If there is a categorical field
          if (this.instrumentCanCreate(report_fields_by_repeat_instrument, instrument)) {
            // Return true
            return true;
          }
        }
      },
      instrumentCanCreate(report_fields_by_repeat_instrument, instrument_name) {
        // If there is a categorical field
        if (report_fields_by_repeat_instrument[instrument_name].fields.some(field => isCategoricalField(field))) {
          // Return true
          return true;
        }
        return false;
      }
    }
  };
  </script>

  <style scoped>
    .AG-two-panes {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .AG-pane-left {
      width: 50%;
    }

    .AG-pane-right {
      width: 50%;
      margin-left: 20px;
    }

  </style>