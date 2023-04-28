<template>
  <table class="table table-striped" style="width:100%">
    <thead>
      <tr>
        <th>{{ module.tt('dashboard_list_dashboard_title') }}</th>
        <th>{{ module.tt('dashboard_list_report_name') }}</th>
        <th></th>
        <th>{{ module.tt('dashboard_list_public_link') }}</th>
        <th>{{ module.tt('dashboard_list_view') }}</th>
        <th>{{ module.tt('dashboard_list_edit') }}</th>
        <th>{{ module.tt('dashboard_list_delete') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(dashboard, index) in localDashboards" :key="dashboard.dash_id">
        <td>{{ dashboard.title }}</td>
        <td>{{ reportNames[dashboard.report_id] }}</td>
        <td></td>
        <td>
          <a v-if="dashboard.is_public" :href="getPublicLink(dashboard)" target="_blank">{{ module.tt('dashboard_list_public_link_href') }}</a>
        </td>
        <td>
          <button class="btn btn-primary" @click="viewDashboard(dashboard)">
            {{ module.tt('dashboard_list_view_button') }}
          </button>
        </td>
        <td>
          <button class="btn btn-warning" @click="editDashboard(dashboard)">
            {{ module.tt('dashboard_list_edit_button') }}
          </button>
        </td>
        <td>
          <button class="btn btn-danger" @click="deleteDashboard(index)">
            {{ module.tt('dashboard_list_delete_button') }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "DashboardList",
  props: {
    module: {
      type: Object,
      required: true,
    },
    dashboards: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localDashboards: this.dashboards,
      reportNames: {},
    }
  },
  async created() {
      const reportNames = {};
      for (const dashboard of this.localDashboards) {
        try {
          const response = await this.module.ajax('getReportName', {
            project_id: this.module.getUrlParameter('pid'),
            report_id: dashboard.report_id
          });
          reportNames[dashboard.report_id] = response;
        } catch (error) {
          console.log(error);
          reportNames[dashboard.report_id] = "failed to retrieve report name";
        }
      }
      this.reportNames = reportNames;
    },
  methods: {
    // async getReportName(reportId) {
    //   try {
    //     const response = await this.module.ajax('getReportName', {
    //       project_id: this.module.getUrlParameter('pid'),
    //       report_id: reportId
    //     });
    //     return response;
    //   } catch (error) {
    //     console.log(error);
    //     return "failed to retrieve report name";
    //   }
    // },
    getPublicLink(dashboard) {
      // If the dashboard is public, then return the public link
      if (dashboard.is_public) {
        return this.module.getUrl('view_dash_public.php') 
        + '&report_id=' + dashboard.report_id 
        + '&dash_id=' + dashboard.dash_id;
      
      }

      return '#';
    },
    viewDashboard(dashboard) {
      const url = this.module.getUrl('view_dash.php') 
        + '&report_id=' + dashboard.report_id 
        + '&dash_id=' + dashboard.dash_id;
        

      // Open the dashboard in a new tab
      window.open(url, '_blank');
    },
    editDashboard(dashboard) {

      const url = this.module.getUrl('edit_dash.php') 
        + '&report_id=' + dashboard.report_id 
        + '&dash_id=' + dashboard.dash_id;
        
      console.log(url);
      // Open the dashboard in a new tab
      window.open(url, '_blank');
    },
    async deleteDashboard(index) {
      const dashboard = this.localDashboards[index];
      try {
        const result = await this.module.ajax('deleteDashboard', dashboard);
        if (result) {
          this.localDashboards.splice(index, 1);
        } else {
          alert(this.module.tt('dashboard_list_delete_error'));
        }
      } catch (error) {
        console.log(error);
        alert(this.module.tt('dashboard_list_delete_error'));
      }
    }
  }
};
</script>