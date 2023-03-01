<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

// Get the project ID
$project_id = $_GET['pid'];

// Get the dash ID from the URL
$dash_id = $_GET['dash_id'];

// Get the dashboard from
$dashboard = $module->getDashboards($project_id, $dash_id);

// Get the dashboard name
$dash_name = $module->getDashboardName($project_id, $dash_id);

// Get the associated report ID from the dashboard
if (isset($dashboard['report_id'])) {
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
// $report = $module->getReport($project_id, $report_id);
$report = $module->get_report($project_id, $report_id, array(), null, "array");

// Get the report fields
$report_fields = $module->getReportFields($project_id, $report_id);

// Get the data dictionary
$data_dictionary = $module->getDataDictionary($project_id);

// Get the report fields by the repeating instruments
$report_fields_by_reapeat_instrument = $module->getReportFieldsByRepeatInstrument($project_id, $report_id);

$module->loadJS('js/AdvancedGraphsModule.js');
$module->loadCSS('css/advanced-graphs.css');

$js_module = $module->initializeJavascriptModuleObject();

$module->tt_transferToJavascriptModuleObject();
?>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6"></script>

<div id="advanced_graphs">
    <div id="dashboard_editor">
        <div id="dashboard_table">

        </div>
    </div>
</div>

<script>
    // in an anonymous function to avoid polluting the global namespace
    $(document).ready(function() {
        var module = <?=ExternalModules::getJavascriptModuleObjectName($module)?>;
        var report_id = <?php echo $report_id; ?>;
        var report_name = "<?php echo $report_name; ?>";
        var dash_id = <?php echo $dash_id; ?>;
        var dash_name = "<?php echo $dash_name; ?>";
        var project_id = <?php echo $project_id; ?>;
        var report = <?php echo json_encode($report); ?>;
        var dashboard = <?php echo json_encode($dashboard); ?>;
        var report_fields = <?php echo json_encode($report_fields); ?>;
        var data_dictionary = <?php echo json_encode($data_dictionary); ?>;
        var report_fields_by_reapeat_instrument = <?php echo json_encode($report_fields_by_reapeat_instrument); ?>;

        console.log(data_dictionary);
        console.log(report_fields_by_reapeat_instrument);
        
        // Initialize the module from AdvancedGraphsModule.js
        var AGM = new AdvancedGraphsModule(module, dashboard, data_dictionary, report_fields_by_reapeat_instrument, report);

        // Load the dashboard editor
        AGM.loadDashboardEditor();

    });
</script>








<?php
// Footer
include APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
?>