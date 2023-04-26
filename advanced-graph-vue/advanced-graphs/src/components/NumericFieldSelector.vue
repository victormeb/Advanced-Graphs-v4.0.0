<!-- CategoricalFieldSelector.vue -->
<template>
    <div>
        <select v-model="currentField">
            <option :value="null" :selected="true"> {{ module.tt('select_a_field') }} </option>
            <option v-for="(field, index) in numericFields" 
                :key="index" 
                :value="field.field_name" 
                :selected="currentField==field">
                    {{ stripHtml(field.field_label) }}
            </option>
            <optgroup :label="module.tt('count')">
                <option
                :value="''" 
                :selected="currentField==''">
                    {{ module.tt('count') }}
                </option>
            </optgroup>
        </select>
        
    </div>
</template>

<script>
import { getNumericFields, stripHtml } from '../utils.js'

export default {
    name: 'CategoricalFieldSelector',
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