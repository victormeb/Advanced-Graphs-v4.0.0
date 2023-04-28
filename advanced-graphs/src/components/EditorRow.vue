<!-- EditorRow.vue -->
<template>
    <div class="AG-editor-row">
      <div class="AG-add-cell-button">
        <button class="btn btn-primary" @click="addCell">+</button>
      </div>
      <div class="AG-editor-row-cells">
        <editor-cell
          v-for="(cell, index) in row"
          :cell="cell"
          :key="cell.id"
          @updateCell="updateCell(index, $event)"
          @moveCellLeft="moveCellLeft(index)"
          @moveCellRight="moveCellRight(index)"
          @deleteCell="deleteCell(index)"
          @addCellRight="addCellRight(index)"
        ></editor-cell>
      </div>
      <div class="AG-editor-row-buttons">
        <button class="btn AG-editor-row-button-up" @click="$emit('moveRowUp')">
          <i class="fa fa-arrow-up" aria-hidden="true"></i>
        </button>
        <button class="btn AG-editor-row-button-down" @click="$emit('moveRowDown')">
          <i class="fa fa-arrow-down" aria-hidden="true"></i>
        </button>
        <button class="btn AG-editor-row-button-delete" @click="$emit('removeRow')">
          <i class="fa fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import EditorCell from './EditorCell.vue';
  
  export default {
    name: 'EditorRow',
    components: {
      EditorCell,
    },
    props: {
      row: {
        type: Array,
        default: null,
      },
    },
    computed: {
      rowCells() {
        return this.row || [];
      },
    },
    methods: {
      addCell() {
        this.$emit('updateRow', [{}, ...this.rowCells]);
      },
        updateCell(index, cell) {
            this.$emit('updateRow', [
            ...this.rowCells.slice(0, index),
            cell,
            ...this.rowCells.slice(index + 1),
            ]);
        },
        async moveCellLeft(index) {
            if (index === 0) {
            return;
            }
            this.$emit('updateRow', [
            ...this.rowCells.slice(0, index - 1),
            this.rowCells[index],
            this.rowCells[index - 1],
            ...this.rowCells.slice(index + 1),
            ]);
        },
        async moveCellRight(index) {
            if (index === this.rowCells.length - 1) {
            return;
            }
            this.$emit('updateRow', [
            ...this.rowCells.slice(0, index),
            this.rowCells[index + 1],
            this.rowCells[index],
            ...this.rowCells.slice(index + 2),
            ]);
        },
        deleteCell(index) {
            this.$emit('updateRow', [
            ...this.rowCells.slice(0, index),
            ...this.rowCells.slice(index + 1),
            ]);
        },
        addCellRight(index) {
            this.$emit('updateRow', [
            ...this.rowCells.slice(0, index + 1),
            {},
            ...this.rowCells.slice(index + 1),
            ]);
        },
    },
  };
  </script>

  <style scoped>
    .AG-editor-row-cells {
      grid-area: graphSelectors;
      display: flex;
      overflow: auto;
      align-items: flex-start;
    }
  </style>