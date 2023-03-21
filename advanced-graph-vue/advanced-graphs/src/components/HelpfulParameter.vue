<!-- HelpfulParameter.vue -->
<template>
    <div class="helpful-container">
      <label>
        {{ labelText }}
        <button type="button" @click="showModal = true">
          <i class="fa fa-question-circle" aria-hidden="true"></i>
        </button>
      </label>
      <div class="parameter-container">
        <slot></slot>
      </div>
      <help-modal v-if="showModal" @close="showModal = false">
        <h3>{{ labelText }}</h3>
        <p>{{ helpText }}</p>
      </help-modal>
    </div>
  </template>
  
  <script>
  import HelpModal from './HelpModal.vue';
  
  export default {
    name: 'HelpfulParameter',
    components: {
      HelpModal
    },
    props: {
      labelText: {
        type: String,
        required: true
      },
      helpText: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        showModal: false
      };
    }
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

  label {
    font-weight: bold;
  }

  .helpful-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    border: 2px solid #ccc;
  }

  .helpful-container label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .helpful-container .parameter-container {
    display: flex;
    flex-direction: column;
    padding: 10px;
    border: 1px solid #ccc;
  }
  </style>