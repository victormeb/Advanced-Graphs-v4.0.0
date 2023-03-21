<!-- CategoricalFieldSelector.vue -->
<template>
    <div>
        <select v-model="currentField">
            <option :value="null" :selected="true"> {{ module.tt('select_a_field') }} </option>
            <option v-for="(field, index) in radioFields" 
                :key="index" 
                :value="field.field_name" 
                :selected="currentField==field">
                    {{ field.field_label }}
            </option>
            <optgroup v-if="checkboxFields.length" :label="module.tt('checkbox')">
                <option v-for="(field, index) in checkboxFields" 
                :key="index" 
                :value="field.field_name" 
                :selected="currentField==field">
                    {{ field.field_label }}
                </option>
            </optgroup>

        </select>
    </div>
</template>

<script>
import { getRadioFields, getCheckboxFields } from '../utils.js'

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
        };
    },
    computed: {
        radioFields() {
            return getRadioFields(this.fields);
        },
        checkboxFields() {
            return getCheckboxFields(this.fields);
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