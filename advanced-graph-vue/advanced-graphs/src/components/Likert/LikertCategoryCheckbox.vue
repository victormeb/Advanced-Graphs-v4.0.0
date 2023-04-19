<template>
    <div>
        <div v-for="field in categoricalFields" :key="field.field_name" >
            <label>{{ field.field_label }}</label>
            <input type="checkbox" :value="field.field_name" v-model="selectedFields" @change="onCheckboxChange" />
        </div>
        <p>{{ selectedFields }}</p>
        <!-- Select All -->
        <label>{{ module.tt('select_all') }}</label>
        <input type="checkbox" v-model="selectAll" @change="selectAllToggle" />
    </div>
</template>

<script>
export default {
    name: 'LikertCategoryCheckbox',
    inject: ['module'],
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        categoricalFields: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            selectedFields: this.categoricalFields.map(field => field.field_name),
            selectAll: this.modelValue.length === this.categoricalFields.length
        }
    },
    watch: {
        selectedFields() {
            this.$emit('update:modelValue', this.selectedFields);
        },
    },
    mounted() {
        this.$emit('update:modelValue', this.selectedFields);
    },
    methods: {
        onCheckboxChange() {
            // Check if all the fields are selected
            if (this.selectedFields.length === this.categoricalFields.length) {
                this.selectAll = true;
            } else {
                this.selectAll = false;
            }

            this.$emit('update:modelValue', this.selectedFields);
        },
        selectAllToggle() {
            // Select all the fields
            console.log('categoricalFields', this.categoricalFields);
            console.log('selectedFields', this.selectedFields);
            console.log('selectAll', this.selectAll);
            if (this.selectAll) {
                this.selectedFields = this.categoricalFields.map(field => field.field_name);
            } else {
                this.selectedFields = [];
            }


            this.$emit('update:modelValue', this.selectedFields);
        }
    }
}
</script>