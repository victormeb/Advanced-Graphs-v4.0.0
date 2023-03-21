<!-- EditorTable.vue -->
<template>
    <div class="AG-editor-table" ref="editorTable">
      <editor-row
        v-for="(row, index) in rows"
        :key="index"
        :row="row"
        @moveRowUp="moveRowUp(index)"
        @moveRowDown="moveRowDown(index)"
        @updateRow="updateRow(index, $event)"
        @removeRow="deleteRow(index)"
      ></editor-row>
      <!-- A button to add a row -->
      <div class="AG-editor-row">
        <div class="AG-add-cell-button">
          <button class="btn btn-primary" @click="addRow">{{module.tt('add_row')}}</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import EditorRow from './EditorRow.vue';

  export default {
    name: 'EditorTable',
    inject: ['module'],
    components: {
      EditorRow,
    },
    props: {
      rows: {
        type: Array,
        default: null,
      },
    },
    methods: {
        moveRowUp(index) {
          this.$emit('moveRowUp', index);
        },
        moveRowDown(index) {
          this.$emit('moveRowDown', index);
        },
        async updateRow(index, row) {
          this.$emit('updateRow', { index, row });
          await this.$nextTick();
        },
        deleteRow(index) {
          this.$emit('removeRow', index);
        },
        addRow() {
            this.$emit('addRow');
        },
    },
  };
  </script>

  <style>
    .AG-editor-row {
      display: grid;
      grid-template-rows: 0.1fr 1fr;
      grid-template-columns: 0.1fr 0.8fr 0.1fr;
      grid-template-areas:
          "addButton graphSelectors rowButtons"
          ". graphSelectors .";
      width: 100%;
      min-height: 60px;
      align-items: start;
    }

    .AG-add-cell-button {
      float: left;
      margin-right: 10px;
    }
  </style>

