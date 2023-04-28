<template>
    <div>
        <select v-model="currentField">
            <optgroup :label="module.tt('map_none')">
                <option
                :value="''" 
                :selected="currentField==''">
                    {{ module.tt('map_none') }}
                </option>
            </optgroup>
            <optgroup :label="module.tt('map_categories')">
                <option v-for="(field, index) in uniqueRadioFields" 
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
    import { getRadioFields, stripHtml} from '@/utils';

    export default {
        name: 'UniqueLocationIdentifier',
        inject: ['module', 'report'],
        props: {
            coordinateFields: {
                type: String,
                default: null,
            },
            modelValue: {
                type: String,
                default: null,
            },
            fields: {
                type: Array,
                default: () => [],
            },
        },
        data() {
            // Get the fields which uniquly identify a location in the report
            // and return them as a list of fields

            // Get the current coordinate fields
            

            return {
                currentField: this.modelValue,
                stripHtml,
            };
        },
        computed: {
            uniqueRadioFields() {
                // If stripped_name is null, return an empty list
                if (this.coordinateFields == null) {
                    return [];
                }

                // Get the coordinate fields
                const coordinateFields = JSON.parse(this.coordinateFields);

                // Get the list of radio fields
                var radioFields = getRadioFields(this.fields);

                // Create a map of locations to the radio fields
                var locationToRadioFields = {};

                // Loop over the report
                for (var i = 0; i < this.report.length; i++) {
                    // Get the current row
                    var row = this.report[i];

                    // Get the current location
                    var location = row[coordinateFields.longitude.field_name] + ',' + row[coordinateFields.latitude.field_name];

                    // If the location is not in the map, add it
                    if (!(location in locationToRadioFields)) {
                        locationToRadioFields[location] = [];
                    }

                    // Loop over the radio fields
                    for (var j = 0; j < radioFields.length; j++) {
                        // Get the current radio field
                        var radioField = radioFields[j];

                        // If the radio field is not in the map, add it
                        if (!(radioField.field_name in locationToRadioFields[location])) {
                            locationToRadioFields[location][radioField.field_name] = [];
                        }

                        // If the current value for the radio field is not in the map, add it
                        if (!locationToRadioFields[location][radioField.field_name].includes(row[radioField.field_name])) {
                            locationToRadioFields[location][radioField.field_name].push(row[radioField.field_name]);
                        }
                    }
                }

                // Create a list of radio fields for which each location has a unique value
                var uniqueRadioFields = [];

                // Loop over the radio fields
                for (i = 0; i < radioFields.length; i++) {
                    // Get the current radio field
                    radioField = radioFields[i];
                    var unique = true;

                    // Loop over the locations
                    for (location in locationToRadioFields) {
                        // If the current location has more than one value for the current radio field, skip it
                        if (locationToRadioFields[location][radioField.field_name].length > 1) {
                            unique = false;
                            break;
                        }
                    }

                    // If the current radio field is unique, add it to the list
                    if (unique) {
                        uniqueRadioFields.push(radioField);
                    }
                }

                // Return the list of unique radio fields
                return uniqueRadioFields;
            },
        },
        watch: {
            currentField() {
                this.$emit('update:modelValue', this.currentField);
            },
        },
        methods: {
            coordinateHash(lng, lat) {
                return lng + ',' + lat;
            }
        }
    };
</script>

<style scoped>
    select {
        width: 100%;
        height: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
        padding: 6px 10px;
        font-size: 14px;
    }
</style>