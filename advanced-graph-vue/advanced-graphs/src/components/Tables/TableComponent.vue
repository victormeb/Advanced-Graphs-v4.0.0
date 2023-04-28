<!-- TableComponent.vue -->
<template>
    <div class="AG-graph-container">
        <div class="AG-graph-title">
            <h3>{{ parameters.title || "" }}</h3>
        </div>
        <summary-table
            v-if="parameters.table_type === 'summary'"
            :parameters="parameters"
        ></summary-table>
        <crosstab-table
            v-else-if="parameters.table_type === 'crosstab'"
            :parameters="parameters"
        ></crosstab-table>
        <div class="AG-graph-description">
            <p>{{ parameters.description || ""}}</p>
        </div>
    </div>
</template>

<script>
import SummaryTable from '@/components/Tables/SummaryTable.vue';
import CrosstabTable from '@/components/Tables/CrosstabTable.vue';

export default {
    name: 'TableComponent',
    components: {
        SummaryTable,
        CrosstabTable,
    },
    inject: ['module', 'data_dictionary', 'report'],
    props: {
        parameters: {
            type: Object,
            required: true
        },
        editorMode: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            title: this.parameters.title || "",
            description: this.parameters.description || ""
        };
    }
};
</script>

<style scoped>
    .AG-graph-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .AG-graphContainer {
        min-width: 640px;
        min-height: 480px;
        width: auto;
        height: auto;
    }
    .AG-graphContainer svg {
        max-width: unset !important;
    }
</style>