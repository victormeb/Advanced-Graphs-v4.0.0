<!-- BarGraphForm.vue -->
<template>
    <form>
      <!-- Your form elements for gathering the required parameters -->
      <instrument-selector
        v-model="formData.instrument"
        :availableInstruments="availableInstruments"
        ></instrument-selector>
        <div v-if="formData.instrument !== null && typeof formData.instrument === 'string'">
            <div class="AG-two-panes">
              <div class="AG-pane-left">
              <!-- Title -->
              <helpful-parameter
                  :label-text="module.tt('title')"
                  :help-text="module.tt('title_help')">
                  <input type="text" v-model="formData.title">
              </helpful-parameter>
              <!-- Description -->
              <helpful-parameter
                  :label-text="module.tt('description')"
                  :help-text="module.tt('description_help')">
                  <input type="text" v-model="formData.description">
              </helpful-parameter>
              <!-- Choices -->
              <helpful-parameter
                  :label-text="module.tt('likert_choices')"
                  :help-text="module.tt('likert_choices_help')">
                  <likert-choices-selector
                      v-model="formData.likert_choices"
                      :options="Object.keys(likertChoices)"
                  ></likert-choices-selector>
              </helpful-parameter>
              <!-- NA Category -->
              <helpful-parameter
                  :label-text="module.tt('na_category')"
                  :help-text="module.tt('na_category_help')"
              >
              <radio-component
                      v-model="formData.na_category"
                      :name="'na_category'"
                      :values="['keep', 'drop']"
                      :defaultValue="'drop'"
                      :labels="[module.tt('keep'), module.tt('drop')]"
                  ></radio-component>
              </helpful-parameter>
            </div>
            <div class="AG-pane-right">
              <!-- Category Checkbox -->
              <helpful-parameter
                  v-if="formData.likert_choices"
                  :label-text="module.tt('category_checkbox')"
                  :help-text="module.tt('category_checkbox_help')"
              >
                <likert-category-checkbox
                        v-model="formData.category_fields"
                        :categoricalFields="selectedOptionFields"
                    ></likert-category-checkbox>
              </helpful-parameter>
              <!-- Palette -->
              <helpful-parameter
                  :label-text="module.tt('palette')"
                  :help-text="module.tt('palette_help')"
              >
                <palette-selector
                        v-model="formData.palette_brewer"
                    ></palette-selector>
              </helpful-parameter>
            </div>
          </div>
        </div>
      </form>
  </template>
  
  <script>
  import HelpfulParameter from "@/components/HelpfulParameter.vue";
  import InstrumentSelector from "@/components/InstrumentSelector.vue";
  import RadioComponent from "@/components/RadioComponent.vue";
  import LikertChoicesSelector from "@/components/Likert/LikertChoicesSelector.vue";
  import LikertCategoryCheckbox from "@/components/Likert/LikertCategoryCheckbox.vue";
  import PaletteSelector from "@/components/PaletteSelector.vue";
  import { isCategoricalField } from "@/utils";

  export default {
    components: {
      HelpfulParameter,
      InstrumentSelector,
      RadioComponent,
      LikertChoicesSelector,
      LikertCategoryCheckbox,
      PaletteSelector,
    },
    inject: ["module", "report_fields_by_repeat_instrument"],
    props: {
      cellData: {
        type: Object,
        default: null,
      },
    },
    mounted() {
      this.$emit("isReady", this.isFormReady);
    },
    data() {
      return {
        formData: this.cellData || {palette_brewer: ["green", "yellow", "red"]},
        likert_key_words: ["not useful", "not at all useful", "difficult", "none of my needs", "strongly disagree", "somewhat disagree", "completely disagree", "quite dissatisfied", "very dissatisfied", "Extremely dissatisfied", "poor", "never", "worse", "severely ill", "inutil", "infatil", "completamente inutil", "completamente infatil", "dificil", "ninguna de mis necesidades", "totalmente en desacuerdo", "parcialemnte en desacuerdo", "completamente en desacuerdo", "muy insatisfecho(a)", "totalmente insatisfecho(a)", "nunca", "peor", "gravemente enfermo"]
      };
    },
    computed: {
      isFormReady() {
        // console.log('formData', this.formData);
        const instrument_selected = (typeof this.formData.instrument !== 'undefined') && this.formData.instrument !== null;
        const likert_choices_selected = (typeof this.formData.likert_choices !== 'undefined') && this.formData.likert_choices !== null;
        const na_category_selected = (typeof this.formData.na_category !== 'undefined') && this.formData.na_category !== null;
        const unused_categories_selected = (typeof this.formData.unused_categories !== undefined) && this.formData.unused_categories !== null;

        // If any of the required fields are not selected, return false
        if (!instrument_selected  || !likert_choices_selected || !na_category_selected || !unused_categories_selected) {
          console.log('required fields not selected');
          return false;
        }

        // If there are no category fields selected, return false
        if (!this.formData.category_fields || this.formData.category_fields.length === 0) {
          console.log('no category fields selected');
          return false;
        }

        console.log('isFormReady', true);

        return true;
      },
      availableInstruments() {
        const instruments = {};
        for (const instrument in this.report_fields_by_repeat_instrument) {
          if (this.instrumentCanCreate(this.report_fields_by_repeat_instrument, instrument)) {
            instruments[instrument] = this.report_fields_by_repeat_instrument[instrument];
          }
        }
        return instruments;
      },
      likertChoices() {
        if (this.formData.instrument === null) {
          return {};
        }

        console.log('likertChoices', this.formData.instrument);

        // Group each field in the currently selected instrument by fields that contain the same choices
        const likertChoices = {};

        // For each field in the currently selected instrument
        for (const field of this.report_fields_by_repeat_instrument[this.formData.instrument].fields) {
          // Get the field's choices
          const choices = field.select_choices_or_calculations;

          // If the fields choices do not contain any of the likert key words, skip it
          if (!this.likert_key_words.some((word) => choices.toLowerCase().includes(word))) {
            continue;
          }

          // If the field has choices
          if (choices) {
            // If the likertChoices object does not have a key for the field's choices
            if (!likertChoices[choices]) {
              // Add a key for the field's choices
              likertChoices[choices] = [];
            }

            // Add the field to the likertChoices object
            likertChoices[choices].push(field);
          }
        }

        console.log('likertChoices', likertChoices);

        return likertChoices;
      },
      selectedOptionFields() {
        if (this.formData.instrument === null) {
          return [];
        }

        // Get the fields from the currently selected likert choices
        const fields = this.likertChoices[this.formData.likert_choices];

        // If there are no fields, return an empty array
        if (!fields) {
          return [];
        }

        // Return the fields that are categorical
        return fields.filter((field) => isCategoricalField(field));
      },
    },
    watch: {
      isFormReady(newVal) {
        // Emit an event with the new status whenever the conditions change
        this.$emit("isReady", newVal);
        // console.log('isReady', newVal);
      },
      formData: {
        handler(newVal) {
          newVal.is_count = newVal.numeric_field === "";

          // Emit an event with the new data whenever the form data changes
          this.$emit("updateCellData", newVal);
        },
        deep: true,
      },
    },
    methods: {
      isCreatable(report_fields_by_repeat_instrument) {
        // For each instrument in report_fields_by_reapeat_instrument
        for (const instrument in report_fields_by_repeat_instrument) {
          // If there is a categorical field
          if (this.instrumentCanCreate(report_fields_by_repeat_instrument, instrument)) {
            // Return true
            return true;
          }
        }
      },
      instrumentCanCreate(report_fields_by_repeat_instrument, instrument_name) {
        const likert_key_words = ["not useful", "not at all useful", "difficult", "none of my needs", "strongly disagree", "somewhat disagree", "completely disagree", "quite dissatisfied", "very dissatisfied", "Extremely dissatisfied", "poor", "never", "worse", "severely ill", "inutil", "infatil", "completamente inutil", "completamente infatil", "dificil", "ninguna de mis necesidades", "totalmente en desacuerdo", "parcialemnte en desacuerdo", "completamente en desacuerdo", "muy insatisfecho(a)", "totalmente insatisfecho(a)", "nunca", "peor", "gravemente enfermo"]
        // For each field in the instrument
        for (const field of report_fields_by_repeat_instrument[instrument_name].fields) {
          // If the field is categorical
          if (isCategoricalField(field)) {
            // For each choice in the field
            for (const choice of field.select_choices_or_calculations.split("|")) {
              // If the choice contains a likert key word
              for (const likert_key_word of likert_key_words) {
                if (choice.toLowerCase().includes(likert_key_word)) {
                  // Return true
                  return true;
                }
              }
            }
          }
        }

        // If no likert key words were found, return false
        return false;
      }
    }
  };
  </script>

  <style scoped>
    .AG-two-panes {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .AG-pane-left {
      width: 50%;
    }

    .AG-pane-right {
      width: 50%;
      margin-left: 20px;
    }

  </style>