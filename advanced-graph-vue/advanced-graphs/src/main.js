// edit-dash.js
import { createApp } from 'vue';
import DashboardEditor from './DashboardEditor.vue';
import DashboardList from './DashboardList.vue';
import DashboardViewer from './DashboardViewer.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
// import { library } from '@fortawesome/fontawesome-svg-core';
// import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


export function createDashboardEditorApp (module, dashboard, report, data_dictionary, report_fields_by_repeat_instrument) {
    const app = createApp(DashboardEditor, {
        module: module,
        dashboard: dashboard,
        report: report,
        data_dictionary: data_dictionary,
        report_fields_by_repeat_instrument: report_fields_by_repeat_instrument,
    });

    app.component('font-awesome-icon', FontAwesomeIcon);
    
    return app;
}

export function createDashboardListApp(module, dashboards) {
    const app = createApp(DashboardList, {
        module: module,
        dashboards: dashboards,
    });

    app.component('font-awesome-icon', FontAwesomeIcon);
    
    return app;
}

export function createDashboardViewerApp (module, dashboard, report, data_dictionary, report_fields_by_repeat_instrument) {
    const app = createApp(DashboardViewer, {
        module: module,
        dashboard: dashboard,
        report: report,
        data_dictionary: data_dictionary,
        report_fields_by_repeat_instrument: report_fields_by_repeat_instrument,
    });

    app.component('font-awesome-icon', FontAwesomeIcon);
    
    return app;
}