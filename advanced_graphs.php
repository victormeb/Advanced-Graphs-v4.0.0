<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';	
echo "<div id=\"advanced_graphs\"><h1>Finding the report fields</h1></div>";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$original_params = json_encode($query);
/* $.when(
	$.ajax("<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>")
).then(
	function( data ) {
		console.log(data);
	}
); */
?>

<script>
ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>";
refferer_parameters = <?php echo $original_params?>;

function select_all_fields(source) {	
	$("[name=\"field_name\"]").each(function() {
		$( this ).prop('checked', source.checked);
	});
}

function send_fields(form) {
	console.log($(form).serializeArray());
	form_data = $(form).serializeArray();
	
	post_data = {
		params: refferer_parameters,
		form_data: form_data,
		method: "select_fields"
	};
	console.log(form_data);
	$.ajax(ajax_url, {data: post_data, dataType: "json", method: "POST"}).done(function( data ) {
		console.log(data);
		$('#advanced_graphs').html(
			data
		);
	});
}

function field_form(data) {
	if (!data['status'])
		return data['output'];
	
	form_html = "<form>"; // <input type=\"hidden\" name=method value=select_fields>
		
	//form_html += "<input type=\"hidden\" name=params value=\"" + refferer_parameters + "\">";
	
	$.each(data['output'],
		function(index, value) {
			form_html += "<label for="+index+">"+value["field_label"]+ "<br>(" + index + ")</label><input type='checkbox' id=" + index + " value=" + index + " name=\"field_name[]\" checked><br>";
		}
	);
	
	form_html += "<hr><label for=\"select_all\">Select All</label><input type=\"checkbox\" id=\"select_all\" onClick=\"select_all_fields(this)\" checked><br>";
	
	form_html += "<input type=\"button\" value = \"Generate Graphs\" onClick=\"send_fields(this.form)\"></form>";
	return form_html;
}

$.ajax(ajax_url, {data: {params: refferer_parameters, method: "get_fields"}, dataType: "json", method: "POST"}).done(function( data ) {
		console.log(data);
		
		$('#advanced_graphs').html(
			field_form(data)
		);
	});

console.log("waiting");
</script>