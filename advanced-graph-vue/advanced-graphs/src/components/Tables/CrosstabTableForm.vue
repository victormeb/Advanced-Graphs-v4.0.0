<template>
    <div>
        <div v-if="graphType == 'table'">
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
                      :name="'unused_categories_two'"
                      :values="['keep', 'drop']"
                      :defaultValue="'keep'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
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
        </div>
        <div>
            <!-- Percents or Totals -->
            <helpful-parameter
                :label-text="module.tt('table_percents_or_totals')"
                :help-text="module.tt('table_percents_or_totals_help')"
            >
                <radio-component
                    v-model="formData.percents_or_totals"
                    :name="'percents_or_totals'"
                    :values="['totals', 'percents', 'both']"
                    :defaultValue="formData.percents_or_totals || 'totals'"
                    :labels="[module.tt('table_totals'), module.tt('table_percents'), module.tt('table_both')]"
                ></radio-component>
            </helpful-parameter>
            <!-- Row Column or Table -->
            <helpful-parameter
                v-if="formData.percents_or_totals === 'both' || formData.percents_or_totals === 'percents'"
                :label-text="module.tt('table_row_column_or_table')"
                :help-text="module.tt('table_row_column_or_table_help')"
                >
                <radio-component
                    v-model="formData.row_column_or_table"
                    :name="'row_column_or_table'"
                    :values="['row', 'column', 'table']"
                    :defaultValue="formData.row_column_or_table || 'table'"
                    :labels="[module.tt('table_row'), module.tt('table_column'), module.tt('table_table')]"
                ></radio-component>
            </helpful-parameter>
        </div>
    </div>
</template>

<script>
    import CategoricalFieldSelector from "@/components/CategoricalFieldSelector.vue";
    import NumericFieldSelector from "@/components/NumericFieldSelector.vue";
    import RadioComponent from "@/components/RadioComponent.vue";
    import HelpfulParameter from "@/components/HelpfulParameter.vue";

    export default {
        name: "CrosstabTableForm",
        inject: ["module", "report_fields_by_repeat_instrument"],
        components: {
            CategoricalFieldSelector,
            NumericFieldSelector,
            RadioComponent,
            HelpfulParameter,
        },
        props: {
            cellData: {
                type: Object,
                default: null,
            },
            graphType: {
                type: String,
                default: null,
            }
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
                return (
                    this.formData.table_type &&
                    this.formData.field

                );
            },
        },
        methods: {
            updateCellData(data) {
                this.formData = { ...this.formData, ...data };
                this.$emit("updateCellData", this.formData);
            },
        },
    }
</script>