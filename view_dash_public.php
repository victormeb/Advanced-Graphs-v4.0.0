<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

$dash_id = $_GET['dash_id'];
$pid = $_GET['pid'];

$dash_title = $module->getDashboardName($pid, $dash_id);

// Page header
$objHtmlPage = new HtmlPage();
$objHtmlPage->setPageTitle(remBr(br2nl($app_title))." | REDCap");
$objHtmlPage->PrintHeader(false);

// // Header
// include APP_PATH_DOCROOT . 'ProjectGeneral/print_page.php';
$dashboard = $module->getDashboards($pid, $dash_id);

if ($dashboard['is_public'] != "1") {
    echo "<h1>Advanced Graphs</h1><h2 style='color: red;'>This is not a publicly available dashboard</h2>";
    exit(0);
}

$module->loadJS("dash-builder.js");
$module->loadJS("jquery.min.js", "mapdependencies/jquery-1.12.4");
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
    
echo "<center><h1>$dash_title</h1></center><div id=\"advanced_graphs\"><h2>Loading your dashboard...</h1><h2>Please Wait</h2></div>";


// $url = $_SERVER["HTTP_REFERER"];
// $parts = parse_url($url, PHP_URL_QUERY);
// parse_str($parts, $query);

// $original_params = json_encode($query);


?>
<script>
    var report_object = <?php echo $dashboard['body'];?>;
    var live_filters = <?php echo $dashboard['live_filters']?>;
    var pid = <?php echo $pid;?>;
    var report_id = "<?php echo $dashboard['report_id'];?>";
    // Urls to other pages
    var ajax_url = "<?php echo  $module->getUrl("advanced_graphs_ajax_public.php");?>" + "&NOAUTH" + "&pid=" + pid ;
    console.log(report_object);
    generate_graphs();
</script>