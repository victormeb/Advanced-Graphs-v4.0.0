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

class AdvancedGraphs extends \ExternalModules\AbstractExternalModule
{
	private $enabled_projects;
	
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

		function loadJS($js_file, $outputToPage=true)
	{
		// Create script tag
		$output = "<script type=\"text/javascript\" src=\"" . $this->getURL('js/'.$js_file,  $this->module_js_path). "\"></script>\n";
		if ($outputToPage) {
			print $output;
		} else {
			return $output;
		}
	}

	// Output the link/style tag for a given CSS file
	function loadCSS($css_file, $outputToPage=true)
	{
		// Create link tag
		$output = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen,print\" href=\"" . $this->getURL('css/'.$css_file,  $this->module_js_path) . "\">\n";
		if ($outputToPage) {
			print $output;
		} else {
			return $output;
		}
	}
	

	function get_repeat_instruments($Proj) {
		global $lang;
		// Get project object of attributes
	
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

		return $results;
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

	function add_instrument_labels($grouped_fields, $instruments) {
		// Create a dictionary that maps instrument names to instrument labels
		$instruments_dictionary = array();

		foreach ($instruments as $instrument) {
			$instruments_dictionary[$instrument['instrument_name']] = $instrument['instrument_label'];
		}

		$instruments_dictionary['adv_graph_non_repeating'] = "Non-repeating instruments";

		// Add the appropriate instrument label to each instrument
		foreach($grouped_fields as $instrument => $group) {
			$grouped_fields[$instrument]['instrument_label'] = $instruments_dictionary[$instrument];
		}
		
		// Let the non-repeating instruments have the label "Non-repeating instruments"
		// $grouped_fields['adv_graph_non_repeating']['instrument_label'] = "Non-repeating instruments";
		
		// Remove the instruments whose choices aren't set
		// foreach ($grouped_fields as $instrument => $group) {
		// 	if (!isset($group[$must_be_set]))
		// 		unset($grouped_fields[$instrument]);
		// }

		return $grouped_fields;
	}
	
	// TODO: Documentation
	// https://github.com/jsonform/jsonform/wiki#outline
	function likert_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments) {
		// TODO: Set keywords in module settings.
		// field_types that are candidates for likert
		$like_likert = array("dropdown", "radio");
		
		// If any of the following keywords are contained in the options
		// it will be considered a likert category
		$key_likert_words = array("victoria", "fas", "male", "not useful", "not at all useful", "difficult", "none of my needs", "strongly disagree", "somewhat disagree", "completely disagree", "quite dissatisfied", "very dissatisfied", "Extremely dissatisfied", "poor", "never", "worse", "severely ill", "inutil", "infatil", "completamente inutil", "completamente infatil", "dificil", "ninguna de mis necesidades", "totalmente en desacuerdo", "parcialemnte en desacuerdo", "completamente en desacuerdo", "muy insatisfecho(a)", "totalmente insatisfecho(a)", "nunca", "peor", "gravemente enfermo");
		
		// Create an array that groups fields by repeating instruments
		$likert_fields = array();

		// Create a dicitionary that maps repeat instrument names to repeat instrument labels
		$repeats_dictionary = array();

		foreach ($repeat_instruments as $instrument) {
			$repeats_dictionary[$instrument['form_name']] = $instrument['custom_form_label'];
		}

		// For each report_field...
		foreach ($report_fields as $field_name) {
			// Get all field attributes from data dictionary
			$field = $data_dictionary[$field_name];
			
			// Check that field type can be interpreted as likert
			$type_matches = in_array($field['field_type'], $like_likert);
			
			// Check that the choices contain a likert keyword
			$selection_matches = preg_match("/".implode("|", $key_likert_words)."/", strtolower($field['select_choices_or_calculations']));

			// If the field can be interpreted as liekrt
			if ($type_matches && $selection_matches) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($repeats_dictionary))) {
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
		return self::add_instrument_labels($likert_fields, $instruments);
	}
	
	function numeric_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments) {
		echo "gof";
		// when searching for numeric fields
		$ignored_names_numeric = array("latitude", "longitude", "latitud", "longitud");

		// text validation strings to consider as a numerical column
		$accepted_text_validation = array("integer", "number", "float", "decimal");

		// Create an array that groups fields by repeating instruments
		$numeric_fields = array();

		// Create a dictionary that maps instrument names to instrument labels
		$instruments_dictionary = array();

		foreach ($instruments as $instrument) {
			$instruments_dictionary[$instrument['instrument_name']] = $instrument['instrument_label'];
		}

		// Create a dicitionary that maps repeat instrument names to repeat instrument labels
		$repeats_dictionary = array();

		foreach ($repeat_instruments as $instrument) {
			$repeats_dictionary[$instrument['form_name']] = $instrument['custom_form_label'];
		}
		echo "one";
		// For each field
		foreach($report_fields as $field_name) {
			$field = $data_dictionary[$field_name];
			$field_type = $field['field_type'] ;
			$field_text_and_valid =  preg_match("/text/", $field['field_type']) && preg_match("/".implode("|", $accepted_text_validation)."/", strtolower($field['text_validation_type_or_show_slider_number']));
			$field_type_is_calc = preg_match("/calc/", $field['field_type']);
			$field_names_ignored = boolval(preg_match("/".implode("|", $ignored_names_numeric)."/", strtolower($field['field_name'])));
			echo "$field_name type is '$field_type' text valid?" .  ($field_text_and_valid ? 'tue': 'false') . "| type is calc?" . ($field_type_is_calc ? 'tue': 'false') . " | ignored field name? " . ($field_names_ignored ? 'tue': 'false')."\n";
			// If the field is numeric add it to the corresponding instrument
			if (($field_text_and_valid | $field_type_is_calc) & !$field_names_ignored) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($repeats_dictionary))) {
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
		return self::add_instrument_labels($numeric_fields, $instruments);
	}

	function date_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments) {
		// Create an array that groups fields by repeating instruments
		$date_fields = array();

		// Create a dictionary that maps instrument names to instrument labels
		$instruments_dictionary = array();

		foreach ($instruments as $instrument) {
			$instruments_dictionary[$instrument['instrument_name']] = $instrument['instrument_label'];
		}

		// Create a dicitionary that maps repeat instrument names to repeat instrument labels
		$repeats_dictionary = array();

		foreach ($repeat_instruments as $instrument) {
			$repeats_dictionary[$instrument['form_name']] = $instrument['custom_form_label'];
		}

		// For each field
		foreach($report_fields as $field_name) {
			$field = $data_dictionary[$field_name];
			$validation_contains_date = preg_match("/^date/", strtolower($field['text_validation_type_or_show_slider_number']));

			// If the field is numeric add it to the corresponding instrument
			if ($validation_contains_date) {
				// Match it to the appopriate instrument.
				if (in_array($field['form_name'], array_keys($repeats_dictionary))) {
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
		return self::add_instrument_labels($date_fields, $instruments);
	}

	function scatter_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments) {
		$numeric_grouped = self::numeric_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments);
		
		$date_grouped = self::date_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments);

		$scatter_groups = array();

		foreach($numeric_grouped as $instrument => $scatter_field) {
			foreach ($scatter_field['fields'] as $field) {
				$scatter_groups[$instrument]['fields']['numeric'][] = $field;
			}
		}

		foreach($date_grouped as $instrument => $scatter_field) {
			foreach ($scatter_field['fields']  as $field) {
				$scatter_groups[$instrument]['fields']['date'][] = $field;
			}
		}
		

		return self::add_instrument_labels($scatter_groups, $instruments);
	}
	
	function barplot_groups($data_dictionary, $instruments) {
		
	}
	
	function crosstab_groups($data_dictionary, $instruments) {
		
	}
	
	function map_groups($data_dictionary, $instruments) {
		
	}
	
	function network_groups($data_dictionary, $instruments) {
		
	}


	function build_graphs($pid, $report_id, $params, $graphs) {
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

		$report_data = get_report($report_id, $params);

		if (!$report_data)
			$error_msg .= '<h1 style=\"color:red;\">Failed to export report data</h1>';
		
		$data_dictionary = MetaData::getDataDictionary("csv", false, array(), array(), false, false, null, $pid);
		
		if (!$data_dictionary)
			$error_msg .= '<h1 style=\"color:red;\">Failed to export data dictionary</h1>';
		
		
		$repeat_instruments = get_repeat_instruments($pid);
	
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
}