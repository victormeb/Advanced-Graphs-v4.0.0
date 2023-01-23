<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

switch($_POST["method"]) {
	case "get_fields":
		echo get_fields();
		break;
	case "select_fields":
		$adv_output = select_fields();
 		if (!$adv_output["status"]) {
			echo $adv_output["output"];
		} else {
			echo file_get_contents($adv_output["output"]);
		} 
		break;
	case "build_graphs":
		// echo json_encode("bloat");
		// echo json_encode($module->print_blah());
		// echo json_encode($params);
		echo $module->build_graphs($_POST['pid'], defined("USERID") ? USERID : null, $_POST['report_id'], $_POST['live_filters'], $_POST["graphs"]);
		break;
	case "save_dash":
		$module->saveDash($_POST['pid'], $_POST['report_id'], $_POST['live_filters'], $_POST['dash_id'], $_POST['title'], $_POST['graphs'], $_POST['is_public']);
		// echo $module->build_graphs($pid, USERID, $report_id, $params, $_POST["graphs"]);
		break;
	case "delete_dash":
		// echo json_encode("hey there");
		// return;
		echo json_encode($module->deleteDash($_POST['pid'], $_POST['dash_id']) ? '1' : '0');
		break;
	default:
		echo json_encode($_POST["method"]." is not a valid method.");
		// echo nothing_to_show();
		break;
}



?>