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

echo "BOOM";
$Proj = new Project($pid);

$repeat_instruments = $module->get_repeat_instruments($Proj);

$instruments = array();
// echo print_r($report_fields);
foreach ($Proj->forms as $form=>$attr) {
	$instruments[] = array('instrument_name'=>$form, 'instrument_label'=>strip_tags(html_entity_decode($attr['menu'], ENT_QUOTES)));
}
//echo print_r($forms);
//echo json_encode($data_dictionary);
// $likert_groups = json_encode($module->likert_groups($data_dictionary, $forms));
echo print_r($query);
$likert_groups = json_encode($module->likert_groups($data_dictionary, $report_fields, $instruments, $repeat_instruments));
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
/* https://moderncss.dev/custom-select-styles-with-pure-css/ */
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

.graph-type {
	display: block;
	border: 2px solid #777;
	gap: 16px;
}

/* .forms {
	display: flex;
	border: 1px solid #999;
	width: 100%;
	block-size: fit-content;
	margin: 5px;
	gap: 16px;
} */

.likert-form {
	display: grid;
	border: 1px solid #999;
	grid-template-columns: 1fr 1fr; 
  	grid-template-rows: 1fr 0.1fr; 
  	gap: 0px 0px; 
  	grid-template-areas: 
		"form-child form-checkbox"
		"buttons buttons"
}

.form-child {
	grid-area: form-child;
}

.form-checkbox {
	grid-area: form-checkbox;
}

.buttons {
	display: inline;
	grid-area: buttons;
	padding: 10px;
}

.preview {
	background-color: #4CAF50;
	border: none;
	color: white;
	width: 80px;
	height: 30px;
	text-align: center;
	font-size: 16px;
}

.remove {
	background-color: transparent;
	border: none;
	color: #db021c;
	width: 30px;
	height: 30px;
	text-align: center;
	font-size: 16px;
	float: right;
}

.config {
	background-color: transparent;
	border: none;
	color: grey;
	width: 30px;
	height: 30px;
	text-align: center;
	font-size: 16px;
}

/* .form-left {
	float: left;
	position: absolute;
	width: 50%;
	block-size: fit-content;
} */
.custom_select {
	position: relative;
  	display: block;
}

.graph-modal{
	display: none;
	position: fixed;
	z-index: 1;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	overflow: auto;
	background-color: rgb(0,0,0); 
  	background-color: rgba(0,0,0,0.4); 
}

.graph-options{
	background-color: #fefefe;
	margin: 15% auto;
	padding: 20px;
	border: 1px solid #888;
	width: 80%;
}
</style>
<script>
var data_dictionary = <?php echo json_encode($data_dictionary);?>;
console.log(data_dictionary);
var constants = <?php echo json_encode(unserialize(str_replace(array('NAN;','INF;'),'0;',serialize(get_defined_constants()))), JSON_HEX_QUOT );?>;
var ajax_url = "<?php echo  ExternalModules::getPageUrl("advanced_graphs", "advanced_graphs_ajax");?>";
var refferer_parameters = <?php echo $original_params;?>;
var pid = <?php echo $_GET["pid"];?>;
var ajax_url = ajax_url+ "&pid=" + pid;

var likert_fields = <?php echo $likert_groups;?>;

var report_object = new Map();

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

	let likert_html = `<div id="likert" class="graph-type">\
						<h2 id="likert_header">Likert</h2>\
						<input id="add_likert" type="button" value="+">
					   </div>`;

	$('#advanced_graphs').append(likert_html);

	$('#add_likert').click(function() {
			likert_form(this);
	});
}

function likert_form(button) {
	// Are there more than one options for the instrument?
	let multiple_options = Object.keys(likert_fields).length > 1;

	let instruments = (multiple_options ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in likert_fields) {
		instruments += `<option value=\"${instrument}\">${likert_fields[instrument]['instrument_label']}</option>`;
	}

	
	let select_instruments = `<form class="forms likert-form">
								<div class="form-child">
									<select class="instrument-selector">${instruments}</select>
									<select class="options-selector"></select>
								</div>
								<div class="form-checkbox"></div>
								<div class="buttons">
									<button class="preview" type="button">Preview</button>
									<button class="config" type="button"><i class="fa fa-cog" aria-hidden="true"></i></button>
									<button class="remove" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>
								</div>
								<div class="graph-modal">
									<div class="graph-options">
										<label>Title<input type="text" name="title" placeholder="Default"></label>
										<button class="close-options" type="button">Close</button>
									</div>
								</div>
							  </form>`;
	
	$(button).before(select_instruments);

	let new_form = $(button).prev(); 

	toggle_form(new_form, false);

	set_buttons(new_form);
	
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	if (selected_instrument) 
		$.each(likert_fields[selected_instrument]['choices'], function (key, value) {
			new_form.find('.options-selector').append(`<option value='${key}'>${key}</option>`);
		});
	else
		new_form.find('.options-selector').hide();

	new_form.find('.instrument-selector').change(function () {
		let selected_instrument = $(this).find(':selected').val();
		new_form.find('.options-selector').empty();	
		new_form.find('.options-selector').append('<option disabled selected value> -- select an options group -- </option>');
		$.each(likert_fields[selected_instrument]['choices'], function (key, value) {
			new_form.find('.options-selector').append(`<option value='${key}'>${key}</option>`);
		});
		new_form.find('.options-selector').show();
	});

	let selected_group = new_form.find('.options-selector').find(':selected').val();

	if (selected_group && selected_instrument) {
		$.each(likert_fields[selected_instrument]['choices'][selected_group], function(key, value) {
			console.log(value);
			new_form.find('.form-checkbox').append(`<label class="container">${data_dictionary[value]['field_label']}<input type='checkbox' name="fields" value=${value} checked='checked'><span class="checkmark"></span></label>`);
		});
		new_form.find('.form-checkbox').append(`<hr><label class="container">Select All<input type='checkbox' checked='checked' class='select-all'><span class="checkmark"></span></label>`);
		new_form.find('.select-all').click(function() {
			$(this).parent().parent().find('input:checkbox').prop('checked', this.checked);
		});
		toggle_form(new_form, true);
	}

	new_form.find('.options-selector').change(function() {
		let selected_group = new_form.find('.options-selector').find(':selected').val();
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();
		new_form.find('.form-checkbox').empty();
		$.each(likert_fields[selected_instrument]['choices'][selected_group], function(key, value) {
			console.log(value);
			new_form.find('.form-checkbox').append(`<label class="container">${data_dictionary[value]['field_label']}<input type='checkbox' name="fields" value=${value} checked='checked'><span class="checkmark"></span></label>`);
		});
		new_form.find('.form-checkbox').append(`<hr><label class="container">Select All<input type='checkbox' checked='checked' class='select-all'><span class="checkmark"></span></label>`);
		new_form.find('.select-all').click(function() {
			$(this).parent().parent().find('input:checkbox').prop('checked', this.checked);
		});
		toggle_form(new_form, true);
		// new_form.find('.preview').prop('disabled', false);
		// new_form.find('.preview').css('background-color',' #4CAF50');
	});

	new_form.find('.form-checkbox').change(function () {
		if ($(this).find('input:checkbox:checked').not('.select-all').length) {
			toggle_form(new_form, true);
			console.log(new_form.serializeArray());
			return;
		}	
		toggle_form(new_form, false);
	});
}

function toggle_form(form, enabled) {
	if (enabled) {
		form.find('.preview').prop('disabled', false);
		form.find('.preview').css('background-color','#4CAF50');
		update_report(form);
		return;
	}

	form.find('.preview').prop('disabled', true);
	form.find('.preview').css('background-color', 'grey');
	update_report(form);
}

function update_report(form) {
	if (form.find('.preview').prop('disabled')) {
		if (report_object.has(form))
			report_object.delete(form);
		return;
	}

	let graph = {params: {}};
	let form_data = form.serializeArray();

	for (const i in form_data) {
		let pair = form_data[i];
		if (pair['name'] in graph['params']) {
			graph['params'][pair['name']].push(pair['value']);
			continue;
		}
		graph['params'][pair['name']] = [pair['value']];
	}

	graph['type'] = form.parent().attr('id');

	report_object.set(form, graph);
}

function set_buttons(form) {
	// Config button opens modal
	form.find('.config').click(function () {
		form.find('.graph-modal').css('display', 'block');
	});

	// Close modal button closes modal
	form.find('.close-options').click(function () {
		form.find('.graph-modal').css('display', 'none');
	});

	// Remove button removes form and removes form from report_object list
	form.find('.remove').click(function() {
		form.remove();
		if (report_object.has(form))
			report_object.delete(form);
	});

	// Preview button generates preview
	form.find('.preview').click(function () {
		generate_graph(form);
	});
}

function generate_graph(form) {
	if (!report_object.has(form)) {
		console.log("An error has occured, user should not be able to generate a disabled graph");
		return;
	}

	$.ajax(ajax_url, {data: {params: refferer_parameters, graphs: [report_object.get(form)], method: "build_graphs"}, method: "POST"}).done(function(data) { //, dataType: "html"
		console.log(data);
	});
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
</script>