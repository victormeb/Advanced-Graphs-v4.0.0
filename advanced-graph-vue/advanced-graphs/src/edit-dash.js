import { createApp } from 'vue'
import DashboardEditor from './DashboardEditor.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
// import { library } from '@fortawesome/fontawesome-svg-core';
// import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


export default function (module, dashboard, report, data_dictionary, report_fields_by_repeat_instrument) {
    const app = createApp(DashboardEditor, {
        module: module,
        dashboard: dashboard,
        report: report,
        data_dictionary: data_dictionary,
        report_fields_by_repeat_instrument: report_fields_by_repeat_instrument,
    })

    app.component('font-awesome-icon', FontAwesomeIcon);
    
    return app;
}

