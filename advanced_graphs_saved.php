<?php
echo "hi there\n";


 use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

/*
TODO:
- check user rights over report
- get report metadata and pass it as parameters to markdown

*/

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
		if (!(isset($field) && $field != '' && ($field == DataExport::LIVE_FILTER_EVENT_FIELD || $field == DataExport::LIVE_FILTER_DAG_FIELD || isset($Proj->metadata[$field])))) continue;
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
 
 function validateReportID() {
	global $module, $pid, $report_id, $token;
	
	if(!is_numeric($pid) ) {
		return array("missing or invalid pid", false);
	}
	
	if(!$module->isEnabledProject($pid)) {
		return array("project pid=$pid not included as valid project in the External Module control panel configuration. Check with your REDCap Admin.", false);
	}
	
	if (!is_numeric($report_id) || $report_id<1) {
		return array("missing or invalid report_id, you need to run and display a report in REDCap to produce Advanced Graphs", false);
	}
	
	
	if (!preg_match("/^[A-F|0-9]{32}$/", $token)) {
		return array("The token $token found at External Module control panel is not valid", false);			
	}
	return array("", true);
}

function getProjectInfo() {
	global $token;
	
	$data = array(
				'token' => $token,
				'content' => 'project',
				'format' => 'json',
				'returnFormat' => 'json'
			);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $module->getServerAPIurl());
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_VERBOSE, 0);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_AUTOREFERER, true);
	curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
	curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data, '', '&'));
	$output = json_decode(curl_exec($ch));
			
	curl_close($ch);
	
	return $output;
}

function validateProjectInfo($project_info) {
	global $pid;
	
	if(!isset($project_info->project_id)) {
		return array("API Token invalid. Check with the REDCap Admin", false);
	}

	if($project_info->project_id != $pid) {
		return array("This is a different project that does not match the API Token. Check with the REDCap Admin", false);
	}
	
	return array("", true);
}

function get_report() {
	global $report_id;
	$content = "";
	$num_results = -1;
	echo "HEY!</br>";
	// Get user rights
	$user_rights_proj_user = UserRights::getPrivileges(PROJECT_ID, USERID);
	echo print_r($user_rights_proj_user);
	unset($user_rights_proj_user);
	echo "THERE!</br>";
	// Does user have De-ID rights?
	$deidRights = ($user_rights['data_export_tool'] == '2');

	// De-Identification settings
	$hashRecordID = ($deidRights);
	$removeIdentifierFields = ($user_rights['data_export_tool'] == '3' || $deidRights);
	$removeUnvalidatedTextFields = ($deidRights);
	$removeNotesFields = ($deidRights);
	$removeDateFields = ($deidRights);
	
	// Build live filter logic from parameters
	list ($liveFilterLogic, $liveFilterGroupId, $liveFilterEventId) = buildReportDynamicFilterLogicReferrer($report_id, $query);
	echo "RETURNING!</br>";
	// Retrieve report from redcap
	$content = DataExport::doReport($report_id, 'export', 'csvraw', false, false,
									false, false, $removeIdentifierFields, $hashRecordID, $removeUnvalidatedTextFields,
									$removeNotesFields, $removeDateFields, false, false, array(), 
									array(), false, false, 
									false, true, true, $liveFilterLogic, $liveFilterGroupId, $liveFilterEventId, true, ",", '');

									
	if (!$content)
			return array ("Failed to retrieve report content", false);
	
	return array($content, true);
}

function get_data_dictionary() {
	return MetaData::getDataDictionary("csv", false);
}

function get_project_info() {
	global $lang;
	// Get project object of attributes
	$Proj = new Project();
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

function get_instruments() {
	global $post;
	// Don't output any CATs because they cannot be used in the Mobile App
	$cat_list = ($post['mobile_app']) ? PROMIS::getPromisInstruments() : array();
	// Loop through instruments
	$forms = array();
	$Proj = new Project();
	foreach ($Proj->forms as $form=>$attr) {
		if (in_array($form, $cat_list)) continue;
		$forms[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
	}
	
	$output = "";

	foreach ($forms as $index => $row) {
		$output .= $row['instrument_name'].",\"".str_replace('"', '""', $row['instrument_label'])."\"\n";
	}

	$fieldList = "instrument_name,instrument_label";
	$output = $fieldList . "\n" . $output;

	return $output;
}


function get_repeat_instruments() {
	global $lang;
	// Get project object of attributes
	$Proj = new Project();
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
	
	$Proj = new Project();
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
function advanced_graphs() {
	global $pid, $report_id, $token;
	
	list ($error, $status) = validatePID();
	
	if (!status) {
		return error;
	}
	
	$project_info = getProjectInfo();
	
	list ($error, $status) = validateProjectInfo($project_info);
	
	if (!status) {
		return error;
	}
	
	list ($report_content, $status) = get_report();
	
	if (!status) {
		return "Failed to export report contents";
	}
	
	list ($content, $status) = get_report();
	
	if (!status) {
		return "Failed to get the report data.";
	}
		
						
	// get system parameters
	// in some cases returns an array instead of string so take first element
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
	
	if (!is_dir ($output_folder) && !mkdir($output_folder)) {
		return "Output folder not available.";
	}
	
	if(!is_writable($output_folder)) {
		return "Output folder is not writable";
	}
	
	
	$command = array(
		$r_path,
		$markdown_launcher_path,
		$module_physical_path,
		$libPaths,
		$pandocPath
	);	
	
	$command = array("R", "-e", "readLines('stdin');readLines('stdin')");
	
	$descriptorspec = array(0 => array("pipe", "r"), 1 => array("pipe", "w"),  2 => array("pipe", "w"));
	$descriptorspec = array(
	   0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
	   1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
	   2 => array("pipe", "w") // stderr igets redirect id to stdout
	);
	// exec('"' . $r_path . '" -e "' . $libPaths . ' ' . $pandocPath . ' rmarkdown::render(\'' . $markdown_file_path . '\', params = ' . $params . ', output_file = \'' . $output_file_name . '\')" 2>&1', $exec_output);
		
	$process = proc_open($command, $descriptorspec, $pipes);
	
	if (is_resource($process)) {
		fwrite($pipes[0], $content);
		fclose($pipes[0]);
		fwrite($pipes[0], "Hello");
		fclose($pipes[0]);
		/* $r_output = "";
		while ($r_output == "")
			$r_output = stream_get_contents($pipes[1]); */
	}
} 

$user_rights = REDCap::getUserRights();
echo "<h3>id is ".PROJECT_ID."</h3>";

$user_name = array_keys($user_rights)[0];
$pid = 1*$user_rights[$user_name]["project_id"];

$token = $module->getProjectToken($pid);

//obtain parameters from referrer
$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$lf1=isset($query["lf1"]) ? $query["lf1"] : "";
$lf2=isset($query["lf2"]) ? $query["lf2"] : "";
$lf3=isset($query["lf3"]) ? $query["lf3"] : "";

$report_id = isset($query['report_id']) ? 1*$query['report_id'] : 0;
$report = DataExport::getReports($report_id);

$run_R = true;

$report = get_report()[0];
if (!$report) 
	return array ("Failed to retrieve report data", false);

$data_dictionary = get_data_dictionary();
if (!$data_dictionary) 
	return array ("Failed to retrieve data dictionary", false);

$project_info = get_project_info();
if (!$project_info) 
	return array ("Failed to retrieve project info", false);

$instruments = get_instruments();
if (!$instruments) 
	return array ("Failed to retrieve instruments", false);

$repeat_instruments = get_repeat_instruments();
if (!$repeat_instruments) 
	return array ("Failed to retrieve repeat instruments", false);

$file_errors = "";

$report_file = tmpfile();
if (!$report_file) {
	$run_R = false;
	$file_errors .= "Failed to create temporary file for report\n";
}

$report_file_path = str_replace("\\","/",stream_get_meta_data($report_file)['uri']);
if(!fwrite($report_file, $report)) {
	$run_R = false;
	$file_errors .= "Couldn't write report data to temporary file\n";
}

$data_dictionary_file = tmpfile();
if (!$data_dictionary_file) {
	$run_R = false;
	$file_errors .= "Failed to create temporary file for data dictionary\n";
}

$data_dictionary_file_path = str_replace("\\","/",stream_get_meta_data($data_dictionary_file)['uri']);
if(!fwrite($data_dictionary_file, $data_dictionary)) {
	$run_R = false;
	$file_errors .= "Couldn't write data dictionary to temporary file\n";
}

$project_info_file = tmpfile();
if (!$project_info_file) {
	$run_R = false;
	$file_errors .= "Failed to create temporary file for project info\n";
}

$project_info_file_path = str_replace("\\","/",stream_get_meta_data($project_info_file)['uri']);
if(!fwrite($project_info_file, $project_info)) {
	$run_R = false;
	$file_errors .= "Couldn't write project info to temporary file\n";
}

$instruments_file = tmpfile();
if (!$instruments_file) {
	$run_R = false;
	$file_errors .= "Failed to create temporary file for instruments\n";
}

$instruments_file_path = str_replace("\\","/",stream_get_meta_data($instruments_file)['uri']);
if(!fwrite($instruments_file, $instruments)) {
	$run_R = false;
	$file_errors .= "Couldn't write instruments to temporary file\n";
}

$repeat_instruments_file = tmpfile();
if (!$repeat_instruments_file) {
	$run_R = false;
	$file_errors .= "Failed to create temporary file for repeat instruments\n";
}

$repeat_instruments_file_path = str_replace("\\","/",stream_get_meta_data($repeat_instruments_file)['uri']);
if(!fwrite($repeat_instruments_file, $repeat_instruments)) {
	$run_R = false;
	$file_errors .= "Couldn't write repeat instruments to temporary file\n";
}


exec("Rscript -e \"read.csv('$repeat_instruments_file_path')\" 2>&1", $exec_output);

fclose($report_file);
fclose($data_dictionary_file);
fclose($project_info_file);
fclose($instruments_file);
fclose($repeat_instruments_file);

echo $file_errors;
ob_start();
echo utf8_encode(implode("<br/>",$file_errors));
echo utf8_encode(implode("<br/>",$exec_output));
?>
<script>
var source = new EventSource("<?php $module->getModulePath()."/advanced_graphs.php"?>");
source.onmessage = function(event) {
  document.getElementById("result").innerHTML += event.data + "<br>";
};
</script>

<?php
sleep(3);

$time = date('r');
echo "data: The server time is: {$time}\n\n";
flush();

 
//send_message('CLOSE', 'Process complete', 100);

/* $report_id='0', $outputType='report', $outputFormat='html', $apiExportLabels=false, $apiExportHeadersAsLabels=false,
$outputDags=false, $outputSurveyFields=false, $removeIdentifierFields=false, $hashRecordID=false, $removeUnvalidatedTextFields=false, $removeNotesFields=false,
$removeDateFields=false, $dateShiftDates=false, $dateShiftSurveyTimestamps=false, $selectedInstruments=array(), $selectedEvents=array(), 
$returnIncludeRecordEventArray=false, $outputCheckboxLabel=false, $includeOdmMetadata=false, $storeInFileRepository=true,
$replaceFileUploadDocId=true, $liveFilterLogic="", $liveFilterGroupId="", $liveFilterEventId="", 
$isDeveloper=false, $csvDelimiter=",", $decimalCharacter='', $returnFieldsForFlatArrayData=array(),
$minimizeAmountDataReturned=false, $applyUserDagFilter=true, $bypassReportAccessCheck=false, $excludeMissingDataCodes=false,
$returnBlankForGrayFormStatus=false, $doLoggingForExports=true, $isDataExportAction=false, $project_id=null, $usedForSmartChart=false)
 */ 
/* for ($i = 1; $i <= DataExport::MAX_LIVE_FILTERS; $i++) {
	// Get field name
	$field = $report['dynamic_filter'.$i];
	if ()
	}
} */
echo "$report_id";
echo "there"; 




/* 
$error = "";


if(!is_numeric($pid) || !is_numeric($report_id) || $report_id<1) {
	if(!is_numeric($pid) ) {
		$error = "missing or invalid pid";
	}
	else {
		$error = "missing or invalid report_id, you need to run and display a report in REDCap to produce Advanced Graphs";
	}
} else {
	if(!$module->isEnabledProject($pid)) {
		$error = "project pid=$pid not included as valid project in the External Module control panel configuration. Check with your REDCap Admin.";
	} else {
		$token = $module->getProjectToken($pid);
		if (!preg_match("/^[A-F|0-9]{32}$/", $token)) {
			$error = "The token $token found at External Module control panel is not valid";			
		} else {

			$data = array(
				'token' => $token,
				'content' => 'project',
				'format' => 'json',
				'returnFormat' => 'json'
			);
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $module->getServerAPIurl());
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_VERBOSE, 0);
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
			curl_setopt($ch, CURLOPT_AUTOREFERER, true);
			curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
			curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data, '', '&'));
			$output = json_decode(curl_exec($ch));
			
			curl_close($ch);
			if(!isset($output->project_id)  ) {
				$error = "API Token invalid. Check with the REDCap Admin";
			}
			else {
				if($output->project_id != $pid ) {
					$error = "This is a different project that does not match the API Token. Check with the REDCap Admin";
				}
				else {
					$dynamic_filter1 = "";
					$dynamic_filter2 = "";
					$dynamic_filter3 = "";
					// get report metadata to validate if user has access right to the report
					$user_has_access_right = false;
					$sql = "SELECT * FROM redcap_reports WHERE project_id = $pid AND report_id = $report_id";

					$result = db_query($sql);
					while($row = mysqli_fetch_array($result,MYSQLI_ASSOC))
					{
						$dynamic_filter1 = $row["dynamic_filter1"];
						$dynamic_filter2 = $row["dynamic_filter2"];
						$dynamic_filter3 = $row["dynamic_filter3"];
					   
					   $user_has_access_right = true; // TO DO  validate
					}
					if (!$user_has_access_right==true) {
						$error = "user has no access to report";
					} else {
						$server_url = $module->getServerAPIurl();
						
						// get system parameters
						// in some cases returns an array instead of string so take first element
										
						$r_path = $module->getSystemSetting("r-path");
						if(is_array($r_path)){
							$r_path = $r_path[0];
						}
						
						$pandocPath = $pandocPath = $module->getSystemSetting("pandoc-path");
						
						if(is_array($pandocPath)){
							$pandocPath = $pandocPath[0];
						}
						
						if($pandocPath!="") {
							$pandocPath = "Sys.setenv(RSTUDIO_PANDOC='$pandocPath');";
						}


						$arr_libPaths = $module->getSystemSetting("r-libraries-path");
						if(is_array($arr_libPaths)){
							$arr_libPaths = $arr_libPaths[0];
						}
						$libPaths = "";
						if (count($arr_libPaths)>0) {
							foreach($arr_libPaths as $libPath) {
								if ($libPaths!="") {
									$libPaths.=", ";
								}
								$libPaths .= "'$libPath'";
							}
							$libPaths = ".libPaths(c($libPaths));";
						}				
								
						$module_physical_path = str_replace("\\","/",$module->getModulePath());
						
						$markdown_file_path = $module_physical_path . "main.Rmd"; // changed from "R_Tables_and_Plots.Rmd" TODO: Delete comment				
						
						$output_folder = $module_physical_path . "output";
						
						if (!is_dir ($output_folder) && !mkdir($output_folder)) {
							$error ="Output folder not available.";
						} else {
							
							if(!is_writable($output_folder)) {
								$error="Output folder is not writable";
							} else {
								$output_file_name = $output_folder . "/" . "p_" . $pid . "_r_" . $report_id . "_u_" . $user_name . ".html";
								
								$arr_params = Array("pid" => $pid,
												"reportId" => $report_id,
												"token" => $token,
												"server_url" => $server_url,
												"dynamic_filter1" => $dynamic_filter1,
												"dynamic_filter2" => $dynamic_filter2,
												"dynamic_filter3" => $dynamic_filter3,
												"dynamic_filter3" => $dynamic_filter3,
												"lf1" => $lf1,
												"lf2" => $lf2,
												"lf3" => $lf3,
												);
								$params = "";
								foreach($arr_params as $key=>$value) {
									if ($params!="") {
										$params.=", ";
									}
									$params .= $key . "='$value'";
								}
								$params = "list($params)";

								$exec_output = "";
								//die('"' . $r_path . '" -e "' . $libPaths . ' ' . $pandocPath . ' rmarkdown::render(\'' . $markdown_file_path . '\', params = ' . $params . ', output_file = \'' . $output_file_name . '\')" 2>&1');
								exec('"' . $r_path . '" -e "' . $libPaths . ' ' . $pandocPath . ' rmarkdown::render(\'' . $markdown_file_path . '\', params = ' . $params . ', output_file = \'' . $output_file_name . '\')" 2>&1', $exec_output);
								//print_r($exec_output);
								// check if the execution was successful to show the file. In other case show error
								// apparently if $exec_output==Array() there were an error
								// if it was ok, the last element of $exec_output array should be 
								// Output created: $output_file_name
								// It needs more testing
								
								if(!$exec_output || !is_array($exec_output) || count($exec_output)==0) {
									$error = "There were an error during R markdown execution.";
								} else {
									if(end($exec_output) != "Output created: $output_file_name") {
										$error="Unexpected output " . utf8_encode(implode("<br/>",$exec_output));
									} else {						
										//read the newly created HTML file and return it as string for web browser to consume
										require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';	
										readfile($output_file_name);
										require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

if ($error != "") {
	//TODO: evaluate to log error instead of show it
	require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';	
	echo "<div class='alert danger'><strong>" . $module->getModuleName() . " error: </strong><br>$error</div>";
	require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
}  
?>*/