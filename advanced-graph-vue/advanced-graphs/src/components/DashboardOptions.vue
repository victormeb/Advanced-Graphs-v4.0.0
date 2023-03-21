<!-- DashboardOptions.vue -->
<template>
    <div id="AG-dashboard-options">
      <table class="AG-dashboard-options">
        <tr>
          <td class="labelrc">{{ module.tt('dashboard_title') }}:</td>
          <td class="labelrc">
            <input type="text" name="dash_title" v-model="title" />
          </td>
        </tr>
        <tr>
          <td class="labelrc">{{ module.tt('public') }}:</td>
          <td class="labelrc">
            <div class="custom-control custom-switch mt-2">
              <input
                type="checkbox"
                class="custom-control-input"
                name="is_public"
                id="is_public"
                v-model="isPublic"
              />
              <label class="custom-control-label" for="is_public">
                {{ module.tt('is_public_description') }}
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
    data() {
      return {
        title: this.dashboard.title
          ? this.dashboard.title
          : this.module.tt('new_dashboard'),
        isPublic: this.dashboard.is_public || false,
      };
    },
  };
  </script>