<!-- ScatterFieldSelector.vue -->
<template>
    <div>
        <select v-model="currentField">
            <option :value="null" :selected="true"> -- {{ module.tt('sfs_select_a_field') }} -- </option>
            <optgroup v-if="numericFields.length" :label="module.tt('sfs_numeric')">
                <option v-for="(field, index) in numericFields" 
                    :key="index" 
                    :value="field.field_name" 
                    :selected="currentField==field">
                        {{ stripHtml(field.field_label) }}
                </option>
            </optgroup>
            <optgroup v-if="dateFields.length" :label="module.tt('sfs_date')">
                <option v-for="(field, index) in dateFields" 
                :key="index" 
                :value="field.field_name" 
                :selected="currentField==field">
                    {{ stripHtml(field.field_label) }}
                </option>
            </optgroup>

        </select>
    </div>
</template>

<script>
import { getNumericFields, getDateFields, stripHtml } from '@/utils.js'

export default {
    name: 'ScatterFieldSelector',
    inject: ['module'],
    props: {
        fields: {
            type: Array,
            default: () => [],
        },
        modelValue: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            currentField: this.modelValue,
            stripHtml,
        };
    },
    computed: {
        numericFields() {
            return getNumericFields(this.fields);
        },
        dateFields() {
            return getDateFields(this.fields);
        },
    },
    watch: {
        currentField() {
            this.$emit('update:modelValue', this.currentField);
        },
    },
};
</script>

<style scoped>
    select {
        width: 100%;
    }
</style>