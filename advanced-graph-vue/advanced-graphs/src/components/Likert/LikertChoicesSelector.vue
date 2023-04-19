<template>
    <div>
        <select v-model="selectedChoices">
            <option value="" disabled>{{module.tt('select_choices')}}</option>
            <option v-for=" (option, index) in options" :key="index" :value="option">{{ option }}</option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'LikertChoicesSelector',
    props: {
        modelValue: {
            type: String,
            default: ""
        },
        options: {
            type: Array,
            default: () => []
        }
    },
    inject: ['module'],
    data() {
        return {
            selectedChoices: this.modelValue
        }
    },
    watch: {
        selectedChoices() {
            this.$emit('update:modelValue', this.selectedChoices);
        },
    },
}
</script>

<style>
    select {
        width: 100%;
    }
</style>