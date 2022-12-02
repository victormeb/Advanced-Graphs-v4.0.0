<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

$pid = $_POST["params"]["pid"];
$report_id = $_POST["params"]["report_id"];

global $Proj;
$Proj = new Project($pid);

function nothing_to_show() {
	return "<h1>Nothing to show here</h1>";
}

// Obtain any dynamic filters selected from query string params
function buildReportDynamicFilterLogicReferrer($report_id, $url_params)
{
	global $Proj, $lang, $user_rights, $missingDataCodes;
	// Validate report_id
	if (!is_numeric($report_id) && $report_id != 'ALL' && $report_id != 'SELECTED') {
		return "";
	}
	// Get report attributes
	$report = DataExport::getReports($report_id);
	if (empty($report)) return "empty"; //return "";
	// Loop through fields
	$dynamic_filters_logic = array();
	$dynamic_filters_group_id = $dynamic_filters_event_id = "";

 	for ($i = 1; $i <= DataExport::MAX_LIVE_FILTERS; $i++) {
		// Get field name
		$field = $report['dynamic_filter'.$i];
		// If we do not have a dynamic field set here or if the field no longer exists in the project, then return blank string
		if (!(isset($field) && $field != '' )) continue; //&& ($field == DataExport::LIVE_FILTER_EVENT_FIELD || $field == DataExport::LIVE_FILTER_DAG_FIELD || isset($Proj->metadata[$field]))
		if (!isset($url_params['lf'.$i]) || $url_params['lf'.$i] == '') continue;
		
		// Rights to view data from field? Must have form rights for fields, and if a DAG field, then must not be in a DAG.
		if (isset($Proj->metadata[$field]) && $field != $Proj->table_pk && $user_rights['forms'][$Proj->metadata[$field]['form_name']] == '0') {
			unset($url_params['lf'.$i]);
			continue;
		} elseif ($field == DataExport::LIVE_FILTER_DAG_FIELD && is_numeric($user_rights['group_id'])) {
			unset($url_params['lf'.$i]);
			continue;
		}
		
		// Decode the query string param (just in case)
		$url_params['lf'.$i] = rawurldecode(urldecode($url_params['lf'.$i]));
		
		// Get field choices
		if ($field == DataExport::LIVE_FILTER_EVENT_FIELD) {
			// Add blank choice at beginning
			$choices = array(''=>"[".$lang['global_45']."]");
			// Add event names
			foreach ($Proj->eventInfo as $this_event_id=>$eattr) {
				$choices[$this_event_id] = $eattr['name_ext'];
			}
			// Validate the value
			if (isset($choices[$url_params['lf'.$i]])) {
				$dynamic_filters_event_id = $url_params['lf'.$i];
			}
		} elseif ($field == DataExport::LIVE_FILTER_DAG_FIELD) {
			$choices = $Proj->getGroups();
			// Add blank choice at beginning
			$choices = array(''=>"[".$lang['global_78']."]") + $choices;
			// Validate the value
			if (isset($choices[$url_params['lf'.$i]])) {
				$dynamic_filters_group_id = $url_params['lf'.$i];
			}
		} elseif ($field == $Proj->table_pk) {
			$choices = Records::getRecordList($Proj->project_id, $user_rights['group_id'], true);
			// Add blank choice at beginning
			$choices = array(''=>"[ ".strip_tags(label_decode($Proj->metadata[$field]['element_label']))." ]") + $choices;
			// Validate the value
			if (isset($choices[$url_params['lf'.$i]])) {
				$value = (DataExport::LIVE_FILTER_BLANK_VALUE == $url_params['lf'.$i]) ? '' : str_replace("'", "\'", $url_params['lf'.$i]); // Escape apostrophes
				$dynamic_filters_logic[] = "[$field] = '$value'";
			}
		} else {
			$realChoices = $Proj->isSqlField($field) ? parseEnum(getSqlFieldEnum($Proj->metadata[$field]['element_enum'])) : parseEnum($Proj->metadata[$field]['element_enum']);
			// Add blank choice at beginning + NULL choice
			$choices = array(''=>"[ ".strip_tags(label_decode($Proj->metadata[$field]['element_label']))." ]")
					 + $realChoices
					 + array(DataExport::LIVE_FILTER_BLANK_VALUE=>$lang['report_builder_145']);
			// Validate the value
			if (isset($choices[$url_params['lf'.$i]]) || isset($missingDataCodes[$url_params['lf'.$i]])) {
				$value = (DataExport::LIVE_FILTER_BLANK_VALUE == $url_params['lf'.$i]) ? '' : $url_params['lf'.$i];
				$dynamic_filters_logic[] = "[$field] = '$value'";
			}
		}
	}
	
	// Return logic and DAG group_id
	return array(implode(" and ", $dynamic_filters_logic), $dynamic_filters_group_id, $dynamic_filters_event_id);
 }

 function get_report($report_id, $params) {
	// Get user rights
	$user_rights_proj_user = UserRights::getPrivileges(PROJECT_ID, USERID);
	$user_rights = $user_rights_proj_user[PROJECT_ID][strtolower(USERID)];
	unset($user_rights_proj_user);
	
	// TODO: should user access even with no rights?
	
	// Does user have De-ID rights?
	$deidRights = ($user_rights['data_export_tool'] == '2');

	// De-Identification settings
	$hashRecordID = ($deidRights);
	$removeIdentifierFields = ($user_rights['data_export_tool'] == '3' || $deidRights);
	$removeUnvalidatedTextFields = ($deidRights);
	$removeNotesFields = ($deidRights);
	$removeDateFields = ($deidRights);
	
	// Build live filter logic from parameters
	list ($liveFilterLogic, $liveFilterGroupId, $liveFilterEventId) = buildReportDynamicFilterLogicReferrer($report_id, $params);

	// Retrieve report from redcap
	$content = DataExport::doReport($report_id, 'export', 'csvraw', false, false,
									false, false, $removeIdentifierFields, $hashRecordID, $removeUnvalidatedTextFields,
									$removeNotesFields, $removeDateFields, false, false, array(), 
									array(), false, false, 
									false, true, true, $liveFilterLogic, $liveFilterGroupId, $liveFilterEventId, true, ",", '');

									
	return $content;
}

function get_project_info($pid) {
	global $lang;
	// Get project object of attributes
	$Proj = new Project($pid);
	// Set array of fields we want to return, along with their user-facing names
	$project_fields = Project::getAttributesApiExportProjectInfo();
	//print_array($Proj->project);
	// Add values for all the project fields
	$project_values = array();
	foreach ($project_fields as $key=>$hdr) {
		// Add to array
		if (!isset($Proj->project[$key])) {
			// Leave blank if not in array above
			$val = '';
		} elseif (is_bool($Proj->project[$key])) {
			// Convert boolean to 0 and 1
			$val = ($Proj->project[$key] === false) ? 0 : 1;
		} else {
			// Normal value
			$val = label_decode($Proj->project[$key]);
		}
		$project_values[$hdr] = isinteger($val) ? (int)$val : $val;
	}
	// Add longitudinal
	$project_values['is_longitudinal'] = $Proj->longitudinal ? 1 : 0;
	// Add repeating instruments and events flag
	$project_values['has_repeating_instruments_or_events'] = ($Proj->hasRepeatingFormsEvents() ? 1 : 0);
	// Add any External Modules that are enabled in the project
	$versionsByPrefix = \ExternalModules\ExternalModules::getEnabledModules($Proj->project_id);
	$project_values['external_modules'] = implode(",", array_keys($versionsByPrefix));
	// Reformat the missing data codes to be pipe-separated
	$theseMissingCodes = array();
	foreach (parseEnum($project_values['missing_data_codes']) as $key=>$val) {
		$theseMissingCodes[] = "$key, $val";
	}
	$project_values['missing_data_codes'] = implode(" | ", $theseMissingCodes);
	// Mobile App only
	if (isset($_POST['mobile_app']) && $_POST['mobile_app'] == '1') {
		// Add list of records that have been locked at the record-level
		$Locking = new Locking();
		$Locking->findLockedWholeRecord($Proj->project_id);
		$project_values['locked_records'] = implode("\n", array_keys($Locking->lockedWhole));
		// Add Form Display Logic settings
		$project_values['form_display_logic'] = FormDisplayLogic::outputFormDisplayLogicForMobileApp($Proj->project_id);
	}

	// Open connection to create file in memory and write to it
	$fp = fopen('php://memory', "x+");
	// Add headers
	fputcsv($fp, array_keys($project_values), User::getCsvDelimiter());
	// Add values
	fputcsv($fp, $project_values, User::getCsvDelimiter());
	// Open file for reading and output to user
	fseek($fp, 0);
	return stream_get_contents($fp);
}

function get_instruments($pid, $format = "raw") {
	global $post;
	// Don't output any CATs because they cannot be used in the Mobile App
	$cat_list = ($post['mobile_app']) ? PROMIS::getPromisInstruments() : array();
	// Loop through instruments
	$forms = array();
	$Proj = new Project($pid);
	foreach ($Proj->forms as $form=>$attr) {
		if (in_array($form, $cat_list)) continue;
		$forms[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
	}
	
	if ($format == "raw") {
		return $forms;
	}
	
	$output = "";

	foreach ($forms as $index => $row) {
		$output .= $row['instrument_name'].",\"".str_replace('"', '""', $row['instrument_label'])."\"\n";
	}

	$fieldList = "instrument_name,instrument_label";
	$output = $fieldList . "\n" . $output;

	return $output;
}


function get_repeat_instruments($pid) {
	global $lang;
	// Get project object of attributes
	$Proj = new Project($pid);
	// if project has not repeating forms or events
	if(!$Proj->hasRepeatingFormsEvents()){
		return ($Proj->longitudinal ? "event_name,form_name,custom_form_label" : "form_name,custom_form_label")."\n";
	}
	$raw_values = $Proj->getRepeatingFormsEvents();
	if($Proj->longitudinal){
		$eventForms = $Proj->eventsForms;
		foreach ($eventForms as $dkey=>$row){
			$event_name = Event::getEventNameById($Proj->project_id,$dkey);
			$sql = "select form_name, custom_repeat_form_label from redcap_events_repeat where event_id = " . db_escape($dkey) . "";
			$q = db_query($sql);
			if(db_num_rows($q) > 0){
				while ($row = db_fetch_assoc($q)){
					$form_name = ($row['form_name'] ? $row['form_name'] : '');
					$form_label = ($row['custom_repeat_form_label'] ? $row['custom_repeat_form_label'] : '');
					$results[] = array('event_name'=>$event_name, 'form_name'=>$form_name, 'custom_form_label'=>$form_label);
				}
			}
		}
	}else{//classic project
		foreach (array_values($raw_values)[0] as $dkey=>$row){
			$results[] = array('form_name'=>$dkey, 'custom_form_label'=>$row);
		}
	}
	
	$Proj = new Project($pid);
	$output = "";

	foreach ($results as $index => $row) {
		if($Proj->longitudinal){
			$output .= $row['event_name'].",".$row['form_name'].",".str_replace('"', '""', $row['custom_form_label'])."\n";
		}else{
			$output .= $row['form_name'].",".str_replace('"', '""', $row['custom_form_label'])."\n";
		}
	}

	$fieldList = ($Proj->longitudinal ? "event_name,form_name,custom_form_label" : "form_name,custom_form_label");
	$output = $fieldList . "\n" . $output;

	return $output;
}
 
/* 
get_fields
	author: Joel Cohen
	description:
		Returns the fields present in the report as a json object.
 */
function get_fields() {
	global $pid, $report_id;
	
	if (!isset($pid) || !isset($report_id))
		return json_encode(
				Array (
					"output" => "<h1 style=\"color:red;\">Advanced graphs must be run from the context of a report</h1>", 
					"status" => false
				)
			);
	
	$report = DataExport::getReports($report_id);
	
	if (empty($report))
		return json_encode(
				Array (
					"output" => '<h1 style=\"color:red;\">The value of the parameter "report_id" is not valid</h1>', 
					"status" => false
				)
			);

	if (empty($report["fields"]))
		return json_encode(
				Array (
					"output" => '<h1 style=\"color:red;\">There don\'t seem to be any fields in this report</h1>', 
					"status" => false
				)
			);
	
	$data_dictionary = MetaData::getDataDictionary("array", false, $report["fields"], array(), false, false, null, $pid);
	
	return json_encode(
			Array (
				"output" => $data_dictionary,
				"status" => true
			)
		);
}

function run_R($report_data_file_path, $data_dictionary_file_path, $project_info_file_path, $instruments_file_path, $repeat_instruments_file_path) {
	global $module, $user_name, $report_id, $pid;
	$server_url = $module->getServerAPIurl();
				
	$r_path = $module->getSystemSetting("r-path");
	if(is_array($r_path)){
		$r_path = $r_path[0];
	}
	
 	$pandocPath = $pandocPath = $module->getSystemSetting("pandoc-path");
	
	if(is_array($pandocPath)){
		$pandocPath = $pandocPath[0];
	}
	
	if($pandocPath=="") {
		return "Must specify a pandoc path in the module settings.";
	}

	$pandocPath = "Sys.setenv(RSTUDIO_PANDOC='$pandocPath');";
	
	// Get libpaths variable
	$arr_libPaths = $module->getSystemSetting("r-libraries-path");
	if(is_array($arr_libPaths)){
		$arr_libPaths = $arr_libPaths[0];
	}
	$libPaths = "";
	
	// Turn the paths into a command that will set the library paths for R.
	if (count($arr_libPaths)>0) {
		foreach($arr_libPaths as $libPath) {
			if ($libPaths!="") {
				$libPaths.=", ";
			}
			$libPaths .= "'$libPath'";
		}
		$libPaths = ".libPaths(c($libPaths));";
	}				
	
	// Replace backslashes with forward slashes in module path.
	$module_physical_path = str_replace("\\","/",$module->getModulePath());
	
	$markdown_file_path = $module_physical_path . "main.Rmd"; // changed from "R_Tables_and_Plots.Rmd" TODO: Delete comment				
	
	$output_folder = $module_physical_path . "output";
	
	$output_file_name = $output_folder . "/" . "p_" . $pid . "_r_" . $report_id . "_u_" . $user_name . ".html";
	
	if (!is_dir ($output_folder) && !mkdir($output_folder)) {
		return "Output folder not available.";
	}
	
	if(!is_writable($output_folder)) {
		return "Output folder is not writable";
	}
	
	//exec('"' . $r_path . '" -e "' . $libPaths . ' ' . $pandocPath . ' rmarkdown::render(\'' . $markdown_file_path . '\', output_file = \'' . $output_file_name . '\')" 2>&1', $exec_output);
	//exec('"' . $r_path . '" -e "' . $libPaths . ' ' . $pandocPath . '\')" 2>&1', $exec_output);

	//return $exec_output;
	//return $pandocPath;
	
	$r_code = "\"$r_path\" -e
			   \"$libPaths 
			   $pandocPath
			   report_data <- read.csv('$report_data_file_path', header = TRUE, sep = \",\", stringsAsFactors = FALSE);
			   data_dictionary <- read.csv('$data_dictionary_file_path', header = TRUE, sep = \",\", stringsAsFactors = FALSE);
			   project_info <- read.csv('$project_info_file_path', header = TRUE, sep = \",\", stringsAsFactors = FALSE);
			   instruments <- read.csv('$instruments_file_path', header = TRUE, sep = \",\", stringsAsFactors = FALSE);
			   repeated_forms <- read.csv('$repeat_instruments_file_path', header = TRUE, sep = \",\", stringsAsFactors = FALSE);
			   rmarkdown::render('$markdown_file_path', output_file = '$output_file_name')\"
			   2>&1";
	
	// print(report_data,data_dictionary,project_info,instruments,repeat_instruments)
	$r_code = trim(preg_replace('/\s+/', ' ', $r_code));
	
	exec($r_code, $exec_output);
	
	$exec_output = array_map('htmlspecialchars', $exec_output);
	
	if (end($exec_output) == "Execution halted")
		return Array('output' => utf8_encode(implode("<br/>",$exec_output)), 'status' => false);
	
	return Array('output'=>$output_file_name, 'status'=> true);
	/* $command = Array(
		$r_path,
		"-e",
		$r_code
	);
	
	$descriptorspec = array(
	   0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
	   1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
	   2 => array("pipe", "w")  // stderr is a file to write to
	);
	// return "HI";
	$r_proc = proc_open($command, $descriptorspec, $pipes, null, null, Array("bypass_shell"));
	
	$stdoutbuffer = "";
	$stderrbuffer = "";
	$i = 0;
	
	stream_set_blocking($pipes[1]);
	stream_set_blocking($pipes[2]);
	
	while (i < 10 && !(feof($pipes[1]) && feof($pipes[2]))) {
		$stdoutbuffer .= fgets($pipes[1]);
		$stderrbuffer .= fgets($pipes[2]);
		$i++;
		sleep(1);
	}
	
	// $output = stream_get_contents($pipes[1]);
	// echo $stdoutbuffer;
	// echo $stderrbuffer;
	
	
	fclose($pipes[0]);
	fclose($pipes[1]);
	fclose($pipes[2]);
	proc_close($r_proc); */
	
	return $stdoutbuffer.$stderrbuffer;
	
	return Array($r_path, $pandocPath, $libPaths);
}

function select_fields() {
	global $pid, $report_id;
	//return json_encode(Array ($_POST["params"], USERID));
	
	
	$report_data = get_report($report_id, $_POST["params"]);

	if (!$report_data)
		return '<h1 style=\"color:red;\">Failed to export report data</h1>';
	
	$data_dictionary = MetaData::getDataDictionary("csv", false, $_POST["field_name"], array(), false, false, null, $pid);
	
	if (!$data_dictionary)
		return '<h1 style=\"color:red;\">Failed to export data dictionary</h1>';
	
	
	$project_info = get_project_info($pid);
	
	if (!$project_info)
		return '<h1 style=\"color:red;\">Failed to export project info</h1>';
	
	$instruments = get_instruments($pid);
	
	if (!$instruments)
		return '<h1 style=\"color:red;\">Failed to export instrument data</h1>';
	
	$repeat_instruments = get_repeat_instruments($pid);
	
	if (!$repeat_instruments)
		$repeat_instruments = "form_name,custom_form_label\n";
	
	$report_data_file = tmpfile();
	$data_dictionary_file = tmpfile();
	$project_info_file = tmpfile();
	$instruments_file = tmpfile();
	$repeat_instruments_file = tmpfile();
	
	if (!$data_dictionary_file || !$project_info_file || !$instruments_file || !$repeat_instruments_file) {
		fclose($data_dictionary_file);
		fclose($project_info_file);
		fclose($instruments_file);
		fclose($repeat_instruments_file);
		return '<h1 style=\"color:red;\">Failed to create temporary files for R</h1>';
	}
	
	$status = true;
	
	$status = $status && fwrite($report_data_file, $report_data);
	$status = $status && fwrite($data_dictionary_file, $data_dictionary);
	$status = $status && fwrite($project_info_file, $project_info);
	$status = $status && fwrite($instruments_file, $instruments);
	$status = $status && fwrite($repeat_instruments_file, $repeat_instruments);
	
	$report_data_file_path = str_replace("\\","/",stream_get_meta_data($report_data_file)['uri']);
	$data_dictionary_file_path = str_replace("\\","/",stream_get_meta_data($data_dictionary_file)['uri']);
	$project_info_file_path = str_replace("\\","/",stream_get_meta_data($project_info_file)['uri']);
	$instruments_file_path = str_replace("\\","/",stream_get_meta_data($instruments_file)['uri']);
	$repeat_instruments_file_path = str_replace("\\","/",stream_get_meta_data($repeat_instruments_file)['uri']);
	
	$output = '<h1 style=\"color:red;\">Failed to write report data to files</h1>';
	
	//if ($status)
	$output = run_R($report_data_file_path, $data_dictionary_file_path, $project_info_file_path, $instruments_file_path, $repeat_instruments_file_path);

	fclose($report_data_file);
	fclose($data_dictionary_file);
	fclose($project_info_file);
	fclose($instruments_file);
	fclose($repeat_instruments_file);
	
	return $output;
	//readfile($output);
}

/* sleep(1);
echo print_r($_POST)."!";
echo $_POST["method"]."!";
echo $_POST["params"]["pid"]."!"; */

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
	default:
		echo nothing_to_show();
		break;
}



?>