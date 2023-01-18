<?php
	use ExternalModules\AbstractExternalModule;
	use ExternalModules\ExternalModules;
	include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
	$module->loadJS("dash-builder.js");
	$module->renderSetupPage();
?>

<script>
	var pid = <?php echo $_GET['pid'];?>;
	var edit_dash_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "edit_dash.php");?>";
	var dash_list_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs.php");?>";
	var view_dash_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "view_dash.php");?>";
	var ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>" + "&pid=" + pid;
</script>