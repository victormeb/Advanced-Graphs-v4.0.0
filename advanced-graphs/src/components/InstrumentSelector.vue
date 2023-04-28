<template>
  <div>
    <label for="instrument">{{module.tt('instrument_selector_label')}}:</label>
      <br>
      <select name="instrument" v-model="selectedInstrument" @change="onInstrumentChange">
        <option :selected="true" :value="null">--{{module.tt('instrument_selector_select_an_instrument')}} --</option>
        <option v-for="(instrument, instrument_name) in availableInstruments" :key="instrument_name" :value="instrument_name" :selected="selectedInstrument===instrument_name">
          {{ instrument.label }}
        </option>
      </select>
  </div>
</template>
  
  <script>
  export default {
    name: "InstrumentSelector",
    inject: ["module"],
    props: {
      availableInstruments: {
        type: Object,
        default: null,
      },
      modelValue: {
        type: String,
        default: null,
      },
    },
    data() {
      return {
        selectedInstrument: this.modelValue,
      };
    },
    methods: {
      onInstrumentChange() {
        this.$emit("update:modelValue", this.selectedInstrument);
      },
    },
  };
</script>

  <style scoped>
    label {
      font-weight: bold;
    }

    select {
      width: 100%;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 5px;
      text-align-last: center;
    }

  </style>