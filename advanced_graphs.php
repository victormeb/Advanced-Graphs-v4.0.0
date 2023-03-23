<?php
	use ExternalModules\AbstractExternalModule;
	use ExternalModules\ExternalModules;

	include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

	// Get the project ID
	$project_id = $_GET['pid'];

	// Get the data dictionary
	$dashboards = $module->getDashboards($project_id);


	$module->loadJS('advanced-graph-vue/advanced-graphs/dist/AdvancedGraphs.umd.js');
	$module->loadCSS('advanced-graph-vue/advanced-graphs/dist/AdvancedGraphs.css');

	$js_module = $module->initializeJavascriptModuleObject();
	$module->tt_transferToJavascriptModuleObject();
?>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6"></script>

<div id="advanced_graphs">
    
</div>

<script>
	    // in an anonymous function to avoid polluting the global namespace
		$(document).ready(function() {
			var module = <?=ExternalModules::getJavascriptModuleObjectName($module)?>;
			var dashboards = <?php echo json_encode($dashboards); ?>;

			// Initialize the module from AdvancedGraphsModule.js
			var app = AdvancedGraphs.createDashboardListApp(module, dashboards);

			app.mount('#advanced_graphs');
		});
</script>