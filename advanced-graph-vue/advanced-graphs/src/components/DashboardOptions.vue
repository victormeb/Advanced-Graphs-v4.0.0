<!-- DashboardOptions.vue -->
<template>
    <div id="AG-dashboard-options">
      <table class="AG-dashboard-options">
        <tr>
          <td class="labelrc">{{ module.tt('dbo_dashboard_title') }}:</td>
          <td class="labelrc">
            <input type="text" name="dash_title" v-model="titleString" />
          </td>
        </tr>
        <tr>
          <td class="labelrc">{{ module.tt('dbo_public') }}:</td>
          <td class="labelrc">
            <div class="custom-control custom-switch mt-2">
              <input
                type="checkbox"
                class="custom-control-input"
                name="is_public"
                id="is_public"
                v-model="isPublicVal"
              />
              <label class="custom-control-label" for="is_public">
                {{ module.tt('dbo_is_public_description') }}
              </label>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </template>
  
  <script>
  export default {
    name: 'DashboardOptions',
    inject: ['module', 'dashboard'],
    props: {
      title: {
        type: String,
        required: true,
      },
      isPublic: {
        type: Boolean,
        required: true,
      }
    },
    data() {
      return {
        titleString: this.title,
        isPublicVal: this.isPublic,
      };
    },
    watch: {
      titleString(newVal) {
        this.$emit('updateTitle', newVal);
      },
      isPublicVal(newVal) {
        this.$emit('updatePublic', newVal);
      }
    }
  };
  </script>