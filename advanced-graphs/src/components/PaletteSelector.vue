<!-- PaletteSelector.vue -->
<template>
    <div>
        <button type="button" @click="showModal = true">
          {{ module.tt('palette_select_color') }}
        </button>
      <slot></slot>
      <help-modal v-if="showModal" @close="showModal = false">
        <h3>{{ module.tt("palette_palette_selector") }}</h3>
        <div class="palette-container">
          <button type="button" @click="colors.splice(0, 0, '#000000')"><i class="fa fa-plus" aria-hidden="true"></i></button>
          <div class="color-container" v-for="(color, index) in colors" :key="index">
            <button type="button" @click="colors.splice(index, 1)"><i class="fa fa-times" aria-hidden="true"></i></button>
            <input type="color" v-model="colors[index]"/>
            <button type="button" @click="colors.splice(index+1, 0, '#000000')"><i class="fa fa-plus" aria-hidden="true"></i></button>
          </div>
        </div>
      </help-modal>
    </div>
  </template>
  
  <script>
  import HelpModal from './HelpModal.vue';
  
  export default {
    name: 'PaletteSelector',
    components: {
      HelpModal
    },
    inject: ['module'],
    props: {
      modelValue: {
        type: Array,
        default: () => ["#7734EA", "#00A7EA", "#8AE800", "#FAF100", "#FFAA00", "#FF0061"],
      }
    },
    data() {
      return {
        colors: this.modelValue,
        showModal: false,
      };
    },
    mounted() {
      this.$emit('update:modelValue', this.colors);
    },
    watch: {
      colors() {
        this.$emit('update:modelValue', this.colors);
      },
    },
  };
  </script>

  <style scoped>
  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  .palette-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px; /* Optional: add a gap between the elements */
  }

  .color-container {
    display: flex;
    align-items: center; /* Add this line to align the items vertically */
  }
  </style>