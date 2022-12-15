<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

// require_once dirname(dirname(__FILE__)) . '/Config/init_project.php';

// Header
include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
// Tabs
include APP_PATH_DOCROOT . "ProjectSetup/tabs.php";

$module->loadJS("dash-builder.js");
$module->loadCSS("advanced-graphs.css");

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


$data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $_GET['pid']);
$report_fields = DataExport::getReports($report_id)["fields"];

$Proj = new Project($pid);

$repeat_instruments = $module->get_repeat_instruments($Proj);

$instruments = array();
// echo print_r($report_fields);
foreach ($Proj->forms as $form=>$attr) {
	$instruments[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
}
//echo print_r($forms);
//echo json_encode($data_dictionary);
// $likert_groups = json_encode($module->likert_groups($data_dictionary, $forms));
echo print_r($query);
$graph_groups = json_encode(
		array(
			"likert_groups" => $module->likert_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments),
			"scatter_groups" => $module->scatter_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments)
		)
	);
echo "TEST";
?>
<script>
var data_dictionary = <?php echo json_encode($data_dictionary);?>;
console.log(data_dictionary);
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
});
</script>