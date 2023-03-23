<?php
namespace VIHA\AdvancedGraphsInteractive;

use \REDCap as REDCap;
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;
use \DateTime;
use \DateTimeZone;
use DataExport;
use MetaData;
use HtmlPage;
use UserRights;
use Project;
use Logging; 
use RCView;
use Form;
use Piping;

class AdvancedGraphsInteractive extends \ExternalModules\AbstractExternalModule
{
	private $enabled_projects;

	public $dashboard_table_name = "advanced_graphs_dashboards_v2";

	public $data_dictionary;
	public $report_fields;
	public $instruments;
	public $instruments_dictionary;
	public $repeat_instruments;
	public $repeats_dictionary;

	public $query_result;
	
    public function __construct()
    {
		global $conn;
        parent::__construct();
		
		// enabled projects (pid and token at this module configuration)
		$arr_projects_api_tokens = $this->getSystemSetting("projects-api-tokens");
		$arr_projects_pids = $this->getSystemSetting("project-pid");
		$arr_projects_tokens = $this->getSystemSetting("project-token");

		$this->enabled_projects = Array();
		foreach($arr_projects_api_tokens as $i => $valid) {
			if ($valid=="true") {
				$this->enabled_projects[$arr_projects_pids[$i]] = $arr_projects_tokens[$i];
			}
		}		

		$this->module_js_path = str_replace("\\","/",$this->getModulePath())."js/";
		$this->module_css_path = str_replace("\\","/",$this->getModulePath())."css/";
		$this->module_path = str_replace("\\","/",$this->getModulePath());
    }

	function initialize_report($pid, $user_id, $report_id, $live_filters) {
		$this->data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $pid);
		
		$this->report_fields = $this->get_accessible_fields($pid, $user_id, $report_id);
		
		$this->report = $this->get_report($pid, $report_id, $live_filters, $user_id = $user_id, "array");
		
		$Proj = new Project($pid);

		$this->instruments = array();
		$this->instruments_dictionary = array();

		// echo print_r($report_fields);
		foreach ($Proj->forms as $form=>$attr) {
			$this->instruments[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
			$this->instruments_dictionary[$form] = strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES));
		}
		
		$this->instruments_dictionary['adv_graph_non_repeating'] = "Non-repeating instruments";

		$this->repeat_instruments = $this->get_repeat_instruments($pid);
		$this->repeats_dictionary = array();

		foreach ($this->repeat_instruments as $instrument) {
			$this->repeats_dictionary[$instrument['form_name']] = $instrument['custom_form_label'];
		}	
	}

	function redcap_module_system_enable($version) {
		// Do stuff, e.g. create DB table
		$dashboard_table_name = $this->dashboard_table_name;
		try {
			$result = $this->query("CREATE TABLE if not exists $dashboard_table_name (
				dash_id INT(10) AUTO_INCREMENT PRIMARY KEY,
				project_id INT(10), INDEX(project_id),
				report_id INT(10),
				title TEXT,
				body LONGTEXT,
				dash_order INT(3),
				is_public tinyint(1) DEFAULT 0 NOT NULL)"
			, []);
			$this->log("Created new $dashboard_table_name table (if one did not already exist)");
		} catch (\Throwable $e) {
			$this->log("Failed $this->PREFIX to create table $dashboard_table_name with error:\n".$e->getMessage());
		}
		
		$default_graphs = array("likert" => "likert", 
								"scatter" => "scatter", 
								"barplot" => "barplot", 
								"map" => "map", 
								"network" => "network");

		$current_graphs = $this->getSystemSetting("graph_types");

		foreach ($current_graphs as $key => $graph_type) {
			$default_graphs[$key] = $graph_type;
		}

		$this->setSystemSetting("graph_types", array_values($default_graphs));
		// $this->setSystemSetting("graph_folder", array_keys($default_graphs));
		// $this->setSystemSetting("graph_function", array_values($default_graphs));

		// $this->log(json_encode($this->getSystemSetting("graph_types")));
	}

	// function redcap_module_system_disable($version) {
	// 	// Do stuff, e.g. create DB table.
	// 	$this->delete_advanced_graphs_table();
	// }

	function delete_advanced_graphs_table() {
		$dashboard_table_name = $this->dashboard_table_name;
		try {
			$this->query("DROP TABLE IF EXISTS $dashboard_table_name", []);
			$this->log("Deleted $dashboard_table_name table");
		} catch (\Throwable $e) {
			$this->log("Failed to delete table $dashboard_table_name with error:\n".$e->getMessage());
			// throw new PoppingException("Failed to delete table advanced_graphs_dashboards with error:\n".$e->getMessage());
		}
	}
	
	function redcap_module_save_configuration($project_id) {

				$error = "";
				$r_path = $this->getSystemSetting("r-path");
				if(is_array($r_path)){
					$r_path = $r_path[0];
				}
				if ($r_path=="" || !file_exists($r_path)) {
					$error .= "\nInvalid RScript path: $r_path";
				}
				
				$pandocPath = $this->getSystemSetting("pandoc-path");
				if(is_array($pandocPath)){
					$pandocPath = $pandocPath[0];
				}
				if ($pandocPath=="" || !is_dir($pandocPath)) {
					$error .= "\nInvalid Pandoc path: $pandocPath";
				}

				$arr_libPaths = $this->getSystemSetting("r-libraries-path");
				if(is_array($arr_libPaths)){
					$arr_libPaths = $arr_libPaths[0];
				}
				if (count($arr_libPaths)>0) {
					foreach($arr_libPaths as $libPath) {
						if ($libPath=="" || !is_dir($libPath)) {
							$error .= "\nInvalid ath to R libraries: $libPath";
						}
					}
				}	
		if($error!="") {
			$this->log("Error configuring settings: $error");
			$this->disable($this->PREFIX, false);
		}
	}
	
	//redcap_module_link_check_display($project_id, $link): Triggered when each link defined in config.json 
	//is rendered. Override this method and return null if you don't want to 
	//display the link, or modify and return the $link parameter as desired. This method also controls 
	//whether pages will load if users access their URLs directly.
	// $link = Array ( [name] => Advanced Graphs [icon] => gear [url] => http://localhost/redcap_8-4/redcap_v8.5.8/ExternalModules/?prefix=advanced_graphs&page=advanced_graphs [prefix] => advanced_graphs )
	
	//show link only in enabled project (with pid and token at config) AND if page is DataExport 
	//and report_id is in QUERY_STRING
    function redcap_module_link_check_display($project_id, $link)
    {		
		$current_page_is_this_module = strpos($_SERVER["QUERY_STRING"],"prefix=" . $this->PREFIX) > -1;
		$current_page_is_this_page = strpos($_SERVER["QUERY_STRING"],"page=edit_dash") > -1;
		$current_page_is_export_report = strpos($_SERVER["PHP_SELF"],"/DataExport/") > -1 && strpos($_SERVER["QUERY_STRING"],"&report_id=") > -1 && strpos($_SERVER["QUERY_STRING"],"&addedit") <= -1;

		$report_id = $_GET['report_id'];

		if ($link['id'] == "edit_dash") {
			$link['url'] .= "&dash_id=0&report_id=$report_id";
			if ($current_page_is_export_report)
				return($link);


			if ($current_page_is_this_page)
				$link['url'] = "#";
			else
				return(null);
		}

		// if ($link['id'] == "advanced_graphs_config") {
		// 	if (!$this->getUser()->isSuperUser())
		// 		return(null);
		// }

		return($link);


		// if ($link['id'] == "edit_dash" && $current_page_is_this_module) {
		// 	$link['url'] = "#";
		// 	// echo json_encode($link);
		// 	return(null);
		// }

		
		if ($link['id'] == "edit_dash") {
			if (!$current_page_is_export_report)
				return(null);
			$link['url'] .= "&dash_id=0";
		} 
		return $link;
// 		if($link["prefix"]==$this->PREFIX) {			
// 			$link["target"] = "_blank";
// //			if (!($current_page_is_this_module || ($current_page_is_export_report && $this->isEnabledProject($project_id)))) {
// 			if (!($current_page_is_this_module || $current_page_is_export_report )) {
// 				$link=null;
// 			} 
// 		}
		
    }
/*	
	function redcap_module_project_enable($version, $project_id) {
		echo "version: " . $version;
		echo "project_id: " . $project_id;
		$version_n_pid = $version . " " . $project_id;
		if($version_n_pid!="") {
			throw new Exception("This is a test");
			//die($version_n_pid);
		}
	}
*/
	function redcap_every_page_top ( int $project_id ) {
		$current_page_is_export_report = strpos($_SERVER["PHP_SELF"],"/DataExport/") > -1 && strpos($_SERVER["QUERY_STRING"],"&report_id=") > -1;
		if($current_page_is_export_report) {
		
		}
		
	}

	function redcap_module_ajax($action, $payload, $project_id, $record, $instrument, $event_id, $repeat_instance, $survey_hash, $response_id, $survey_queue_hash, $page, $page_full, $user_id, $group_id){
        if($action === 'newDashboard'){
            return json_encode($this->newDash($project_id, $payload));
        }
		else if($action === 'saveDashboard'){
			$result = array(
				"view_url" => "#", //$this->getUrl("view_dash.php", true, true) . "&dash_id=" . $payload["dash_id"] . "&report_id=" . $payload["report_id"],
				"dash_list_url" => "#" //$this->getUrl("advanced_graphs.php", true, true)
			);

			$newDash = $this->saveDash($payload);
			if ($newDash) {
				return json_encode($result);
			}

			return "error man";
		}
		else if ($action === 'getDashboards') {
			return json_encode($this->getDashboards($project_id));
		}
		else if ($action === 'deleteDashboard') {
			return json_encode($this->deleteDash($payload["project_id"], $payload["dash_id"]));
		}
		else if ($action === 'getReportName') {
			return $this->getReportName($payload["project_id"], $payload["report_id"]);
		}
		else {
			return false;
		}
    }
	
	function isEnabledProject($project_id) {
		return array_key_exists($project_id,$this->enabled_projects);
	}
	
	function getServerAPIurl() {
		return $GLOBALS["redcap_base_url"] . "api/";
	}
	
	function getProjectToken($project_id) {
		$token = null;
		if($this->isEnabledProject($project_id)) {
			$token = $this->enabled_projects[$project_id];
		} 
		return $token;
	}
	
	function getParameter($parameter_name,$default_value="", $method="post") {
		global $_POST,$_GET,$_FILES;
		$result=null;
		if ($method=="post") {
		  if(isset($_POST[$parameter_name])){
			if ($_POST[$parameter_name]!="") {
			  $result= $_POST[$parameter_name];
			} else {
			  $result= $default_value;
			}
		  } else  {
			if(isset($_GET[$parameter_name])){
			  if ($_GET[$parameter_name]!="") {
				$result= $_GET[$parameter_name];
			  } else {
				$result= $default_value;
			  }
			} else {
				if(isset($_FILES[$parameter_name])){
				  if ($_FILES[$parameter_name]["name"]!="") {
					$result= $_FILES[$parameter_name];
				  } else {
					$result= $default_value;
				  }
				} else {
				  $result= $default_value;
				}
			 }
		   }
		} else if ($method=="GET") {
		  if(isset($_GET[$parameter_name])){
			if ($_GET[$parameter_name]!="") {
			  $result= $_GET[$parameter_name];
			} else {
			  $result= $default_value;
			}
		  } else  {
			if(isset($_POST[$parameter_name])){
			  if ($_POST[$parameter_name]!="") {
				$result= $_POST[$parameter_name];
			  } else {
				$result= $default_value;
			  }
			} else {
				if(isset($_FILES[$parameter_name])){
				  if ($_FILES[$parameter_name]!="") {
					$result= $_FILES[$parameter_name];
				  } else {
					$result= $default_value;
				  }
				} else {
				  $result= $default_value;
				}
			 }
		   }
		}

		
		$result=str_replace("\\\"","\"",$result) ;
		$result=str_replace("\\'","'",$result) ;
		$result=str_replace("\\\\'","\\'",$result) ;
		$result=str_replace("\\\\\"","\\\"",$result) ;	
	return $result;
	}

	function loadJS($js_file, $folder = "js", $outputToPage=true) {
		// Create script tag
		$output = "<script type=\"text/javascript\" src=\"" . $this->getURL($js_file,  $this->module_js_path). "\"></script>\n";
		if ($outputToPage) {
			print $output;
		} else {
			return $output;
		}
	}

	// Output the link/style tag for a given CSS file
	function loadCSS($css_file, $folder = "css", $outputToPage=true)
	{
		// Create link tag
		$output = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen,print\" href=\"" . $this->getURL($css_file,  $this->module_js_path) . "\">\n";
		if ($outputToPage) {
			print $output;
		} else {
			return $output;
		}
	}
	

	function get_repeat_instruments($pid, $format="array") {
		global $lang;
		// Get project object of attributes
		$Proj = new Project($pid);
		// if project has not repeating forms or events

		if(!$Proj->hasRepeatingFormsEvents()){
			return ($Proj->longitudinal ? "event_name,form_name,custom_form_label" : "form_name,custom_form_label")."\n";
		}

		$raw_values = $Proj->getRepeatingFormsEvents();
		$csv = 'form_name,custom_form_label\n';

		if($Proj->longitudinal){
			$eventForms = $Proj->eventsForms;
			foreach ($eventForms as $dkey=>$row){
				$event_name = Event::getEventNameById($Proj->project_id,$dkey);
				$sql = "select form_name, custom_repeat_form_label from redcap_events_repeat where event_id = " . db_escape($dkey) . "";
				$q = $this->query($sql, []);
				if(db_num_rows($q) > 0){
					while ($row = $q->fetch_assoc()){
						$form_name = ($row['form_name'] ? $row['form_name'] : '');
						$form_label = ($row['custom_repeat_form_label'] ? $row['custom_repeat_form_label'] : '');
						$results[] = array('event_name'=>$event_name, 'form_name'=>$form_name, 'custom_form_label'=>$form_label);
					}
				}
			}
		}else{//classic project
			foreach (array_values($raw_values)[0] as $dkey=>$row){
				$results[] = array('form_name'=>$dkey, 'custom_form_label'=>$row);
				$csv .= "$dkey,$row\n";
			}
		}

		return ($format == "array") ? $results : $csv;
	}

	function renderDashEditor() {
		// Return an error if PID is not set
		if (!isset($_GET['pid'])) {
			echo "<h1 style='color: red;'>Unable to obtain project ID</h1>";
			return;
		}

		// Get PID and dash_id from url
		$pid = $_GET['pid'];
		$dash_id = $_GET['dash_id'];

		// Parse live filters from referer
		// $live_filters = $this->getLiveFiltersFromReferer();
		parse_str(parse_url($_SERVER["HTTP_REFERER"], PHP_URL_QUERY), $live_filters);

		// Get the active dashboard if there dash id is not null or 0
		if (isset($_GET['dash_id']) && $_GET['dash_id'] != '0') {
			$dashboard = $module->getDashboards($pid, $dash_id);
			$report_id = $dashboard['report_id'];
			$live_filters = $dashboard['live_filters'];
		}

		// If the report_id is not set get it from the url
		if (!isset($report_id))
			$report_id = $_GET['report_id'];
			
		// If the report_id is still not set return an error
		if (!isset($report_id)) {
			echo "<h1 style='color: red;'>New Dashboards must be created from the context of a report</h1>";
			return;
		}

		// If the report_id is 0 change it to all
		if ($report_id == 0)
			$report_id = "ALL";

		// Load the code needed to build forms
		$this->loadJS("dash-builder.js");
		$this->loadCSS("advanced-graphs.css");

		// Load the js and css needed to display maps
		$this->loadAllJS('mapdependencies/js');
		$this->loadAllCSS('mapdependencies/css');

		echo "<script>var AdvancedGraphsInteractive = {};
		AdvancedGraphsInteractive.graph_types = {};</script>";

		$graph_types = $this->getSystemSetting("graph_types");

		foreach($graph_types as $graph_type) {
			$this->loadJS("interactions.js", "graph_forms/$graph_type");
		}


	}

	// Obtain any dynamic filters selected from query string live_filters
	function buildReportDynamicFilterLogicReferrer($report_id, $live_filters)
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
			if (!isset($live_filters['lf'.$i]) || $live_filters['lf'.$i] == '') continue;
			
			// Rights to view data from field? Must have form rights for fields, and if a DAG field, then must not be in a DAG.
			if (isset($Proj->metadata[$field]) && $field != $Proj->table_pk && $user_rights['forms'][$Proj->metadata[$field]['form_name']] == '0') {
				unset($live_filters['lf'.$i]);
				continue;
			} elseif ($field == DataExport::LIVE_FILTER_DAG_FIELD && is_numeric($user_rights['group_id'])) {
				unset($live_filters['lf'.$i]);
				continue;
			}
			
			// Decode the query string param (just in case)
			$live_filters['lf'.$i] = rawurldecode(urldecode($live_filters['lf'.$i]));
			
			// Get field choices
			if ($field == DataExport::LIVE_FILTER_EVENT_FIELD) {
				// Add blank choice at beginning
				$choices = array(''=>"[".$lang['global_45']."]");
				// Add event names
				foreach ($Proj->eventInfo as $this_event_id=>$eattr) {
					$choices[$this_event_id] = $eattr['name_ext'];
				}
				// Validate the value
				if (isset($choices[$live_filters['lf'.$i]])) {
					$dynamic_filters_event_id = $live_filters['lf'.$i];
				}
			} elseif ($field == DataExport::LIVE_FILTER_DAG_FIELD) {
				$choices = $Proj->getGroups();
				// Add blank choice at beginning
				$choices = array(''=>"[".$lang['global_78']."]") + $choices;
				// Validate the value
				if (isset($choices[$live_filters['lf'.$i]])) {
					$dynamic_filters_group_id = $live_filters['lf'.$i];
				}
			} elseif ($field == $Proj->table_pk) {
				$choices = Records::getRecordList($Proj->project_id, $user_rights['group_id'], true);
				// Add blank choice at beginning
				$choices = array(''=>"[ ".strip_tags(label_decode($Proj->metadata[$field]['element_label']))." ]") + $choices;
				// Validate the value
				if (isset($choices[$live_filters['lf'.$i]])) {
					$value = (DataExport::LIVE_FILTER_BLANK_VALUE == $live_filters['lf'.$i]) ? '' : str_replace("'", "\'", $live_filters['lf'.$i]); // Escape apostrophes
					$dynamic_filters_logic[] = "[$field] = '$value'";
				}
			} else {
				$realChoices = $Proj->isSqlField($field) ? parseEnum(getSqlFieldEnum($Proj->metadata[$field]['element_enum'])) : parseEnum($Proj->metadata[$field]['element_enum']);
				// Add blank choice at beginning + NULL choice
				$choices = array(''=>"[ ".strip_tags(label_decode($Proj->metadata[$field]['element_label']))." ]")
						+ $realChoices
						+ array(DataExport::LIVE_FILTER_BLANK_VALUE=>$lang['report_builder_145']);
				// Validate the value
				if (isset($choices[$live_filters['lf'.$i]]) || isset($missingDataCodes[$live_filters['lf'.$i]])) {
					$value = (DataExport::LIVE_FILTER_BLANK_VALUE == $live_filters['lf'.$i]) ? '' : $live_filters['lf'.$i];
					$dynamic_filters_logic[] = "[$field] = '$value'";
				}
			}
		}
		
		// Return logic and DAG group_id
		return array(implode(" and ", $dynamic_filters_logic), $dynamic_filters_group_id, $dynamic_filters_event_id);
	}

	function get_accessible_fields($pid, $user_id, $report_id)
	{
		// Get user rights
		$user_rights_proj_user = UserRights::getPrivileges($pid, $user_id);
		$user_rights = $user_rights_proj_user[$pid][strtolower($user_id)];
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

		$report_fields = DataExport::getReports($report_id)["fields"];

		$removed_fields = $deidRights ? DataExport::deidFieldsToRemove($removeOnlyIdentifiers=true, 
									   $removeDateFields=!$deidRights, $removeRecordIdIfIdentifier=$deidRights) : array();
		
		return array_diff($report_fields, $removed_fields);

	}

	function get_report($pid, $report_id, $live_filters, $user_id=null, $format="csvraw") {
		$hashRecordID = true;
		$removeIdentifierFields = true;
		$removeUnvalidatedTextFields = true;
		$removeNotesFields = true;
		$removeDateFields = true;

		if ($report_id == 0)
			$report_id = "ALL";
		
		if ($user_id) {
			// Get user rights
			$user_rights_proj_user = UserRights::getPrivileges($pid, $user_id);
			$user_rights = $user_rights_proj_user[$pid][strtolower($user_id)];
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
		}
		
		// Build live filter logic from parameters
		list ($liveFilterLogic, $liveFilterGroupId, $liveFilterEventId) = self::buildReportDynamicFilterLogicReferrer($report_id, $live_filters);

		$as_array = ($format == "array") ?  $this->report_fields : array();
	
		// Retrieve report from redcap
		// $content = REDCap::getReport($report_id, $format, false, false);
		
		$content = DataExport::doReport($report_id, 'export', $format, false, false,
										false, false, $removeIdentifierFields, $hashRecordID, $removeUnvalidatedTextFields,
										$removeNotesFields, $removeDateFields, false, false, array(), 
										array(), false, false, 
										false, true, true, $liveFilterLogic, $liveFilterGroupId, $liveFilterEventId, true, ",", '', $as_array);
	
										
		return $content;
	}

	// returns the data dictionary for a project
	public function getDataDictionary($project_id) {
		return REDCap::getDataDictionary($project_id, 'array');
	}

	// returns the name of the report
	public function getReportName($project_id, $report_id) {
		$sql = "select title from redcap_reports where project_id = $project_id and report_id = $report_id";
		$q = $this->query($sql, []);
		$row = $q->fetch_assoc();
		return $row['title'];
	}

	// returns the report fields
	public function getReportFields($project_id, $report_id) {
		$fields = array();
		$sql = "select * from redcap_reports_fields where report_id = $report_id
				order by field_order";
		$q = $this->query($sql, []);
		while ($row =  $q->fetch_assoc()) {
			$fields[] = $row['field_name'];
		}
		return $fields;
	}
	
	// returns the report fields by repeating instument
	public function getReportFieldsByRepeatInstrument($project_id, $report_id) {
		$Proj = $this->getProject($project_id);
		$data_dictionary = REDCap::getDataDictionary($project_id, "array");
		$repeat_instruments = $Proj->getRepeatingForms();
		$report_fields =$this->getReportFields($project_id, $report_id);

		$repeat_dictionary = array();
		$non_repeats = array();

		// get the repeating instruments
		foreach ($repeat_instruments as $instrument) {
			$repeat_dictionary[$instrument] = array("form_name" => $instrument, "label" => REDCap::getInstrumentNames($instrument, $project_id), "fields" => array());
		}

		$repeat_dictionary[""] = array("form_name" => "", "label" => $this->tt('non_repeat_instrument_label'), "fields" => array());


		// get the fields for each repeating instrument
		foreach ($report_fields as $field_name) {
			$field = $data_dictionary[$field_name];

			if (!$field)
				continue;

			if (in_array($field['form_name'], $repeat_instruments))
				$repeat_dictionary[$field['form_name']]['fields'][] = $field;
			else
				$repeat_dictionary[""]['fields'][] = $field;
		}

		if (!count($repeat_dictionary[""]['fields']))
			unset($repeat_dictionary[""]);

		// return an array of repeating instruments and non repeating fields
		return $repeat_dictionary;
	}


	function getReport($report_id) {
		// Retrieve report from redcap
		$report = REDCap::getReport($report_id, 'array');

		// Flatten the report
		$flattened_report = array();

		// For each record in the report
		foreach ($report as $record) {
			// For each event in the record whose key isn't 'repeat_instances'
			foreach ($record as $event_id => $event) {
				if ($event_id != 'repeat_instances') {
					// Add the event id, an empty repeat instrument, and an empty repeat instance to the event
					$event['redcap_repeat_instrument'] = '';
					$event['redcap_repeat_instance'] = '';
					$event['redcap_event_name'] = $event_id;

					// Add the event to the flattened report
					$flattened_report[] = $event;

					// Continue to the next event
					continue;
				}

				// For the event whose key is 'repeat_instances'
				foreach ($event as $event_id => $repeat_instruments) {
					// For each repeat instrument in the event
					foreach ($repeat_instruments as $repeat_instrument => $repeat_instances) {
						// For each repeat instance in the repeat instrument
						foreach ($repeat_instances as $repeat_instance => $repeat_instance_data) {
							// Add the event id, repeat instrument, and repeat instance to the added repeat instance to the flattened report
							$repeat_instance_data['redcap_repeat_instrument'] = $repeat_instrument;
							$repeat_instance_data['redcap_repeat_instance'] = $repeat_instance;
							$repeat_instance_data['redcap_event_name'] = $event_id;

							// Add the repeat instance to the flattened report
							$flattened_report[] = $repeat_instance_data;
						}
					}
				}
			}
		}

		// Return the flattened report
		return $flattened_report;
	}


	// Translate backend limiter operator (LT, GTE, E) into mathematical operator (<, >=, =)
	public static function translateLimiterOperator($backend_value)
	{
		$all_options = array('E'=>'=', 'NE'=>'!=', 'LT'=>'<', 'LTE'=>'<=', 'GT'=>'>', 'GTE'=>'>=');
		return (isset($all_options[$backend_value]) ? $all_options[$backend_value] : 'E');
	}

	function get_report_2() { //$report_id, $live_filters, $format="csvraw"
		return query("select * from redcap_reports_fields")->fetch_assoc();
	}

	function add_instrument_labels($grouped_fields) {
		if (!isset($this->instruments_dictionary))
			return false;
		// Add the appropriate instrument label to each instrument
		foreach($grouped_fields as $instrument => $group) {
			$grouped_fields[$instrument]['instrument_label'] = $this->instruments_dictionary[$instrument];
		}

		return $grouped_fields;
	}
	
	// TODO: Documentation
	// https://github.com/jsonform/jsonform/wiki#outline
	function likert_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;

		// TODO: Set keywords in module settings.
		// field_types that are candidates for likert
		$like_likert = array("dropdown", "radio");
		
		// If any of the following keywords are contained in the options
		// it will be considered a likert category
		$key_likert_words = array("not useful", "not at all useful", "difficult", "none of my needs", "strongly disagree", "somewhat disagree", "completely disagree", "quite dissatisfied", "very dissatisfied", "Extremely dissatisfied", "poor", "never", "worse", "severely ill", "inutil", "infatil", "completamente inutil", "completamente infatil", "dificil", "ninguna de mis necesidades", "totalmente en desacuerdo", "parcialemnte en desacuerdo", "completamente en desacuerdo", "muy insatisfecho(a)", "totalmente insatisfecho(a)", "nunca", "peor", "gravemente enfermo");
		
		// Create an array that groups fields by repeating instruments
		$likert_fields = array();

		// For each report_field...
		foreach ($this->report_fields as $field_name) {
			// Get all field attributes from data dictionary
			$field = $this->data_dictionary[$field_name];
			
			// Check that field type can be interpreted as likert
			$type_matches = in_array($field['field_type'], $like_likert);
			
			// Check that the choices contain a likert keyword
			$selection_matches = preg_match("/".implode("|", $key_likert_words)."/", strtolower($field['select_choices_or_calculations']));

			// If the field can be interpreted as liekrt
			if ($type_matches && $selection_matches) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($this->repeats_dictionary))) {
					$likert_fields[$field['form_name']]['choices'][$field['select_choices_or_calculations']][] = $field_name;
					continue;
				} 

				// If it does not belong to a repeat instrument map it to the non-repeating instrument category
				$likert_fields['adv_graph_non_repeating']['choices'][$field['select_choices_or_calculations']][] = $field_name;
			}
		}
		
		// If by instrument is empty return an empty array
		if (!$likert_fields)
			return array();

		
		// Return the fields grouped by instrument
		return self::add_instrument_labels($likert_fields);
	}
	
	function numeric_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;
		// when searching for numeric fields
		$ignored_names_numeric = array("latitude", "longitude", "latitud", "longitud");

		// text validation strings to consider as a numerical column
		$accepted_text_validation = array("integer", "number", "float", "decimal");

		// Create an array that groups fields by repeating instruments
		$numeric_fields = array();

		// For each field
		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];
			
			// Is the field text and has an accepted text validation for numerical fields?
			$field_text_and_valid =  preg_match("/text/", $field['field_type']) && preg_match("/".implode("|", $accepted_text_validation)."/", strtolower($field['text_validation_type_or_show_slider_number']));
			
			// Is the field type calc?
			$field_type_is_calc = preg_match("/calc/", $field['field_type']);

			// Does the field name contain one of the ignored keywords?
			$field_names_ignored = boolval(preg_match("/".implode("|", $ignored_names_numeric)."/", strtolower($field['field_name'])));
			// If the field is numeric add it to the corresponding instrument
			if (($field_text_and_valid | $field_type_is_calc) & !$field_names_ignored) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($this->repeats_dictionary))) {
					$numeric_fields[$field['form_name']]['fields'][] = $field_name;
					continue;
				} 

				// If it does not belong to a repeat instrument map it to the non-repeating instrument category
				$numeric_fields['adv_graph_non_repeating']['fields'][] = $field_name;
			}
				
		}
	
		// If by instrument is empty return an empty array
		if (!$numeric_fields)
			return array();
			
		// Return the fields grouped by instrument
		return self::add_instrument_labels($numeric_fields);
	}

	function date_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;
		
		// Create an array that groups fields by repeating instruments
		$date_fields = array();

		// For each field
		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];
			$validation_contains_date = preg_match("/^date/", strtolower($field['text_validation_type_or_show_slider_number']));

			// If the field is numeric add it to the corresponding instrument
			if ($validation_contains_date) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($this->repeats_dictionary))) {
					$date_fields[$field['form_name']]['fields'][] = $field_name;
					continue;
				} 

				// If it does not belong to a repeat instrument map it to the non-repeating instrument category
				$date_fields['adv_graph_non_repeating']['fields'][] = $field_name;
			}
				
		}
	
		// If by instrument is empty return an empty array
		if (!$date_fields)
			return array();

		// Return the fields grouped by instrument
		return self::add_instrument_labels($date_fields);
	}

	function scatter_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;
		$numeric_grouped = self::numeric_groups();
		
		$date_grouped = self::date_groups();

		$scatter_groups = array();

		foreach($numeric_grouped as $instrument => $scatter_field) {
			foreach ($scatter_field['fields'] as $field) {
				$scatter_groups[$instrument]['fields']['Numeric'][] = $field;
			}
		}

		foreach($date_grouped as $instrument => $scatter_field) {
			foreach ($scatter_field['fields']  as $field) {
				$scatter_groups[$instrument]['fields']['Date'][] = $field;
			}
		}
		
		foreach ($scatter_groups as $instrument => $fields) {
			$field_count = 0;
			if (isset($fields['fields']['Date']))
				$field_count += count($fields['fields']['Date']); 

			if (isset($fields['fields']['Numeric']))
				$field_count += count($fields['fields']['Numeric']);

			if ($field_count < 2)
				unset($scatter_groups[$instrument]);
		}
		return self::add_instrument_labels($scatter_groups);
	}

	function categorical_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;
		
		$categorical_types = array('radio', 'dropdown', 'yesno', 'truefalse');

		// Create an array that groups fields by repeating instruments
		$categorical_fields = array();

		// For each field
		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];

			$type_is_categorical = in_array($field['field_type'], $categorical_types);

			// If the field is categorical add it to the corresponding instrument
			if ($type_is_categorical) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($this->repeats_dictionary))) {
					$categorical_fields[$field['form_name']]['fields'][] = $field_name;
					continue;
				} 

				// If it does not belong to a repeat instrument map it to the non-repeating instrument category
				$categorical_fields['adv_graph_non_repeating']['fields'][] = $field_name;
			}
		}

		// If by instrument is empty return an empty array
		if (!$categorical_fields)
			return array();

		// Return the fields grouped by instrument
		return self::add_instrument_labels($categorical_fields);
	}

	function checkbox_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;

		// Create an array that groups fields by repeating instruments
		$checkbox_fields = array();

		// For each field
		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];

			$type_is_checkbox = $field['field_type'] == 'checkbox';

			// If the field is checkbox add it to the corresponding instrument
			if ($type_is_checkbox) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($this->repeats_dictionary))) {
					$checkbox_fields[$field['form_name']]['fields'][] = $field_name;
					continue;
				} 

				// If it does not belong to a repeat instrument map it to the non-repeating instrument category
				$checkbox_fields['adv_graph_non_repeating']['fields'][] = $field_name;
			}
		}

		// If by instrument is empty return an empty array
		if (!$checkbox_fields)
			return array();

		// Return the fields grouped by instrument
		return self::add_instrument_labels($checkbox_fields);
	}
	
	function barplot_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;

			$barplot_grouped = array();

			$numeric_grouped = self::numeric_groups();

			foreach($numeric_grouped as $instrument => $barplot_field) {
				foreach ($barplot_field['fields'] as $field) {
					$barplot_grouped[$instrument]['fields']['Numeric'][] = $field;
				}
			}

			$categorical_grouped = self::categorical_groups();

			foreach($categorical_grouped as $instrument => $barplot_field) {
				foreach ($barplot_field['fields'] as $field) {
					$barplot_grouped[$instrument]['fields']['Categorical'][] = $field;
				}
			}

			$checkbox_grouped = self::checkbox_groups();

			foreach($checkbox_grouped as $instrument => $barplot_field) {
				foreach ($barplot_field['fields'] as $field) {
					$barplot_grouped[$instrument]['fields']['Checkbox'][] = $field;
				}
			}

			foreach ($barplot_grouped as $instrument => $fields) {
				$field_count = 0;
				if (isset($fields['fields']['Categorical']))
					$field_count += count($fields['fields']['Categorical']); 
	
				if (isset($fields['fields']['Checkbox']))
					$field_count += count($fields['fields']['Checkbox']);
	
				if ($field_count < 1)
					unset($barplot_grouped[$instrument]);
			}

			return self::add_instrument_labels($barplot_grouped);
	}
	
	
	function cooridinate_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;

		// Longitude and latitude keywords
		$longitude_keywords = array("longitude", "longitud", "Longitude", "Longitud");
		$latitude_keywords = array("latitude", "latitud", "Latitude", "Latitud");

		$coordinate_fields = array();

		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];

			$is_longitude = preg_match("/".implode("|", $longitude_keywords)."/", $field_name);
			$is_latitude = preg_match("/".implode("|", $latitude_keywords)."/", $field_name);

			$form_name = in_array($field['form_name'], array_keys($this->repeats_dictionary)) ? $field['form_name'] : 'adv_graph_non_repeating';

			if ($is_longitude) {
				$stripped_name = preg_replace("/".implode("|", $longitude_keywords)."/", "", $field_name);

				$matching_names = preg_grep("/".$stripped_name."/", $this->report_fields);

				$matching_latitude = preg_grep("/".implode("|", $latitude_keywords)."/", $matching_names);

				if (!$matching_latitude)
					continue;

				$coordinate_fields[$form_name]['coordinates'][] = array("longitude" => $field_name, "latitude" => array_pop($matching_latitude));
			}

		}

		// If there is at least one longitude and latitude field
		if ($coordinate_fields)
			// Return the grouped fields
			return self::add_instrument_labels($coordinate_fields);

		// Otherwise return false
		return array();

	}

	function map_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;

		$coordinate_grouped = self::cooridinate_groups();

		if (!$coordinate_grouped)
			return array();

		$categorical_grouped = self::categorical_groups();

		$numeric_grouped = self::numeric_groups();

		

		$map_grouped = array();

		foreach($numeric_grouped as $instrument => $map_field) {
			foreach ($map_field['fields'] as $field) {
				$map_grouped[$instrument]['fields']['Numeric'][] = $field;
			}
		}


		foreach($categorical_grouped as $instrument => $map_field) {
			foreach ($map_field['fields'] as $field) {
				$map_grouped[$instrument]['fields']['Categorical'][] = $field;
			}
		}

		foreach($coordinate_grouped as $instrument => $map_field) {
			foreach ($map_field['coordinates'] as $field) {
				$map_grouped[$instrument]['fields']['Coordinates'][] = $field;
			}
		}

		return self::add_instrument_labels($map_grouped);
	}
	
	function network_groups() {
		if (!isset($this->data_dictionary) || !isset($this->report_fields) || !isset($this->repeats_dictionary))
			return false;
		$network_fields = array();

		foreach($this->report_fields as $field_name) {
			$field = $this->data_dictionary[$field_name];

			$text_type = $field['field_type'] == 'text';

			$form_name = in_array($field['form_name'], array_keys($this->repeats_dictionary)) ? $field['form_name'] : 'adv_graph_non_repeating';

			if ($text_type) {
				$network_fields[$form_name]['fields'][] = $field_name;
			}

		}

		foreach ($network_fields as $instrument_name => $instrument) {
			if (count($instrument['fields']) < 2)
				unset($network_fields[$instrument_name]);
		}

		// If there is at least one longitude and latitude field
		if ($network_fields)
			// Return the grouped fields
			return self::add_instrument_labels($network_fields);

		// Otherwise return false
		return array();

	}


	function build_graphs($pid, $user_id, $report_id, $live_filters, $graphs) {
		$input_data = array("inputs" => array(), "graphs" => array());
		$input_data["inputs"]["report_data"] = tempnam(sys_get_temp_dir(), "report_data");
		$input_data["inputs"]["data_dictionary"] = tempnam(sys_get_temp_dir(), "data_dictionary");
		$input_data["inputs"]["repeat_instruments"] = tempnam(sys_get_temp_dir(), "repeat_instruments");

		$report_data_file = fopen($input_data["inputs"]["report_data"], "w");
		$data_dictionary_file = fopen($input_data["inputs"]["data_dictionary"], "w");
		$repeat_instruments_file = fopen($input_data["inputs"]["repeat_instruments"], "w");

		if (!($report_data_file && $data_dictionary_file && $repeat_instruments_file)) {
			fclose($report_data_file);
			fclose($data_dictionary_file);
			fclose($repeat_instruments_file);
			return "<h1 style='color: red;'>Something went wrong generating your graph</h1>";
		}
		$error_msg = '';

		$report_data = self::get_report($pid, $report_id, $live_filters, $user_id,$format="csvraw");
		// $report = self::get_report($pid, $report_id, $live_filters, $user_id,$format="array");

		if (!$report_data)
			$error_msg .= '<h1 style=\"color:red;\">Failed to export report data</h1>';
		
		$data_dictionary = MetaData::getDataDictionary("csv", false, array(), array(), false, false, null, $pid);
		
		if (!$data_dictionary)
			$error_msg .= '<h1 style=\"color:red;\">Failed to export data dictionary</h1>';
		
		
		$repeat_instruments = self::get_repeat_instruments($pid, "csv");
	
		if (!$repeat_instruments)
			$repeat_instruments = "form_name,custom_form_label\n";

		$status = true;

		$status = $status && fwrite($report_data_file, $report_data);
		$status = $status && fwrite($data_dictionary_file, $data_dictionary);
		$status = $status && fwrite($repeat_instruments_file, $repeat_instruments);

		if (!$status || $error_msg) {
			fclose($report_data_file);
			fclose($data_dictionary_file);
			fclose($repeat_instruments_file);
			return $error_msg;
		}

		
		$output_paths = array();


		foreach($graphs as $graph) {
			$output_path = tempnam(sys_get_temp_dir(), "graph");
			
			$graph["output_file"] = $output_path;
			$output_paths[] = $output_path;
			$input_data["graphs"][] = $graph;
		}

		$input_path = tempnam(sys_get_temp_dir(), "graph");

		$input_file = fopen($input_path, "w");

		if (!$input_file) {
			fclose($report_data_file);
			fclose($data_dictionary_file);
			fclose($repeat_instruments_file);
			return "<h1>Unable to create input file</h1>";
		}

		if (!fwrite($input_file, json_encode($input_data))) {
			fclose($report_data_file);
			fclose($data_dictionary_file);
			fclose($repeat_instruments_file);
			fclose($input_file);
			return "<h1>Unable to create input file</h1>";
		}

		// Replace backslashes with forward slashes in module path.
		$module_physical_path = str_replace("\\","/",self::getModulePath());
		$input_path = str_replace("\\","/", $input_path);

		$markdown_file_path = $module_physical_path . "build_graphs.R";

		$r_path = self::getSystemSetting("r-path");
		if(is_array($r_path)){
			$r_path = $r_path[0];
		}
		
		$libPaths = $this->getSystemSetting("r-libraries-path");
		if(is_array($libPaths)){
			$libPaths = $libPaths[0];
		}
		$libPaths_r = ".libPaths(c('$libPaths'));";				

		$data_manipulation_path = $module_physical_path.'data_manipulation.R';
		$custom_plots_path = $module_physical_path.'custom_plots.R';

		$r_code = "\"$r_path\" -e
		\"$libPaths_r 
		input_data_path <- '$input_path';
		source('$data_manipulation_path');
		source('$custom_plots_path');
		source('$markdown_file_path')\"
		2>&1";

		$r_code = trim(preg_replace('/\s+/', ' ', $r_code));
		# echo $r_code;
		$status = exec($r_code, $exec_output);

		if (end($exec_output) != "SUCCESS")
			$status = false;

		if ($status)
			$status = true;
		# echo print_r($exec_output);


		$html_output = "";


		foreach($output_paths as $output_path) {
			$html_output .= file_get_contents($output_path);
		}

		return json_encode(
				array(
					"status" => $status,
					"html" => $html_output,
					"r_output" => $exec_output
				)
			);
	}

	// A function that creates a new dashboard and returns the corresponding dashboard object
	public function newDash($pid, $report_id) {
		$dashboard_table_name = $this->dashboard_table_name;
		// Get next dash_order number
		$q = $this->query("select max(dash_order) from $dashboard_table_name where project_id = ?", [$pid]);
		$new_dash_order = $q->fetch_assoc();
		$new_dash_order = $new_dash_order['max(dash_order)'];
		$new_dash_order = ($new_dash_order == '') ? 1 : $new_dash_order+1;

		// Create new dashboard
		$errno = 0;
		$this->query("START TRANSACTION", []);
		// Insert
		$sql = "insert into $dashboard_table_name 
				(project_id, report_id, title, body, dash_order, is_public)
				values (?, ?, ?, ?, ?, ?)";
		$params = [$pid, $report_id, $this->tt("new_dashboard"), "[]", $new_dash_order, 0];

		$query = $this->query($sql, $params);
		if (!$query) $errno += 1;

		// Get the new dashboard id
		$result = $this->query("SELECT LAST_INSERT_ID() as last_id", []);
		
		if (!$result) $errno += 1;
		
		$row = $result->fetch_assoc();
		$last_id = $row['last_id'];

		// Commit
		$this->query("COMMIT", []);

		if ($errno > 0) {
			$this->query("ROLLBACK", []);
			return [];
		}

		// Return the new dashboard
		return $this->getDashboards($pid, $last_id)[0];
	}

	// A function that takes a dashboard and saves it to the database
	public function saveDash($dashboard) {
		$dashboard_table_name = $this->dashboard_table_name;
		// extract($GLOBALS);
		// echo json_encode($dashboard);
		// return;
		// Count errors
		$errors = 0;

		// Get dashboard id
		$dash_id = $dashboard['dash_id'];

		// Get dashboard
		$dash = $this->getDashboards($dashboard['project_id'], $dash_id);
		if (empty($dash)) exit('0');

		// Report title
		$title = decode_filter_tags($dashboard['title']);
		$body = json_encode($dashboard['body']);

		$is_public =  $dashboard['is_public'];

		// Update dashboard
		$sql = "update $dashboard_table_name set 
				title = ?, 
				body = ?, 
				is_public = ?
				where dash_id = ?";
		$params = [$title, $body, $is_public, $dash_id];

		$query = $this->query($sql, $params);
		if (!$query) $errors += 1;

		// Return the new dashboard
		return $this->getDashboards($dashboard['project_id'], $dash_id);
	}

	// Return all dashboards (unless one is specified explicitly) as an array of their attributes
	public function getDashboards($project_id, $dash_id=null)
	{

		$dashboard_table_name = $this->dashboard_table_name;
		// Get all dashboards
		$sql = "select * from $dashboard_table_name where project_id = ?";
		$params = [$project_id];
		if ($dash_id != null) {
			$sql .= " and dash_id = ?";
			$params[] = $dash_id;
		}
		$sql .= " order by dash_order";
		$q = $this->query($sql, $params);
		$dashboards = [];
		while ($row = $q->fetch_assoc()) {
			$dashboards[] = $row;
		}
		return $dashboards;
	}

	// Obtain a dashboard's title/name
	public function getDashboardName($pid, $dash_id)
	{
		$dashboard_table_name = $this->dashboard_table_name;
		// Delete report
		$sql = "select title from $dashboard_table_name where project_id = ".$pid." and dash_id = $dash_id";
		$q = $this->query($sql, []);
		$title = strip_tags(label_decode(db_result($q, 0)));
		return $title;
	}

	// getDashReportId
	public function getDashReportId($pid, $dash_id)
	{
		$dashboard_table_name = $this->dashboard_table_name;
		// Delete report
		$sql = "select report_id from $dashboard_table_name where project_id = ".$pid." and dash_id = $dash_id";
		$q = $this->query($sql, []);
		$report_id = $q->fetch_assoc()['report_id'];
		return $report_id;
	}

	public function resetCache($pid, $dash_id, $doLogging=true)
	{
		$dash_id = (int)$dash_id;
		$sql = "update $dashboard_table_name set cache_time = null, cache_content = null
                where dash_id = $dash_id and project_id = ".$pid;
		if ($this->query($sql, [])) {
			// Logging
			if ($doLogging) {
			    Logging::logEvent($sql, "$dashboard_table_name", "MANAGE", $dash_id, "dash_id = $dash_id", "Reset cached snapshot for advanced graph dashboard" . " - \"".$this->getDashboardName($dash_id)."\"");
			}
			// Return success
			return true;
		}
		return false;
	}

	// Render the setup page
	public function renderSetupPage()
	{
		// die(json_encode($this->query("select * from advanced_graphs_dashboards")->fetch_all()));
		print "<div id='dashboard_list_parent_div' class='mt-3'>".$this->renderDashboardList()."</div>";
	}

	// // Checks for errors in the dashboard order of all dashboards (in case their numbering gets off)
	// public function checkDashOrder()
	// {
	// 	// Do a quick compare of the field_order by using Arithmetic Series (not 100% reliable, but highly reliable and quick)
	// 	// and make sure it begins with 1 and ends with field order equal to the total field count.
	// 	$sql = "select sum(dash_order) as actual, round(count(1)*(count(1)+1)/2) as ideal,
	// 			min(dash_order) as min, max(dash_order) as max, count(1) as dash_count
	// 			from redcap_project_dashboards where project_id = " . PROJECT_ID;
	// 	$q = $this->query($sql, []);
	// 	$row = $q->fetch_assoc();
	// 	db_free_result($q);
	// 	if ( ($row['actual'] != $row['ideal']) || ($row['min'] != '1') || ($row['max'] != $row['dash_count']) )
	// 	{
	// 		return $this->fixDashOrder();
	// 	}
	// }

	// // Fixes the dashboard order of all dashboards (if somehow their numbering gets off)
	// public function fixDashOrder()
	// {
	// 	// Set all dash_orders to null
	// 	$sql = "select @n := 0";
	// 	$this->query($sql, []);
	// 	// Reset field_order of all fields, beginning with "1"
	// 	$sql = "update redcap_project_dashboards
	// 			set dash_order = @n := @n + 1 where project_id = ".PROJECT_ID."
	// 			order by dash_order, dash_id";
	// 	if (!db_query($sql))
	// 	{
	// 	    // If unique key prevented easy fix, then do manually via looping
	// 		$sql = "select dash_id from redcap_project_dashboards
    //                 where project_id = ".PROJECT_ID."
    //                 order by dash_order, dash_id";
	// 		$q = $this->query($sql, []);
	// 		$dash_order = 1;
	// 		$dash_orders = array();
	// 		while ($row = $q->fetch_assoc()) {
	// 			$dash_orders[$row['dash_id']] = $dash_order++;
	// 		}
	// 		// Reset all orders to null
	// 		$sql = "update redcap_project_dashboards set dash_order = null where project_id = ".PROJECT_ID;
	// 		$this->query($sql, []);
	// 		foreach ($dash_orders as $dash_id=>$dash_order) {
	// 		    // Set order of each individually
	// 			$sql = "update redcap_project_dashboards
    //                     set dash_order = $dash_order 
    //                     where dash_id = $dash_id";
	// 			$this->query($sql, []);
	// 		}
	// 	}
	// 	// Return boolean on success
	// 	return true;
	// }

	// Get html table listing all reports
	public function renderDashboardList()
	{
		global $lang;
		// Ensure dashboards are in correct order
		// $this->checkDashOrder();
		// Ensure dashboards have a hash
		$this->checkDashHash();
		// Get list of reports to display as table (only apply user access filter if don't have Add/Edit Reports rights)
		$dashboards = $this->getDashboards(PROJECT_ID);
		// Build table
		$rows = array();
		$item_num = 0; // loop counter
		foreach ($dashboards as $dash_id=>$attr)
		{
			// First column
			$rows[$item_num][] = RCView::span(array('style'=>'display:none;'), $dash_id);
			// Report order number
			$rows[$item_num][] = ($item_num+1);
			// Report title
			$rows[$item_num][] = RCView::div(array('class'=>'wrap fs14'),
				// View Report button
				RCView::div(array('class'=>'float-right text-right mr-1', 'style'=>'width:60px;'),
					RCView::button(array('class'=>'btn btn-primaryrc btn-xs fs12 nowrap', 'onclick'=>"openDashboard($dash_id);"),
						'<i class="fas fa-search"></i> ' .$lang['dash_03']
					)
				) .
				// Public link
                (!($attr['is_public'] && $GLOBALS['project_dashboard_allow_public'] > 0) ? "" :
					RCView::div(array('class'=>'float-right text-right', 'style'=>'width:60px;'),
						RCView::a(array('href'=>($attr['short_url'] == "" ? $this->getUrl('view_dash_public.php', true)."&dash_id=$dash_id" : $attr['short_url']), 'target'=>'_blank', 'class'=>'text-primary fs12 nowrap mr-2 ml-1'), //APP_PATH_WEBROOT_FULL.'surveys/index.php?__dashboard='.$attr['hash']
							'<i class="fas fa-link"></i> ' .$lang['dash_35']
						)
					)
				) .
                // Dashboard name
				RCView::div(array('style'=>'margin-right:'.($attr['is_public'] ? "120px" : "60px").';cursor:pointer;', 'class' => 'dash-title', 'onclick'=>"openDashboard($dash_id);"), RCView::escape($attr['title'], false))
            );
			// View/export options
			$rows[$item_num][] =
				RCView::span(array('class'=>'rprt_btns'),
					//Edit
					RCView::button(array('class'=>'btn btn-defaultrc btn-xs fs11', 'style'=>'color:#000080;margin-right:2px;padding: 1px 6px;', 'onclick'=>"editDashboard($dash_id);"),
						'<i class="fas fa-pencil-alt"></i> ' .$lang['global_27']
					) .
					// Copy
					RCView::button(array('id'=>'repcopyid_'.$dash_id, 'class'=>'btn btn-defaultrc btn-xs fs11', 'style'=>'margin-right:2px;padding: 1px 6px;', 'onclick'=>"copyDashboard($dash_id,true);"),
						'<i class="far fa-copy"></i> ' .$lang['report_builder_46']
					) .
					// Delete
					RCView::button(array('id'=>'repdelid_'.$dash_id, 'class'=>'btn btn-defaultrc btn-xs fs11', 'style'=>'color:#A00000;padding: 1px 6px;', 'onclick'=>"deleteDashboard($dash_id,true);"),
						'<i class="fas fa-times"></i> ' .$lang['global_19']
					)
				);
			// Increment row counter
			$item_num++;
		}
		// Add last row as "add new report" button
		$rows[$item_num] = array('', '',
			/* RCView::button(array('class'=>'btn btn-xs btn-defaultrc fs12', 'style'=>'color:#000080;margin:12px 0;', 'onclick'=>"window.location.href = app_path_webroot+'index.php?route=ProjectDashController:index&addedit=1&pid='+pid;"),
				'<i class="fas fa-plus fs11"></i> ' . $lang['dash_01']
			), ''); */
				RCView::p(array(), "Create a new dashboard by creating a report and clicking 'Advanced Graphs Dashboards' under external modules"), '');
		// Set table headers and attributes
		$col_widths_headers = array();
		$col_widths_headers[] = array(18, "", "center");
		$col_widths_headers[] = array(18, "", "center");
		$col_widths_headers[] = array(700, $lang['dash_02']);
		$col_widths_headers[] = array(200, $lang['dash_04'], "center");
		// Render the table
		return renderGrid("project_dashboard_list", "", 990, 'auto', $col_widths_headers, $rows, true, false, false);
	}

	// Ensure all project dashboards have a hash
	public function checkDashHash($dash_id=null)
	{
		$sql = "select dash_id from $dashboard_table_name
				where project_id = ".PROJECT_ID." and hash is null";
		if (isinteger($dash_id) && $dash_id > 0) {
			$sql .= " and dash_id = $dash_id";
		}
		$q = $this->query($sql, []);
		$dash_ids = [];
		while ($row = $q->fetch_assoc()) {
			$dash_ids[] = $row['dash_id'];
		}
		// Loop through each dashboard
		foreach ($dash_ids as $dash_id) {
			// Attempt to save it to dashboards table
			$success = false;
			while (!$success) {
				// Generate new unique name (start with 3 digit number followed by 7 alphanumeric chars) - do not allow zeros
				$unique_name = generateRandomHash(11, false, true);
				// Update the table
				$sql = "update $dashboard_table_name set hash = '".db_escape($unique_name)."' where dash_id = $dash_id";
				$success = $this->query($sql, []);
			}
		}
	}

	// Delete a report
	public function deleteDash($pid, $dash_id)
	{
		$dashboard_table_name = $this->dashboard_table_name;
		// $title = $this->getDashboardName($pid, $dash_id);
		// Delete report
		$sql = "delete from $dashboard_table_name where project_id = ? and dash_id = ?";
		$params = array($pid, $dash_id);
		$q = $this->query($sql, $params);
		if (!$q) return false;
		// Fix ordering of reports (if needed) now that this report has been removed
		$this->checkDashOrder($pid);

		// Return success
		return true;
	}

	// Copy the report and return the new dash_id
	public function copyDash($pid, $dash_id)
	{
		$dashboard_table_name = $this->dashboard_table_name;
		// Set up all actions as a transaction to ensure everything is done here
		$this->query("SET AUTOCOMMIT=0");
		$this->query("BEGIN");
		$errors = 0;
		// List of all db tables relating to reports, excluding redcap_project_dashboards
		// $tables = array('redcap_project_dashboards_access_dags', 'redcap_project_dashboards_access_roles', 'redcap_project_dashboards_access_users');
		// First, add row to redcap_project_dashboards and get new report id
		$table = $this->getTableColumns($dashboard_table_name);
		// Get report attributes
		$dash = $this->getDashboards($pid, $dash_id);
		// Remove dash_id from arrays to prevent query issues
		unset($dash['dash_id'], $table['dash_id'], $dash['hash'], $table['hash'], $dash['short_url'], $table['short_url']);
		// Append "(copy)" to title to differeniate it from original
		$dash['title'] .= " (copy)";
		// Increment the report order so we can add new report directly after original
		$dash['dash_order']++;
		// Move all report orders up one to make room for new one
		$sql = "update $dashboard_table_name set dash_order = dash_order + 1 where project_id = ".$pid."
				and dash_order >= ".$dash['dash_order']." order by dash_order desc";
		if (!$this->query($sql, [])) $errors++;

		// Loop through report attributes and add to $table to input into query
		foreach ($dash as $key=>$val) {
			if (!array_key_exists($key, $table)) continue;
			$table[$key] = $val;
		}
		// set the dashboard as not public
		$table['is_public'] = '0';
		$table['user_access'] = "''";
		// Insert into dashboards table
		$sqlr = "insert into $dashboard_table_name (".implode(', ', array_keys($table)).") values (".prep_implode($table, true, true).")";
		$q = $this->query($sqlr);
		if (!$q) return db_error();
		$new_dash_id = db_insert_id();
		// Now loop through all other report tables and add

		// Convert columns to comma-delimited string to input into query
		// $table_cols = implode(', ', array_keys($table));
		// // Insert into table
		// $sql = "insert into advanced_graphs_dashboards select $new_dash_id, $table_cols from advanced_graphs_dashboards where dash_id = $dash_id";
		// if (!db_query($sql)) $errors++;
		// If errors, do not commit
		$commit = ($errors > 0) ? "ROLLBACK" : "COMMIT";
		$this->query($commit);

		// Set back to initial value
		$this->query("SET AUTOCOMMIT=1");
		
		if ($errors == 0) {
			// Just in case, make sure that all report orders are correct
			$this->checkDashOrder();
			// return "erros tes";
			// Logging
			// Logging::logEvent($sqlr, "advanced_graphs_dashboards", "MANAGE", $new_dash_id, "dash_id = $new_dash_id\nCopied from dash_id = $dash_id", "Copy project dashboard" . " - \"".$this->getDashboardName($dash_id)."\"");
		}
		// Return dash_id of new report, else FALSE if errors occurred
		return ($errors == 0) ? array('new_dash_id'=>$new_dash_id, 'html'=>$this->renderDashboardList()) : false;
	}

	// Checks for errors in the dashboard order of all dashboards (in case their numbering gets off)
	public function checkDashOrder($pid)
	{
		$dashboard_table_name = $this->dashboard_table_name;	
		// Do a quick compare of the field_order by using Arithmetic Series (not 100% reliable, but highly reliable and quick)
		// and make sure it begins with 1 and ends with field order equal to the total field count.
		$sql = "select sum(dash_order) as actual, round(count(1)*(count(1)+1)/2) as ideal,
				min(dash_order) as min, max(dash_order) as max, count(1) as dash_count
				from $dashboard_table_name where project_id = " . $pid;
		$q = $this->query($sql, []);
		$row = $q->fetch_assoc();
		db_free_result($q);
		if ( ($row['actual'] != $row['ideal']) || ($row['min'] != '1') || ($row['max'] != $row['dash_count']) )
		{
			return $this->fixDashOrder($pid);
		}
	}

	// Fixes the dashboard order of all dashboards (if somehow their numbering gets off)
	public function fixDashOrder($pid)
	{
		$dashboard_table_name = $this->dashboard_table_name;
		// Set all dash_orders to null
		$sql = "select @n := 0";
		$this->query($sql, []);
		// Reset field_order of all fields, beginning with "1"
		$sql = "update $dashboard_table_name
				set dash_order = @n := @n + 1 where project_id = ".$pid."
				order by dash_order, dash_id";
		if (!$this->query($sql, []))
		{
			// If unique key prevented easy fix, then do manually via looping
			$sql = "select dash_id from $dashboard_table_name
					where project_id = ".$pid."
					order by dash_order, dash_id";
			$q = $this->query($sql, []);
			$dash_order = 1;
			$dash_orders = array();
			while ($row = $q->fetch_assoc()) {
				$dash_orders[$row['dash_id']] = $dash_order++;
			}
			// Reset all orders to null
			$sql = "update $dashboard_table_name set dash_order = null where project_id = ".PROJECT_ID;
			$this->query($sql, []);
			foreach ($dash_orders as $dash_id=>$dash_order) {
				// Set order of each individually
				$sql = "update $dashboard_table_name
						set dash_order = $dash_order 
						where dash_id = $dash_id";
				$this->query($sql, []);
			}
		}
		// Return boolean on success
		return true;
	}

	// Obtain array of column names and their default value from specified database table.
	// Column name will be array key and default value will be corresponding array value.
	function getTableColumns($table)
	{
		$sql = "describe `$table`";
		$q = $this->query($sql, []);
		if (!$q) return false;
		$cols = array();
		while ($row = $q->fetch_assoc()) {
			$cols[$row['Field']] = $row['Default'];
		}
		return $cols;
	}
}
