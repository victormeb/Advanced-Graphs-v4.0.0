<?php
	use ExternalModules\AbstractExternalModule;
	use ExternalModules\ExternalModules;
	include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
	$module->loadJS("dash-builder.js");
	$module->loadJS("jquery_tablednd.js", "dragNdrop");
	$module->renderSetupPage();
?>

<script>
	var pid = <?php echo $_GET['pid'];?>;
	
	// Urls to other pages
	var ajax_url = "<?php echo  $module->getUrl("advanced_graphs_ajax.php");?>" + "&pid=" + pid;
	var edit_dash_url = "<?php echo  $module->getUrl("edit_dash.php");?>";
	var dash_list_url = "<?php echo  $module->getUrl("advanced_graphs.php");?>";
	var view_dash_url = "<?php echo  $module->getUrl("view_dash.php");?>";
</script>