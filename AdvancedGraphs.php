<?php
namespace VIHA\AdvancedGraphs;

use \REDCap as REDCap;
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;
use \DateTime;
use \DateTimeZone;
use DataExport;

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
	
	// TODO: Documentation
	// https://github.com/jsonform/jsonform/wiki#outline
	function likert_groups($data_dictionary, $report_fields, $instruments) {
		// TODO: Set keywords in module settings.
		// field_types that are candidates for likert
		$like_likert = array("dropdown", "radio");
		
		// If any of the following keywords are contained in the options
		// it will be considered a likert category
		$key_likert_words = array("male", "not useful", "not at all useful", "difficult", "none of my needs", "strongly disagree", "somewhat disagree", "completely disagree", "quite dissatisfied", "very dissatisfied", "Extremely dissatisfied", "poor", "never", "worse", "severely ill", "inutil", "infatil", "completamente inutil", "completamente infatil", "dificil", "ninguna de mis necesidades", "totalmente en desacuerdo", "parcialemnte en desacuerdo", "completamente en desacuerdo", "muy insatisfecho(a)", "totalmente insatisfecho(a)", "nunca", "peor", "gravemente enfermo");
		
		$by_instrument = array();

		$instruments_dictionary = array();

		foreach ($instruments as $instrument) {
			$instruments_dictionary[$instrument['instrument_name']] = $instrument['instrument_label'];
		}

		$instrument_names = array_map(function($instrument) {return $instrument['instrument_name'];}, $instruments);

		
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
				if (in_array($field['form_name'], $instrument_names)) {
					$by_instrument[$field['form_name']]['choices'][$field['select_choices_or_calculations']][] = $field_name;
				} 
				// else {
				// 	$by_instrument['adv_graph_no_instruments']['choices'][$field['select_choices_or_calculations']][] = $field_name;
				// }
				// $by_instrument['adv_graph_all_instruments']['choices'][$field['select_choices_or_calculations']][] = $field_name;
			}
		}
		
		if (!$by_instrument)
			return array();

		$by_instrument['adv_graph_all_instruments']['choices'] = array();

		foreach($by_instrument as $instrument => $group) {
			$by_instrument[$instrument]['instrument_label'] = $instruments_dictionary[$instrument];
			$by_instrument['adv_graph_all_instruments']['choices'] = array_merge($by_instrument['adv_graph_all_instruments']['choices'], $group['choices']);
		}
		
		//$by_instrument['adv_graph_no_instruments']['instrument_label'] = "No Instrument";
		$by_instrument['adv_graph_all_instruments']['instrument_label'] = "All Instruments";


		foreach ($by_instrument as $group) {
			if (!isset($group['choices']))
				unset($group);
		}
		
		return $by_instrument;
		
/* 		// Get fields whose selections contain likert key words.
		$matches_selection = preg_grep(
 									"/".implode("|", $key_likert_words)."/",
									array_map(
										function($field) {
											return strtolower($field['select_choices_or_calculations']);
										}, 
										$data_dictionary
									)
								); 

		// Get fields with the appropriate field type
		$matches_field_type = preg_grep(
								"/".implode("|",$like_likert)."/",
								array_map(
									function($field) {return $field['field_type'];},
									$data_dictionary
								)
							 );	 

		// Get those fields that are of the appropriate field type and contain a keyword.
		$likert_fields = array_intersect(array_keys($matches_selection), array_keys($matches_field_type));
		
		if (count($likert_fields) == 0) 
			return false;
		
		echo print_r($instrument_names);
		foreach ($likert_fields as $field) {
			$field = $data_dictionary[$field];
			if (in_array($field['form_name'], $instrument_names)) {
				$by_instrument[$field['form_name']]['choices'][$field['select_choices_or_calculations']][] = $field;
			} else {
				$by_instrument['adv_graph_no_instruments']['choices'][$field['select_choices_or_calculations']][] = $field;
			}
			$by_instrument['adv_graph_all_instruments']['choices'][$field['select_choices_or_calculations']][] = $field;
		}
		
		foreach($instruments as $instrument) {
			$by_instrument[$instrument['instrument_name']]['instrument_label'] = $instrument['instrument_label'];
		}
		
		$by_instrument['adv_graph_no_instruments']['instrument_label'] = "No Instrument";
		$by_instrument['adv_graph_all_instruments']['instrument_label'] = "All Instruments";
		
		return $by_instrument; */
	}
	
	function scatter_groups($data_dictionary, $instruments) {
		
	}
	
	function barplot_groups($data_dictionary, $instruments) {
		
	}
	
	function crosstab_groups($data_dictionary, $instruments) {
		
	}
	
	function map_groups($data_dictionary, $instruments) {
		
	}
	
	function network_groups($data_dictionary, $instruments) {
		
	}
}