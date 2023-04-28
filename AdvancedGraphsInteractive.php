<?php
namespace VIHA\AdvancedGraphsInteractive;

use \REDCap as REDCap;
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

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

		echo json_encode($link);

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
				return json_encode($newDash);
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

	// Render the setup page
	public function renderSetupPage()
	{
		// die(json_encode($this->query("select * from advanced_graphs_dashboards")->fetch_all()));
		print "<div id='dashboard_list_parent_div' class='mt-3'>".$this->renderDashboardList()."</div>";
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
