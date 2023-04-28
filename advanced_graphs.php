<?php
	use ExternalModules\AbstractExternalModule;
	use ExternalModules\ExternalModules;

	include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

	// Get the project ID
	$project_id = $_GET['pid'];

	// Get the data dictionary
	$dashboards = $module->getDashboards($project_id);


	$module->loadJS('advanced-graphs/dist/AdvancedGraphs.umd.js');
	$module->loadCSS('advanced-graphs/dist/AdvancedGraphs.css');

	$js_module = $module->initializeJavascriptModuleObject();
	$module->tt_transferToJavascriptModuleObject();
?>

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