<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

$dash_id = $_GET['dash_id'];
$pid = $_GET['pid'];

$dash_title = $module->getDashboardName($pid, $dash_id);

// // Header
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

echo "<center><h1>$dash_title</h1></center><div id=\"advanced_graphs\"><h2>Loading your dashboard</h1></div>";
$dashboard = $module->getDashboards($pid, $dash_id);

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';


$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$original_params = json_encode($query);


?>
<script>
    var report_object = <?php echo $dashboard['body'];?>;
    var live_filters = <?php echo json_encode($dashboard['live_filters']);?>;
    var pid = <?php echo $pid;?>;
    var report_id = <?php echo $dashboard['report_id'];?>;
    var refferer_parameters = <?php echo $original_params;?>;
    // Urls to other pages
    var ajax_url = "<?php echo  $module->getUrl("advanced_graphs_ajax.php");?>" + "&pid=" + pid;
    var edit_dash_url = "<?php echo  $module->getUrl("edit_dash.php");?>";
    var dash_list_url = "<?php echo  $module->getUrl("advanced_graphs.php");?>";
    var view_dash_url = "<?php echo  $module->getUrl("view_dash.php");?>";
    console.log(report_object);
    generate_graphs();
</script>