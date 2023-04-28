<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

// Get the project ID
$project_id = $_GET['pid'];

// Get the dash ID from the URL
$dash_id = $_GET['dash_id'];

// Get the dashboard from
if ($dash_id == 0) {
    $dashboard = array();
} else {
    $dashboard = $module->getDashboards($project_id, $dash_id)[0];
    $dash_name = $module->getDashboardName($project_id, $dash_id);
}

// echo json_encode($dashboard);
// echo "<br>proof: ".$dashboard['report_id'];

// Get the associated report ID from the dashboard
if (isset($dashboard['report_id'])) {
    // echo "<br>isset";
    $report_id = $dashboard['report_id'];
} else {
    // Get the reffering URL
    $referring_url = $_SERVER['HTTP_REFERER'];
    
    // parse the URL
    $url_parts = parse_url($referring_url);

    // Get the query string
    $query_string = $url_parts['query'];

    // Parse the query string
    parse_str($query_string, $query_parts);

    // Get the report ID if there is one
    if (isset($query_parts['report_id'])) {
        $report_id = $query_parts['report_id'];
    } else {
        $report_id = null;
    }

}

// If the report ID is null, then we need to alert the user that they need to create a report first.
if ($report_id == null) {
    echo "<h1>You need to create a report before you can create a dashboard.</h1>";
    // Header
    include APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
    exit;
}




// Get the report name
$report_name = $module->getReportName($project_id, $report_id);

// Get the report
$report = $module->getReport($report_id);

// Get the report fields
$report_fields = $module->getReportFields($project_id, $report_id);

// Get the data dictionary
$data_dictionary = $module->getDataDictionary($project_id);

// Get the report fields by the repeating instruments
$report_fields_by_reapeat_instrument = $module->getReportFieldsByRepeatInstrument($project_id, $report_id);

$js_module = $module->initializeJavascriptModuleObject();

$module->tt_transferToJavascriptModuleObject();

$module->loadJS('advanced-graphs/dist/AdvancedGraphs.umd.js');
$module->loadCSS('advanced-graphs/dist/AdvancedGraphs.css');
?>

<div id="advanced_graphs">
    
</div>

<script>
    // in an anonymous function to avoid polluting the global namespace
    $(document).ready(function() {
        // Get the module object
        var module = <?=$module->getJavascriptModuleObjectName()?>;
        var dashboard = <?php echo json_encode($dashboard); ?>;
        var data_dictionary = <?php echo json_encode($data_dictionary); ?>;
        var report = <?php echo json_encode($report); ?>;
        var report_fields_by_reapeat_instrument = <?php echo json_encode($report_fields_by_reapeat_instrument); ?>;

        var app = AdvancedGraphs.createDashboardViewerApp(module, dashboard, report, data_dictionary, report_fields_by_reapeat_instrument);
        app.mount('#advanced_graphs');
    });
</script>








<?php
// Footer
include APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
?>