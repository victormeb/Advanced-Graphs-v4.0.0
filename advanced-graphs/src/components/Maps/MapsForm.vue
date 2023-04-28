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
              <!-- Coordinate Selector -->
              <helpful-parameter
                  :label-text="module.tt('map_coordinate_selector')"
                  :help-text="module.tt('map_coordinate_selector_help')">
                  <coordinate-selector
                      v-model="formData.coordinate_selector"
                      :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                  >

                  </coordinate-selector>
              </helpful-parameter>
            </div>
            <div class="AG-pane-right">
              <!-- Cluster by Location or Counts -->
              <helpful-parameter
                  :label-text="module.tt('map_cluster_by_location_or_counts')"
                  :help-text="module.tt('map_cluster_by_location_or_counts_help')"
              >
                  <radio-component
                      v-model="formData.cluster_by_location_or_counts"
                      :name="'cluster_by_location_or_counts'"
                      :values="['location', 'counts']"
                      :defaultValue="'location'"
                      :labels="[module.tt('map_location'), module.tt('map_counts')]"
                  ></radio-component>
              </helpful-parameter>
              <div v-if="formData.cluster_by_location_or_counts == 'location'">
                <!-- Location Identifier -->
                <helpful-parameter
                    :label-text="module.tt('map_location_identifier')"
                    :help-text="module.tt('map_location_identifier_help')"
                >
                    <unique-location-identifier
                        v-model="formData.location_identifier"
                        :coordinateFields="formData.coordinate_selector"
                        :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                    ></unique-location-identifier>
                </helpful-parameter>
                <!-- Numeric Field -->
                <helpful-parameter
                    :label-text="module.tt('map_location_weight')"
                    :help-text="module.tt('map_location_weight_help')"
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
                    :label-text="module.tt('map_na_numeric')"
                    :help-text="module.tt('map_na_numeric_help')"
                >
                  <radio-component
                          v-model="formData.na_numeric"
                          :name="'na_numeric'"
                          :values="['drop', 'replace']"
                          :defaultValue="'drop'"
                          :labels="[module.tt('map_drop'), module.tt('map_replace')]"
                      ></radio-component>
                  <input type="number" v-if="formData.na_numeric === 'replace'" v-model="formData.na_numeric_value" />
                </helpful-parameter>
                <!-- Aggregation Function -->
                <helpful-parameter
                    v-if="formData.numeric_field !== null 
                      && typeof formData.numeric_field === 'string' 
                      && formData.is_count != true"
                    :label-text="module.tt('map_aggregation_function')"
                    :help-text="module.tt('map_aggregation_function_help')"
                >
                  <radio-component
                          v-model="formData.aggregation_function"
                          :name="'aggregation_function'"
                          :values="['count', 'sum', 'mean', 'min', 'max']"
                          :defaultValue="'count'"
                          :labels="[module.tt('count'), module.tt('sum'), module.tt('mean'), module.tt('min'), module.tt('max')]"
                      ></radio-component>
                </helpful-parameter>
              </div>
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
        </div>
      </form>
  </template>
  
  <script>
  import HelpfulParameter from "@/components/HelpfulParameter.vue";
  import InstrumentSelector from "@/components/InstrumentSelector.vue";
  import RadioComponent from "@/components/RadioComponent.vue";
  // import CategoricalFieldSelector from "@/components/CategoricalFieldSelector.vue";
  import NumericFieldSelector from "@/components/NumericFieldSelector.vue";
  import PaletteSelector from "@/components/PaletteSelector.vue";
  import CoordinateSelector from "./CoordinateSelector.vue";
  import UniqueLocationIdentifier from "./UniqueLocationIdentifier.vue";
  import { getCoordinateFields } from "@/utils";

  export default {
    components: {
      HelpfulParameter,
      InstrumentSelector,
      RadioComponent,
      // CategoricalFieldSelector,
      NumericFieldSelector,
      CoordinateSelector,
      UniqueLocationIdentifier,
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
        const coordinate_field_selected = (typeof this.formData.coordinate_selector !== 'undefined') && this.formData.coordinate_selector !== null;

        const cluster_by_location_or_counts_selected = (typeof this.formData.cluster_by_location_or_counts !== 'undefined') && this.formData.cluster_by_location_or_counts !== null;

        const location_identifier_selected = (typeof this.formData.location_identifier !== 'undefined') && this.formData.location_identifier !== null;

        const numeric_field_selected = (typeof this.formData.numeric_field !== 'undefined') && this.formData.numeric_field !== null;
        const aggregation_function_selected = (typeof this.formData.aggregation_function !== 'undefined') && this.formData.aggregation_function !== null;
        // console.log('isFormReady', instrument_selected, graph_type_selected, categorical_field_selected, numeric_field_selected, na_category_selected, 'unused', unused_categories_selected, 'agg', aggregation_function_selected);
        // If any of the required fields are not selected, return false
        if (!instrument_selected || !coordinate_field_selected || !cluster_by_location_or_counts_selected) {
          return false;
        }

        // If cluster_by_location_or_counts is set to location and location_identifier is not selected, return false
        if (cluster_by_location_or_counts_selected && this.formData.cluster_by_location_or_counts === 'location' && !location_identifier_selected) {
          return false;
        }

        // If cluster_by_location_or_counts is set to location, but no numeric field is selected, return false
        if (cluster_by_location_or_counts_selected && this.formData.cluster_by_location_or_counts === 'location' && !numeric_field_selected) {
          return false;
        }

        // If numeric field is selected, but no aggregation function is selected, return false
        if (numeric_field_selected && typeof this.formData.numeric_field === 'string' && this.formData.is_count != true && !aggregation_function_selected) {
          return false;
        }

        // Return true if there are enough selected parameters to create a map
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
        const coordinateFields = getCoordinateFields(report_fields_by_repeat_instrument[instrument_name].fields);
        console.log('instrumentCanCreate', instrument_name, coordinateFields, report_fields_by_repeat_instrument[instrument_name]);
        // If there are coordinate fields
        if (Object.keys(coordinateFields).length > 0) {
          // Return true
          return true;
        }
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