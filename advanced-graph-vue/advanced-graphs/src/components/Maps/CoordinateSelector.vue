<!-- CoordinateSelector.vue -->
<template>
    <div>
        <h2>{{ module.tt('map_longitude') }}</h2>
        <select v-model="currentField">
            <option :value="null" :selected="true"> {{ module.tt('select_a_field') }} </option>
            <option v-for="(field, index) in coordinateFields" 
                :key="index" 
                :value="JSON.stringify(field)" 
                :selected="currentField==JSON.stringify(field)">
                    {{ stripHtml(field.longitude.field_label) }}
            </option>
        </select>
        <h2>{{ module.tt('map_latitude') }}</h2>
        <select v-model="currentField">
            <option :value="null" :selected="true"> {{ module.tt('select_a_field') }} </option>
            <option v-for="(field, index) in coordinateFields" 
                :key="index" 
                :value="JSON.stringify(field)" 
                :selected="currentField==JSON.stringify(field)">
                    {{ stripHtml(field.latitude.field_label) }}
            </option>
        </select>
    </div>
</template>

<script>
import { getCoordinateFields, stripHtml } from '@/utils.js'

export default {
    name: 'CoordinateSelector',
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
        coordinateFields() {
            return getCoordinateFields(this.fields);
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