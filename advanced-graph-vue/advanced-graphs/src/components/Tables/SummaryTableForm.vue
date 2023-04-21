<template>
    <div>
        <div v-if="graphType == 'table'">
            <!-- Categorical Field Selector -->
            <helpful-parameter
                :label-text="module.tt('table_categorical_field')"
                :help-text="module.tt('table_categorical_field_help')">
                <categorical-field-selector
                    v-model="formData.categorical_field"
                    :fields="report_fields_by_repeat_instrument[formData.instrument].fields"
                ></categorical-field-selector>
            </helpful-parameter>
            <!-- NA Category -->
            <helpful-parameter
                  :label-text="module.tt('na_category')"
                  :help-text="module.tt('na_category_help')"
            >
                <radio-component
                        v-model="formData.na_category"
                        :name="'na_category'"
                        :values="['keep', 'drop']"
                        :defaultValue="'keep'"
                        :labels="[module.tt('keep'), module.tt('drop')]"
                ></radio-component>
            </helpful-parameter>
            <!-- Unused Categories -->
            <helpful-parameter
                :label-text="module.tt('unused_categories')"
                :help-text="module.tt('unused_categories_help')"
            >
                <radio-component
                        v-model="formData.unused_categories"
                        :name="'unused_categories'"
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
                    :defaultValue="formData.aggregation_function || 'count'"
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
        </div>
    </div>
</template>

<script>
    import HelpfulParameter from "@/components/HelpfulParameter.vue";
    import RadioComponent from "@/components/RadioComponent.vue";
    import CategoricalFieldSelector from "@/components/CategoricalFieldSelector.vue";
    import NumericFieldSelector from "@/components/NumericFieldSelector.vue"; 

    export default {
        name: "SummaryTableForm",
        components: {
            HelpfulParameter,
            RadioComponent,
            CategoricalFieldSelector,
            NumericFieldSelector,
        },
        inject: ["module", "report_fields_by_repeat_instrument"],
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