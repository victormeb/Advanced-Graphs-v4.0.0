<?php
	use ExternalModules\AbstractExternalModule;
	use ExternalModules\ExternalModules;

	include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

	// Get the project ID
	$project_id = $_GET['pid'];

	// Get the data dictionary
	$data_dictionary = REDCap::getDataDictionary($project_id);


	$module->loadJS('js/AdvancedGraphsModule.js');
	$module->loadCSS('css/advanced-graphs.css');
	$module->renderSetupPage();

	$js_module = $module->initializeJavascriptModuleObject();
	$module->tt_transferToJavascriptModuleObject();
?>

<div id="advanced_graphs">
    
</div>

<script>
	    // in an anonymous function to avoid polluting the global namespace
		$(document).ready(function() {
			var module = <?=ExternalModules::getJavascriptModuleObjectName($module)?>;
			var dashboard = {};
			var data_dictionary = <?php echo json_encode($data_dictionary); ?>;
			var report = {};
			var report_fields_by_reapeat_instrument = {};

			// Initialize the module from AdvancedGraphsModule.js
			var AGM = new AdvancedGraphsModule(module, dashboard, data_dictionary, report, report_fields_by_reapeat_instrument);

			// Load the dashboard list
			AGM.loadDashboardList(document.getElementById('advanced_graphs'));
		});
</script>