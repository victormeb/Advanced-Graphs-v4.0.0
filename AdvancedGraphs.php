<?php
namespace VIHA\AdvancedGraphs;

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

class AdvancedGraphs extends \ExternalModules\AbstractExternalModule
{
	private $enabled_projects;
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

	function initialize_report($pid, $user_id, $report_id, $params) {
		$this->data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $pid);
		
		$this->report_fields = $this->get_accessible_fields($pid, $user_id, $report_id);

		$this->report = $this->get_report($pid, $user_id, $report_id, $params, "array");

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
		// Do stuff, e.g. create DB table.
		$result = $this->query("CREATE TABLE if not exists advanced_graphs_dashboards (
			dash_id INT(10) AUTO_INCREMENT NOT NULL,
			project_id INT(10) NOT NULL,
			title TEXT,
			body JSON,
			dash_order INT(3),
			user_access enum('ALL','SELECTED') DEFAULT 'ALL' NOT NULL,
			hash varchar(11) UNI,
			short_url varchar(100),
			is_public tinyint(1) DEFAULT 0 NOT NULL,
			cache_time datetime,
			cache_content longtext,
			PRIMARY KEY (dash_id, project_id)
		)");
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
			die($error);
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
		$current_page_is_this_module = strpos($_SERVER["PHP_SELF"],"/ExternalModules/") > -1 && strpos($_SERVER["QUERY_STRING"],"prefix=" . $this->PREFIX) > -1;

		$current_page_is_export_report = strpos($_SERVER["PHP_SELF"],"/DataExport/") > -1 && strpos($_SERVER["QUERY_STRING"],"&report_id=") > -1;
	
		if($link["prefix"]==$this->PREFIX) {			
			$link["target"] = "_blank";
//			if (!($current_page_is_this_module || ($current_page_is_export_report && $this->isEnabledProject($project_id)))) {
			if (!($current_page_is_this_module || $current_page_is_export_report )) {
				$link=null;
			} 
		}
		return $link;
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

		function loadJS($js_file, $folder = "js", $outputToPage=true)
	{
		// Create script tag
		$output = "<script type=\"text/javascript\" src=\"" . $this->getURL("$folder/".$js_file,  $this->module_js_path). "\"></script>\n";
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
		$output = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen,print\" href=\"" . $this->getURL("$folder/".$css_file,  $this->module_js_path) . "\">\n";
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
				$csv .= "$dkey,$row\n";
			}
		}

		return ($format == "array") ? $results : $csv;
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

	function get_report($pid, $user_id, $report_id, $params, $format="csvraw") {
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
		
		// Build live filter logic from parameters
		list ($liveFilterLogic, $liveFilterGroupId, $liveFilterEventId) = self::buildReportDynamicFilterLogicReferrer($report_id, $params);

		$as_array = ($format == "array") ?  $this->report_fields : array();
	
		// Retrieve report from redcap
		$content = DataExport::doReport($report_id, 'export', $format, false, false,
										false, false, $removeIdentifierFields, $hashRecordID, $removeUnvalidatedTextFields,
										$removeNotesFields, $removeDateFields, false, false, array(), 
										array(), false, false, 
										false, true, true, $liveFilterLogic, $liveFilterGroupId, $liveFilterEventId, true, ",", '', $as_array);
	
										
		return $content;
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


	function build_graphs($pid, $user_id, $report_id, $params, $graphs) {
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

		$report_data = self::get_report($pid, $user_id, $report_id, $params, $format="csvraw");

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

		$data_manipulation_path = $module_physical_path.'data_manipulation.R';
		$custom_plots_path = $module_physical_path.'custom_plots.R';

		$r_code = "\"$r_path\" -e
		\"$libPaths 
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

	// Save a dashboard
	public function save()
	{
		if (!isset($_GET['dash_id']) || !isinteger($_GET['dash_id'])) {
			redirect(APP_PATH_WEBROOT."index.php?route=ProjectDashController:index&pid={$_GET['pid']}");
		}
		$dash = new ProjectDashboards();
		$dash->saveDash();
	}

		// Save dashboard
		public function saveDash()
		{
			extract($GLOBALS);
	
			// Count errors
			$errors = 0;
	
			// Validate dash_id and see if already exists
			$dash_id = (int)$_GET['dash_id'];
			if ($dash_id != 0) {
				$dash = $this->getDashboards($_GET['pid'], $dash_id);
				if (empty($dash)) exit('0');
			}
	
			// Report title
			$title = decode_filter_tags($_POST['title']);
			$body = decode_filter_tags($_POST['body']);
			$is_public = (isset($_POST['is_public']) && $_POST['is_public'] == 'on') ? "1" : "0";
			// User access rights
			$user_access_users = $user_access_roles = $user_access_dags = array();
			if (isset($_POST['user_access_users'])) {
				$user_access_users = $_POST['user_access_users'];
				if (!is_array($user_access_users)) $user_access_users = array($user_access_users);
			}
			if (isset($_POST['user_access_roles'])) {
				$user_access_roles = $_POST['user_access_roles'];
				if (!is_array($user_access_roles)) $user_access_roles = array($user_access_roles);
			}
			if (isset($_POST['user_access_dags'])) {
				$user_access_dags = $_POST['user_access_dags'];
				if (!is_array($user_access_dags)) $user_access_dags = array($user_access_dags);
			}
			$user_access = ($_POST['user_access_radio'] == 'SELECTED'
				&& (count($user_access_users) + count($user_access_roles) + count($user_access_dags)) > 0) ? 'SELECTED' : 'ALL';
	
			// Set up all actions as a transaction to ensure everything is done here
			db_query("SET AUTOCOMMIT=0");
			db_query("BEGIN");
	
			// Save report in reports table
			if ($dash_id != 0) {
				// Update
				$sqlr = $sql = "update redcap_project_dashboards 
								set title = '".db_escape($title)."', body = '".db_escape($body)."', user_access = '".db_escape($user_access)."', is_public = $is_public
								where project_id = ".PROJECT_ID." and dash_id = $dash_id";
				if (!db_query($sql)) $errors++;
			} else {
				// Get next dash_order number
				$q = db_query("select max(dash_order) from redcap_project_dashboards where project_id = ".PROJECT_ID);
				$new_dash_order = db_result($q, 0);
				$new_dash_order = ($new_dash_order == '') ? 1 : $new_dash_order+1;
				// Insert
				$sqlr = $sql = "insert into redcap_project_dashboards (project_id, title, body, user_access, dash_order, is_public)
								values (".PROJECT_ID.", '".db_escape($title)."', ".checkNull($body).", '".db_escape($user_access)."', $new_dash_order, $is_public)";
				if (!db_query($sql)) $errors++;
				// Set new dash_id
				$dash_id = db_insert_id();
			}
	
			// USER ACCESS
			$sql = "delete from redcap_project_dashboards_access_users where dash_id = $dash_id";
			if (!db_query($sql)) $errors++;
			foreach ($user_access_users as $this_user) {
				$sql = "insert into redcap_project_dashboards_access_users values ($dash_id, '".db_escape($this_user)."')";
				if (!db_query($sql)) $errors++;
			}
			$sql = "delete from redcap_project_dashboards_access_roles where dash_id = $dash_id";
			if (!db_query($sql)) $errors++;
			foreach ($user_access_roles as $this_role_id) {
				$this_role_id = (int)$this_role_id;
				$sql = "insert into redcap_project_dashboards_access_roles values ($dash_id, '".db_escape($this_role_id)."')";
				if (!db_query($sql)) $errors++;
			}
			$sql = "delete from redcap_project_dashboards_access_dags where dash_id = $dash_id";
			if (!db_query($sql)) $errors++;
			foreach ($user_access_dags as $this_group_id) {
				$this_group_id = (int)$this_group_id;
				$sql = "insert into redcap_project_dashboards_access_dags values ($dash_id, '".db_escape($this_group_id)."')";
				if (!db_query($sql)) $errors++;
			}
	
			// If there are errors, then roll back all changes
			if ($errors > 0) {
				// Errors occurred, so undo any changes made
				db_query("ROLLBACK");
				// Return '0' for error
				exit('0');
			} else {
				// Logging
				if ($dash_id != 0) {
					$log_descrip = "Edit project dashboard";
				} else {
					$log_descrip = "Create project dashboard";
				}
				Logging::logEvent($sqlr, "redcap_project_dashboards", "MANAGE", $dash_id, "dash_id = $dash_id", $log_descrip . " - \"".$this->getDashboardName($dash_id)."\"");
				// Since we've modified the dashboard, also clear the dashboard cache
				if ($dash_id != 0) {
					$this->resetCache($dash_id, false);
				}
				// Commit changes
				db_query("COMMIT");
				// Response
				$dialog_title = 	RCView::img(array('src'=>'tick.png', 'style'=>'vertical-align:middle')) .
					RCView::span(array('style'=>'color:green;vertical-align:middle'), $lang['dash_19']);
				$dialog_content = 	RCView::div(array('style'=>'font-size:14px;'),
					$lang['dash_18'] . " \"" .
					RCView::span(array('style'=>'font-weight:bold;'), RCView::escape($title)) .
					"\" " . $lang['report_builder_74']
				);
				// Output JSON response
				header("Content-Type: application/json");
				print json_encode_rc(array('dash_id'=>$dash_id, 'newdash'=>($_GET['dash_id'] == 0 ? 1 : 0),
					'title'=>$dialog_title, 'content'=>$dialog_content));
			}
		}
}