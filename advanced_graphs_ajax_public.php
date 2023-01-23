<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

function nothing_to_show() {
	return "<h1>Nothing to show here</h1>";
}

switch($_POST["method"]) {
	case "build_graphs":
		echo $module->build_graphs($_POST['pid'], defined("USERID") ? USERID : null, $_POST['report_id'], $_POST['live_filters'], $_POST["graphs"]);
		break;
	default:
		echo json_encode($_POST["method"]." is not a valid method.");
		break;
}



?>