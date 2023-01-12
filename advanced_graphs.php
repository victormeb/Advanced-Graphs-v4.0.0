<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js" integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=" crossorigin=""></script>
<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

// require_once dirname(dirname(__FILE__)) . '/Config/init_project.php';

// Header
include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
$module->loadJS("dash-builder.js");
$module->loadJS("htmlwidgets.js", "mapdependencies/htmlwidgets-1.5.4");
// $module->loadJS("jquery.min.js", "mapdependencies/jquery-1.12.4");
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
// Tabs
include APP_PATH_DOCROOT . "ProjectSetup/tabs.php";

// require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';	
// echo $module->($js_file,  $module->module_js_path);
echo "<div id=\"advanced_graphs\"><h1>Advanced Graphs</h1></div>";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$original_params = json_encode($query);

$pid = $query['pid'];
$report_id = $query['report_id'];

$module->initialize_report($pid, USERID, $report_id, $query);

$data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $_GET['pid']);
$report_fields = $module->get_accessible_fields($pid, USERID, $report_id);//DataExport::getReports($report_id)["fields"];

//$report = json_encode(DataExport::deidFieldsToRemove($fields=$report_fields, $removeOnlyIdentifiers=false, $removeDateFields=true, $removeRecordIdIfIdentifier=true));

//json_encode($module->get_report($pid, USERID, $report_id, $query, "array")); //


$repeat_instruments = $module->get_repeat_instruments($pid);

$instruments = array();
// echo print_r($report_fields);
foreach ($Proj->forms as $form=>$attr) {
	$instruments[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
}
//echo print_r($forms);
//echo json_encode($data_dictionary);
// $likert_groups = json_encode($module->likert_groups($data_dictionary, $forms));
// echo print_r($query);
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
console.log(data_dictionary);
var report = <?php echo json_encode($module->report);?>;
console.log(report);
var constants = <?php echo json_encode(unserialize(str_replace(array('NAN;','INF;'),'0;',serialize(get_defined_constants()))), JSON_HEX_QUOT );?>;
var ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>";
var refferer_parameters = <?php echo $original_params;?>;
var pid = <?php echo $_GET["pid"];?>;
var ajax_url = ajax_url+ "&pid=" + pid;

var graph_groups = <?php echo $graph_groups;?>;

var report_object = new Map();

console.log(graph_groups);

$(document).ready(function() {
	likert_div();
	scatter_div();
	barplot_div();
	map_div();
	network_div();
	save_button();
});
</script>