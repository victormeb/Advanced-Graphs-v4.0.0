<!-- HelpModal.vue -->
<template>
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <slot></slot>
          <button type="button" class="close-button" @click="$emit('close')">
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HelpModal'
  };
  </script>
  
  <style scoped>
  .modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: table;
    transition: opacity 0.3s ease;
  }
  
  .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
  }
  
  .modal-container {
    width: 600px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }

  .close-button {
    float: right;
    margin-top: -20px;
    margin-right: -20px;
    background-color: #fff;
    border: none;
    font-size: 1.5em;
  }
  </style>