<!-- BarGraphForm.vue -->
<template>
    <form>
      <!-- Your form elements for gathering the required parameters -->
      <instrument-selector
        v-model="formData.instrument"
        :availableInstruments="availableInstruments"
        ></instrument-selector>
        <div v-if="formData.instrument !== null && typeof formData.instrument === 'string'">
            <div>
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
              <!-- Bar or Pie -->
              <helpful-parameter
                  :label-text="module.tt('grouped_graph_type')"
                  :help-text="module.tt('grouped_graph_type_help')"
              >
                  <radio-component
                      v-model="formData.graph_type"
                      :name="'graph_type'"
                      :values="['stacked', 'grouped']"
                      :defaultValue="'stacked'"
                      :labels="[module.tt('stacked'), module.tt('grouped')]"
                  ></radio-component>
              </helpful-parameter>
            </div>
            <div class="AG-two-panes">
              <div class="AG-pane-left">
              <!-- Categorical Field One -->
              <helpful-parameter
                  :label-text="module.tt('grouped_categorical_field_one')"
                  :help-text="module.tt('grouped_categorical_field_help')"
              >
                  <categorical-field-selector
                      v-model="formData.categorical_field_one"
                      :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                  ></categorical-field-selector>
              </helpful-parameter>
              <!-- NA Category One -->
              <helpful-parameter
                  :label-text="module.tt('na_category')"
                  :help-text="module.tt('na_category_help')"
              >
              <radio-component
                      v-model="formData.na_category_one"
                      :name="'na_category_one'"
                      :values="['keep', 'drop']"
                      :defaultValue="'keep'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
              <!-- Unused Categories One -->
              <helpful-parameter
                  :label-text="module.tt('unused_categories_one')"
                  :help-text="module.tt('unused_categories_help')"
              >
              <radio-component
                      v-model="formData.unused_categories_one"
                      :name="'unused_categories_one'"
                      :values="['keep', 'drop']"
                      :defaultValue="'keep'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
            </div>
            <div class="AG-pane-right">
              <!-- Categorical Field Two -->
              <helpful-parameter
                  :label-text="module.tt('grouped_categorical_field_two')"
                  :help-text="module.tt('grouped_categorical_field_help')"
              >
                  <categorical-field-selector
                      v-model="formData.categorical_field_two"
                      :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                  ></categorical-field-selector>
              </helpful-parameter>
              <!-- NA Category Two -->
              <helpful-parameter
                  :label-text="module.tt('na_category')"
                  :help-text="module.tt('na_category_help')"
              >
              <radio-component
                      v-model="formData.na_category_two"
                      :name="'na_category_two'"
                      :values="['keep', 'drop']"
                      :defaultValue="'keep'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
              <!-- Unused Categories Two -->
              <helpful-parameter
                  :label-text="module.tt('unused_categories_two')"
                  :help-text="module.tt('unused_categories_help')"
              >
              <radio-component
                      v-model="formData.unused_categories_two"
                      :name="'unused_categorie_two'"
                      :values="['keep', 'drop']"
                      :defaultValue="'keep'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
            </div>
          </div>
          <div>
              <!-- Numeric Field -->
              <helpful-parameter
                  :label-text="module.tt('numeric_field')"
                  :help-text="module.tt('numeric_field_help')"
              >
              <numeric-field-selector
                      v-model="formData.numeric_field"
                      :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                  ></numeric-field-selector>
              </helpful-parameter>
              <!-- NA Numeric -->
              <helpful-parameter
                  v-if="formData.numeric_field !== null 
                    && typeof formData.numeric_field === 'string' 
                    && formData.is_count != true"
                  :label-text="module.tt('na_numeric')"
                  :help-text="module.tt('na_numeric_help')"
              >
                <radio-component
                        v-model="formData.na_numeric"
                        :name="'na_numeric'"
                        :values="['drop', 'replace']"
                        :defaultValue="'drop'"
                        :labels="[module.tt('drop'), module.tt('replace')]"
                    ></radio-component>
                <input type="number" v-if="formData.na_numeric === 'replace'" v-model="formData.na_numeric_value" />
              </helpful-parameter>
              <!-- Aggregation Function -->
              <helpful-parameter
                  v-if="formData.numeric_field !== null 
                    && typeof formData.numeric_field === 'string' 
                    && formData.is_count != true"
                  :label-text="module.tt('aggregation_function')"
                  :help-text="module.tt('aggregation_function_help')"
              >
                <radio-component
                        v-model="formData.aggregation_function"
                        :name="'aggregation_function'"
                        :values="['count', 'sum', 'mean', 'min', 'max']"
                        :defaultValue="'count'"
                        :labels="[module.tt('count'), module.tt('sum'), module.tt('mean'), module.tt('min'), module.tt('max')]"
                    ></radio-component>
              </helpful-parameter>
              <!-- Palette -->
              <helpful-parameter
                  :label-text="module.tt('palette')"
                  :help-text="module.tt('palette_help')"
              >
                <palette-selector
                        v-model="formData.palette_brewer"
                    ></palette-selector>
              </helpful-parameter>
          </div>
        </div>
      </form>
  </template>
  
  <script>
  import HelpfulParameter from "@/components/HelpfulParameter.vue";
  import InstrumentSelector from "@/components/InstrumentSelector.vue";
  import RadioComponent from "@/components/RadioComponent.vue";
  import CategoricalFieldSelector from "@/components/CategoricalFieldSelector.vue";
  import NumericFieldSelector from "@/components/NumericFieldSelector.vue";
  import PaletteSelector from "@/components/PaletteSelector.vue";
  import { isCategoricalField } from "@/utils";

  export default {
    components: {
      HelpfulParameter,
      InstrumentSelector,
      RadioComponent,
      CategoricalFieldSelector,
      NumericFieldSelector,
      PaletteSelector,
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
        const graph_type_selected = this.formData.graph_type == 'stacked' || this.formData.graph_type == 'grouped';
        const categorical_field_one_selected = (typeof this.formData.categorical_field_one !== 'undefined') && this.formData.categorical_one_field !== null;
        const categorical_field_two_selected = (typeof this.formData.categorical_field_two !== 'undefined') && this.formData.categorical_two_field !== null;
        const numeric_field_selected = (typeof this.formData.numeric_field !== 'undefined') && this.formData.numeric_field !== null;
        const na_category_one_selected = (typeof this.formData.na_category_one !== 'undefined') && this.formData.na_category_one !== null;
        const na_category_two_selected = (typeof this.formData.na_category_two !== 'undefined') && this.formData.na_category_two !== null;
        const unused_categories_selected = (typeof this.formData.unused_categories !== undefined) && this.formData.unused_categories !== null;
        const aggregation_function_selected = (typeof this.formData.aggregation_function !== 'undefined') && this.formData.aggregation_function !== null;
        // console.log('isFormReady', instrument_selected, graph_type_selected, categorical_field_selected, numeric_field_selected, na_category_selected, 'unused', unused_categories_selected, 'agg', aggregation_function_selected);
        // If any of the required fields are not selected, return false
        if (!instrument_selected || !graph_type_selected || !categorical_field_one_selected || !categorical_field_two_selected || !numeric_field_selected || !na_category_one_selected || !na_category_two_selected || !unused_categories_selected) {
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

        // console.log('isFormReady', true);
        // Return true if there are enough selected parameters to create a bar or pie graph
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
        // console.log('isReady', newVal);
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
          // Get the fields for this instrument
          const fields = report_fields_by_repeat_instrument[instrument_name].fields;
          // Count the number of categorical fields
          let count = 0;
          for (const field of fields) {
          if (isCategoricalField(field)) {
              count++;
          }
          }
          // If there are at least two categorical fields
          if (count >= 2) {
          // Return true
          return true;
          }
  
          return false;
      },
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