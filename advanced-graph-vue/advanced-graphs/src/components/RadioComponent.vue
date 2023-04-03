<template>
  <div class="radio-container">
    <label class="radio-option" v-for="(value, index) in values" :key="index">
      <input
        type="radio"
        :value="value"
        :name="name"
        :checked="value === selectedValue"
        @change="selectedValue = value"
      />
      <span class="checkmark"></span>
      <span class="label-text">{{ labels ? labels[index] : value }}</span>
    </label>
  </div>
</template>
  
  <script>
  export default {
    name: "RadioComponent",
    props: {
      name: {
        type: String,
        required: false,
        defaultValue: null,
      },
      values: {
        type: Array,
        required: true,
      },
      modelValue: {
        type: String,
        required: false,
      },
      defaultValue: {
        type: String,
        required: false,
      },
      labels: {
        type: Array,
        required: false,
      },
    },
    data() {
      return {
        selectedValue: this.modelValue || this.defaultValue,
      };
    },
    mounted: function () {
      this.$emit("update:modelValue", this.selectedValue);
    },
    watch: {
      selectedValue(newVal) {
        this.$emit("update:modelValue", newVal);
      },
    },
  };
  </script>



<style scoped>
  .radio-container {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px;
  }
  .radio-option {
    flex-shrink: 0;
    margin-right: 10px;
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
  }


  /* Hide the default radio input */
  .radio-option input[type="radio"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  /* Create a custom radio button */
  .radio-option .checkmark {
    position: relative;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    background-color: #eee;
    border: 2px solid #ccc;
    border-radius: 50%;
    cursor: pointer;
  }

  /* On mouse-over, add a grey background color */
  .radio-option:hover input ~ .checkmark {
    background-color: #f1f1f1;
  }

  /* When the radio button is checked, add a blue background and a white dot */
  .radio-option input:checked ~ .checkmark {
    background-color: #2196F3;
    border-color: #2196F3;
  }

  .radio-option .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  /* Show the white dot when the radio button is checked */
  .radio-option input:checked ~ .checkmark:after {
    display: block;
  }

  /* Style the white dot */
  .radio-option .checkmark:after {
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: white;
    transform: translate(-50%, -50%);
  }

  .label-text {
    margin-left: 6px;
  }
</style>