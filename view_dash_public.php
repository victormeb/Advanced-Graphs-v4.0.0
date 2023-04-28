<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

$dash_id = $_GET['dash_id'];
$project_id = $_GET['pid'];

$dash_title = $module->getDashboardName($pid, $dash_id);

// Page header
// $objHtmlPage = new HtmlPage();
// $objHtmlPage->setPageTitle(remBr(br2nl($app_title))." | REDCap");
// $objHtmlPage->PrintHeader(false);
$dashboard = $module->getDashboards($pid, $dash_id)[0];


if ($dashboard['is_public'] != "1") {
    echo "<h1>Advanced Graphs</h1><h2 style='color: red;'>This is not a publicly available dashboard</h2>";
    exit(0);
}

// Get the associated report ID from the dashboard
if (isset($dashboard['report_id'])) {
    $report_id = $dashboard['report_id'];
} else {
    // // Get the reffering URL
    // $referring_url = $_SERVER['HTTP_REFERER'];
    
    // // parse the URL
    // $url_parts = parse_url($referring_url);

    // // Get the query string
    // $query_string = $url_parts['query'];

    // // Parse the query string
    // parse_str($query_string, $query_parts);

    // // Get the report ID if there is one
    // if (isset($query_parts['report_id'])) {
    //     $report_id = $query_parts['report_id'];
    // } else {
    //     $report_id = null;
    // }
}

// If the report ID is null, then we need to alert the user that they need to create a report first.
if ($report_id == null) {
    echo "<h1>You need to create a report before you can create a dashboard.</h1>";
    // Header
    exit;
}

define('SUPER_USER', true);

// Get the report name
$report_name = $module->getReportName($project_id, $report_id);

// // Get the report
// // $report = $module->getReport($project_id, $report_id);
// // $report = $module->get_report($project_id, $report_id, array(), null, "array");
$report = $module->getReport($report_id);

// // Get the report fields
$report_fields = $module->getReportFields($project_id, $report_id);

// // Get the data dictionary
$data_dictionary = $module->getDataDictionary($project_id);

// // Get the report fields by the repeating instruments
$report_fields_by_reapeat_instrument = $module->getReportFieldsByRepeatInstrument($project_id, $report_id);

$js_module = $module->initializeJavascriptModuleObject();

$module->tt_transferToJavascriptModuleObject();

$module->loadJS('advanced-graph-vue/advanced-graphs/dist/AdvancedGraphs.umd.js');
$module->loadCSS('advanced-graph-vue/advanced-graphs/dist/AdvancedGraphs.css');

?>

<div id="advanced_graphs">
    
</div>

<script>
    // in an anonymous function to avoid polluting the global namespace
    (function() {
        // Get the module object
        var module = <?=$module->getJavascriptModuleObjectName()?>;
        var dashboard = <?php echo json_encode($dashboard); ?>;
        var data_dictionary = <?php echo json_encode($data_dictionary); ?>;
        var report = <?php echo json_encode($report); ?>;
        var report_fields_by_reapeat_instrument = <?php echo json_encode($report_fields_by_reapeat_instrument); ?>;

        var app = AdvancedGraphs.createDashboardViewerApp(module, dashboard, report, data_dictionary, report_fields_by_reapeat_instrument);
        app.mount('#advanced_graphs');
    })();
</script>