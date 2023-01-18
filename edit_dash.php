<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

// echo json_encode($module->query("describe advanced_graphs_dashboards")->fetch_all());

$pid = $_GET['pid'];
$dash_id = $_GET['dash_id'];

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$live_filters = $query;

// $pid = $query['pid'];
$report_id = $query['report_id'];

$dash_title = "New Dashboard";

if ($dash_id != '0') {
	$dashboard = $module->getDashboards($pid, $dash_id);
	$report_id = $dashboard['report_id'];
	$live_filters = $dashboard['live_filters'];
	$dash_tile = $module->getDashboardName($pid, $dash_id);
}

// Header
include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
$module->loadJS("dash-builder.js");
$module->loadJS("htmlwidgets.js", "mapdependencies/htmlwidgets-1.5.4");
$module->loadCSS("leaflet.css", "mapdependencies/leaflet-1.3.1");
$module->loadJS("leaflet.js", "mapdependencies/leaflet-1.3.1");
$module->loadCSS("leafletfix.css", "mapdependencies/leafletfix-1.0.0");
$module->loadJS("proj4.min.js", "mapdependencies/proj4-2.6.2");
$module->loadJS("proj4leaflet.js", "mapdependencies/Proj4Leaflet-1.0.1");
$module->loadCSS("rstudio_leaflet.css", "mapdependencies/rstudio_leaflet-1.3.1");
$module->loadJS("leaflet.js", "mapdependencies/leaflet-binding-2.1.1");
$module->loadCSS("MarkerCluster.css", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadCSS("MarkerCluster.Default.css", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.freezable.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.layersupport.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadCSS("advanced-graphs.css");
$title = $report_id ? "<h1>Advanced Graphs</h1>" : "<h1>New Advanced Graphs Dashboards must be run from the context of a report</h1>";
echo "<div id=\"advanced_graphs\">$title</div>";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

if (!$report_id)
	exit(0);

$module->initialize_report($pid, USERID, $report_id, $query);

$data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $_GET['pid']);

$graph_groups = json_encode(
		array(
			"likert_groups" => $module->likert_groups(),
			"scatter_groups" => $module->scatter_groups(),
			"barplot_groups" => $module->barplot_groups(),
			"map_groups" => $module->map_groups(),
			"network_groups" => $module->network_groups()
		)
	);

?>
<script>
var data_dictionary = <?php echo json_encode($module->data_dictionary);?>;
var pid = <?php echo $pid?>;
var dash_id = <?php echo $dash_id?>;
var dash_title = "<?php echo $dash_title?>";
var report_id = <?php echo $report_id?>;

// Used to find categorical fields that uniquely identify locations
var report = <?php echo json_encode($module->report);?>;

// Urls to other pages
var ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>" + "&pid=" + pid;
var edit_dash_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "edit_dash.php");?>";
var dash_list_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs.php");?>";
var view_dash_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "view_dash.php");?>";

// Passed to ajax request to preserve live filters on a given report for each dashboard
var live_filters = <?php echo json_encode($live_filters);?>;

// These contain the available fields for each graph group e.g. Scatter plots, Likert graphs, Bar plots
var graph_groups = <?php echo $graph_groups;?>;

// Holds a form to graph function used to save report data.
var report_object = new Map();

// When the document is ready, create a div for each group and add the save button
$(document).ready(function() {
	dashboard_title(dash_title);
	likert_div();
	scatter_div();
	barplot_div();
	map_div();
	network_div();
	save_button();
});
console.log(dash_id);


</script>
<div id="dashboard_saved_success_dialog" class="simpleDialog" style=""><div style="font-size:14px;">The dashboard named "<span style="font-weight:bold;">Example dashboard</span>" has been successfully saved.</div>
</div>