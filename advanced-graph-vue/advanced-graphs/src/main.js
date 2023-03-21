import { createApp } from 'vue'
import DashboardEditor from './DashboardEditor.vue'
import 'bootstrap/dist/css/bootstrap.min.css';
// import { library } from '@fortawesome/fontawesome-svg-core';
// import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Fetch all the JSON files
// Instantiate a new Vue instance
// Define your test data as JSON objects
const testModule = {tt: key => key };
// Fetch all the JSON files
Promise.all([
    fetch('./sample/sample-report.json'),
    fetch('./sample/sample-dashboard.json'),
    fetch('./sample/sample-data-dictionary.json'),
    fetch('./sample/sample-report-fields-by-repeat-instrument.json'),
])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([testReport, testDashboard, testDataDictionary, testReportFieldsByRepeatInstrument]) => {
        // Instantiate a new Vue instance
        const app = createApp(DashboardEditor, {
          currentPage: 'dashboard-editor', // For example
          module: testModule,
          dashboard: testDashboard,
          report: testReport,
          data_dictionary: testDataDictionary,
          report_fields_by_repeat_instrument: testReportFieldsByRepeatInstrument,
      })
      
      app.component('font-awesome-icon', FontAwesomeIcon);
      app.mount('#advanced_graphs_test');

    });


