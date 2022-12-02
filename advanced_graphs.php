<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';	
echo "<div id=\"advanced_graphs\"><h1>Advanced Graphs</h1></div>";
require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$original_params = json_encode($query);

$pid = $query['pid'];
$report_id = $query['report_id'];


$data_dictionary = MetaData::getDataDictionary("array", false, array(), array(), false, false, null, $_GET['pid']);
$report_fields = DataExport::getReports($report_id)["fields"];

$forms = array();
$Proj = new Project();
echo print_r($report_fields);
foreach ($Proj->forms as $form=>$attr) {
	$forms[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
}
//echo print_r($forms);
//echo json_encode($data_dictionary);
// $likert_groups = json_encode($module->likert_groups($data_dictionary, $forms));
echo print_r($query);
$likert_groups = json_encode($module->likert_groups($data_dictionary, $report_fields, $forms));
echo "TEST";
?>
<style>
/* https://www.w3schools.com/howto/howto_custom_select.asp */
.container {
  display: block;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 22px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Hide the browser's default checkbox */
.container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Create a custom checkbox */
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 25px;
  width: 25px;
  background-color: #eee;
}

/* On mouse-over, add a grey background color */
.container:hover input ~ .checkmark {
  background-color: #ccc;
}

/* When the checkbox is checked, add a blue background */
.container input:checked ~ .checkmark {
  background-color: #2196F3;
}

/* Create the checkmark/indicator (hidden when not checked) */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

/* Show the checkmark when checked */
.container input:checked ~ .checkmark:after {
  display: block;
}

/* Style the checkmark/indicator */
.container .checkmark:after {
  left: 9px;
  top: 5px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}
https://moderncss.dev/custom-select-styles-with-pure-css/
select {
  appearance: none;
  background-color: transparent;
  border: none;
  padding: 0 1em 0 0;
  margin: 0;
  width: 0%;
  font-family: inherit;
  font-size: inherit;
  cursor: inherit;
  line-height: inherit;
}

select::-ms-expand {
  display: none;
}

select {
  width: 100%;
  min-width: 15ch;
  max-width: 30ch;
  border: 1px solid #777;
  border-radius: 0.25em;
  padding: 0.25em 0.5em;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1.1;
  background-color: #fff;
  position: relative;
  display: block;
}

/* My own */
.forms {
	border: 1px solid #999;
	height: 400px;
	position: relative;
  	display: flex;
}
.form-left {
	float: left;
	position: relative;
  	display: block;
	width: 50%;
	
}
.custom_select {
	position: relative;
  	display: block;
}
</style>
<script>
data_dictionary = <?php echo json_encode($data_dictionary);?>;
console.log(data_dictionary);
constants = <?php echo json_encode(unserialize(str_replace(array('NAN;','INF;'),'0;',serialize(get_defined_constants()))), JSON_HEX_QUOT );?>;
ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>";
refferer_parameters = <?php echo $original_params;?>;
pid = <?php echo $_GET["pid"];?>;
ajax_url = ajax_url+ "&pid=" + pid;

likert_fields = <?php echo $likert_groups;?>;

console.log(likert_fields);

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
	$.ajax(ajax_url, {data: post_data, method: "POST"}).done(function( data ) {
		console.log(data);
		$('#advanced_graphs').html(
			data
		);
		
		$('#south').css('position', 'bottom');
	}).fail(function(xhr, status, error) {
      //Ajax request failed.
      var errorMessage = xhr.status + ': ' + xhr.statusText
      alert('Error - ' + errorMessage + status + error);
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

function likert_div() {
	if (!(likert_fields && Object.keys(likert_fields).length !== 0 && Object.getPrototypeOf(likert_fields) === Object.prototype)) {
		return;
	}
	// Keeps track of then number of graph forms that have been created
	likert_count = 0;

	let likert_html = `<div id="likert">\
						<h2 id="likert_header">Likert</h2>\
						<input id="add_likert" type="button" value="+">\
						</div>`;

	$('#advanced_graphs').append(likert_html);

	$('#add_likert').click(function() {
			likert_form(this);
	});
}

function likert_form(button) {
	let select_instrument = `<div class="forms" id="likert_${likert_count}">
			<div class="form-left">
			<label for="likert_instruments_${likert_count}">Choose an instrument</label>
			<select id="likert_instruments_${likert_count}" name="instrument">
			<option disabled selected value> -- select an instrument -- </option>`;

	

	for (const instrument in likert_fields) {
		select_instrument += `<option value=\"${instrument}\">${likert_fields[instrument]['instrument_label']}</option>`;
		// let i = 0;
		// for (const choices in likert_fields[instrument]['choices']) {

		// }
	}

	select_instrument += `</select><select id="likert_choices_${likert_count}"></select></div><div id="likert_checkbox_${likert_count}"></div></div>`;

	let current_count = likert_count;

	$(button).before(select_instrument);
	$(`#likert_choices_${current_count}`).hide();
	$(`#likert_instruments_${current_count}`).change(function() {
		$(`#likert_choices_${current_count}`).empty();
		console.log($(this).find(":selected").val());
		$(`#likert_choices_${current_count}`).append(`<option value='choice'>-- choose an option group --</option>`);
		$.each(likert_fields[$(this).find(":selected").val()]['choices'], function(key, value) {
			console.log(value);
			console.log(`#likert_choices_${current_count}`);
			$(`#likert_choices_${current_count}`).append(`<option value='${key}'>${key}</option>`);
		});
		$(`#likert_choices_${current_count}`).show();
	});

	$(`#likert_choices_${current_count}`).change(function () {
		let chosen_instrument = $(`#likert_instruments_${current_count}`).find(":selected").val();
		let chosen_options = $(this).find(":selected").val();
		console.log(chosen_options);
		$(`#likert_checkbox_${current_count}`).empty();
		$.each(likert_fields[chosen_instrument]['choices'][chosen_options], function(key, value) {
			console.log(value);
			$(`#likert_checkbox_${current_count}`).append(`<label class="container">${data_dictionary[value]['field_label']}<input type='checkbox' name="likert_fields" value=${value} checked='checked'><span class="checkmark"></span></label>`);
		});
	});

	likert_count++;
}

$(document).ready(function() {
	likert_div();
});

// $(document).ready(function() {
// 	$('#advanced_graphs').append(
// 	likert_form(likert_groups)
// 	);
// }
// );


// $.ajax(ajax_url, {data: {params: refferer_parameters, method: "get_fields"}, dataType: "json", method: "POST"}).done(function( data ) {
// 		console.log(data);
		
// 		$('#advanced_graphs').html(
// 			field_form(data)
// 		);
		
// 		$('#south').css('position', 'bottom');
// 	}).fail(function(xhr, status, error) {
//       //Ajax request failed.
//       var errorMessage = xhr.status + ': ' + xhr.statusText
//       alert('Error - ' + errorMessage + status + error);
// });

console.log("waiting");
</script>