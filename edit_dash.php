<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

// include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
// $module->renderDashEditor();
// require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
$pid = $_GET['pid'];
$dash_id = $_GET['dash_id'];

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$live_filters = $query;

// $pid = $query['pid'];
$report_id = $query['report_id'];

$dash_title = "New Dashboard";

$dashboard_body = [];
$is_public = "false";

if ($dash_id != '0') {
	$dashboard = $module->getDashboards($pid, $dash_id);
	$dashboard_body = $dashboard['body'];
	$report_id = $dashboard['report_id'];
	$live_filters = $dashboard['live_filters'];
	$is_public = $dashboard['is_public'];
	$dash_title = $module->getDashboardName($pid, $dash_id);
}

if ($report_id == 0)
	$report_id = "ALL";

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
?>
<form id="graphs-form">
    <div id="graph-selectors-container">
        <!-- Add the first graph selector by default -->
        <div class="graph-selector" id="graph-selector-0">
            <label for="graph-type-0">Select a graph type:</label>
            <select name="graph-type-0" id="graph-type-0">
                <option value="bar-plot">Bar plot</option>
                <option value="grouped-bar-plot">Grouped bar plot</option>
                <option value="stacked-bar-plot">Stacked bar plot</option>
                <option value="pie-chart">Pie chart</option>
                <option value="scatter-plot">Scatter plot</option>
                <option value="likert-plot">Likert plot</option>
                <option value="table">Table</option>
                <option value="map">Map</option>
                <option value="network">Network</option>
            </select>

            <!-- Include a container element for the parameters -->
            <div class="graph-parameters-container" id="graph-parameters-container-0"></div>

            <!-- Add buttons to remove the graph selector or move it up/down -->
            <button class="remove-graph-selector-button" type="button" data-graph-selector-index="0">Remove graph</button>
            <button class="move-graph-up-button" type="button" data-graph-selector-index="0">Move up</button>
            <button class="move-graph-down-button" type="button" data-graph-selector-index="0">Move down</button>
        </div>
    </div>

    <!-- Add a button to add a new graph selector -->
    <button id="add-graph-selector-button" type="button">Add graph</button>
</form>
<?php
require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

if (!$report_id)
	exit(0);

$module->initialize_report($pid, USERID, $report_id, $query);
// echo "report id is $report_id";
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
console.log("Added event listener");
(function($, document, window) {
    console.log("Added event listener");
		// Initialize the module object

		const graphContainer = document.getElementById('graph-container');
    
    // Define a function to generate the select element based on the dataframe
    function generateGraphTypeSelect(dataframe) {
        const graphTypeSelect = document.createElement('select');
        graphTypeSelect.name = 'graph-type';
        graphTypeSelect.className = 'graph-type-select';
        
        // Add options based on the columns in the dataframe
        if (dataframe.columns.includes('x') && dataframe.columns.includes('y')) {
            const barChartOption = document.createElement('option');
            barChartOption.value = 'bar-chart';
            barChartOption.textContent = 'Bar chart';
            graphTypeSelect.appendChild(barChartOption);
            
            const lineChartOption = document.createElement('option');
            lineChartOption.value = 'line-chart';
            lineChartOption.textContent = 'Line chart';
            graphTypeSelect.appendChild(lineChartOption);
        }
        
        if (dataframe.columns.includes('value') && dataframe.columns.includes('label')) {
            const pieChartOption = document.createElement('option');
            pieChartOption.value = 'pie-chart';
            pieChartOption.textContent = 'Pie chart';
            graphTypeSelect.appendChild(pieChartOption);
        }
        
        // Add additional conditions for new graph types here
        
        return graphTypeSelect;
    }
    
    // Define a function to show the parameters for a given graph type
    function showParametersForGraphType(graphType, parameterContainer) {
        // Clear the parameter container
        parameterContainer.innerHTML = '';
        
        // Generate the appropriate form elements based on the selected graph type
        if (graphType === 'bar-chart') {
            // Example parameters for a bar chart
            parameterContainer.innerHTML = `
                <label for="x-axis-label">X-axis label:</label>
                <input type="text" name"x-axis-label" id="x-axis-label">
            <br>
            <label for="y-axis-label">Y-axis label:</label>
            <input type="text" name="y-axis-label" id="y-axis-label">
        `;
    } else if (graphType === 'line-chart') {
        // Example parameters for a line chart
        parameterContainer.innerHTML = `
            <label for="line-color">Line color:</label>
            <input type="color" name="line-color" id="line-color">
        `;
    } else if (graphType === 'pie-chart') {
        // Example parameters for a pie chart
        parameterContainer.innerHTML = `
            <label for="slice-colors">Slice colors (comma-separated):</label>
            <input type="text" name="slice-colors" id="slice-colors">
        `;
    }
    // Add additional conditions for new graph types here
}

// Define a function to add a new graph selector form
function addGraphSelector() {
    // Clone the first graph selector form and modify the necessary elements
    const newGraphSelector = graphContainer.firstElementChild.cloneNode(true);
    const graphTypeSelect = newGraphSelector.querySelector('.graph-type-select');
    const parameterContainer = newGraphSelector.querySelector('.parameter-container');
    
    // Generate the graph type select based on the dataframe
    const dataframe = {}/* insert your dataframe here */;
    const newGraphTypeSelect = generateGraphTypeSelect(dataframe);
    graphTypeSelect.replaceWith(newGraphTypeSelect);
    
    // Show the appropriate parameters based on the initial graph type
    showParametersForGraphType(newGraphTypeSelect.value, parameterContainer);
    
    // Add event listeners to the new form elements
    newGraphTypeSelect.addEventListener('change', () => {
        showParametersForGraphType(newGraphTypeSelect.value, parameterContainer);
    });
    
    newGraphSelector.querySelector('.add-graph-selector').addEventListener('click', addGraphSelector);
    newGraphSelector.querySelector('.remove-graph-selector').addEventListener('click', () => {
        newGraphSelector.remove();
    });
    newGraphSelector.querySelector('.move-up-graph-selector').addEventListener('click', () => {
        const previousSibling = newGraphSelector.previousElementSibling;
        if (previousSibling) {
            graphContainer.insertBefore(newGraphSelector, previousSibling);
        }
    });
    newGraphSelector.querySelector('.move-down-graph-selector').addEventListener('click', () => {
        const nextSibling = newGraphSelector.nextElementSibling;
        if (nextSibling) {
            graphContainer.insertBefore(nextSibling, newGraphSelector);
        }
    });
    
    // Add the new graph selector to the container
    graphContainer.appendChild(newGraphSelector);
}

// Add an event listener to the "Add Graph" button
const addGraphButton = document.getElementById('add-graph-selector-button');
addGraphButton.addEventListener('click', addGraphSelector);
console.log("Added event listener");
}($, document, window));
</script>
<div id="dashboard_saved_success_dialog" class="simpleDialog" style=""><div style="font-size:14px;">The dashboard named "<span style="font-weight:bold;">Example dashboard</span>" has been successfully saved.</div>
</div>