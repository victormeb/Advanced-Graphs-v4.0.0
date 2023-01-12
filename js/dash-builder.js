function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function save_button() {
	let save_button = `<div style=\"text-align:center;margin:30px 0 50px;\">
<button class=\"btn btn-primaryrc\" style=\"font-size:15px !important;\" onclick=\"saveDash(4);\">Save Dashboard</button>
<a href=\"javascript:;\" style=\"text-decoration:underline;margin-left:20px;font-size:13px;\" onclick=\"window.location.href=app_path_webroot+'index.php?pid='+pid+'&amp;route=ProjectDashController:index'\">Cancel</a>
</div>`;

	$('#advanced_graphs').append(save_button);

}

function create_new_form(button, main_options, other_options) {
	// The main template all forms follow
	let graph_form = `<form class="forms">
								${main_options}
								<div class="preview-pane"></div>
								<div class="buttons">
									<button class="preview" type="button">Preview</button>
									<a class="config config-link">More Options</a>
									<button class="remove" type="button"><i class="fa fa-trash" aria-hidden="true"></i></button>
								</div>
								<div class="graph-modal">
									<div class="graph-options">
										${other_options}
									</div>
								</div>
							  </form>`;

	// Create a new form on top of the '+' button
	$(button).before(graph_form);

	// Set new_form to be the newly created form
	let new_form = $(button).prev();

	// Disable the preview button
	toggle_form(new_form, false);

	// Set the buttons for the new form
	set_buttons(new_form);

	// Update the report whenever the graph options change
	new_form.find('.graph-options').change(function() {
		update_report(new_form);
	});

	return new_form;

	// Each graph function must:
	// Create main options and other options menus
	// Determine whether to show instruments
	// Create logic to validate form
}

function likert_div() {
	if (!graph_groups["likert_groups"]
	|| Object.keys(graph_groups["likert_groups"]).length === 0
	|| Object.getPrototypeOf(graph_groups["likert_groups"]) !== Object.prototype)
		return;
	// Keeps track of then number of graph forms that have been created
	likert_count = 0;

	let likert_html = `
					<div id="likert" class="graph-type">\
						<h2 id="likert_header">Likert</h2>\
						<div class="explanation">
							<details>
							<summary class="instructions"><a>Instructions</a> <div class="float-right align-middle" style="font-size:1.2em;color:#999;"><i class="fas fa-angle-down"></i></div></summary>
								<ol>
									<li>Click '+' to create a new graph</li>
									<li>Choose an instrument (if applicable)</li>
									<li>Choose a group of options</li>
									<li>Choose the fields to include in the graph</li>
									<li>Click more options to view additional options for the graph</li>
								</ol>
							</details>
						</div>
						<input id="add_likert" type="button" value="+">
					</div>`;

	$('#advanced_graphs').append(likert_html);

	$('#add_likert').click(function() {
			likert_form(this);
	});
}

function likert_form(button) {
	let likert_fields = graph_groups["likert_groups"];
	// Are there more than one options for the instrument?
	let multiple_instruments = Object.keys(likert_fields).length > 1;

	let instruments = (multiple_instruments ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in likert_fields) {
		instruments += `<option value=\"${instrument}\">${likert_fields[instrument]['instrument_label']}</option>`;
	}

	let main_options = `<div class="form-left">
									<label>Instrument<select class="instrument-selector">${instruments}</select></label><br>
									<label>Option group<select class="options-selector" name="options"></select></label>
								</div>
								<div class="form-right"></div>`;

	let other_options = 
			`
			<label>Title<input type="text" name="title" placeholder="Default"></label>
			<br><label>Size of field labels<input type="number" step="1" name="label_text" value="10"></input> characters</label>
			<div class="radio label-length">
				<label>Bar Label Digits <input type="number" step="1" name="digits" value="2"></label>
				<hr><h3>How should labels be handeled?</h3>
				<label class="radio-label"><input class="radio-state" name="wrap_label" type="radio" value="true" checked><div class="radio-button"></div>Wrap</label>
				<label class="radio-label"><input class="radio-state" name="wrap_label" type="radio" value="false"><div class="radio-button"></div>Truncate</label>
				<label class="radio-label"><input class="radio-state label-as-is" name="wrap_label" type="radio" value="false"><div class="radio-button"></div>As-is</label>
				<br><label class="label-length-label"><span class="trunc-wrap">Wrap</span> after <input type="number" class="max_label_length" step="1" name="max_label_length" value="30"></input> characters</label>
		  	</div>
			<br><label>Legend text size<input type="number" step="0.01" name="legend_text" value="30"></input></label>
			<br><label>How many rows in the legend <input type="number" step="1" name="legend_rows" value="1"></input>(in case legend spills off image)</label>
			<button class="close-options" type="button">Close</button>`;
	
	// Create a new form with default buttons
	let new_form = create_new_form(button, main_options, other_options);

	function update_options() {
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();
		// Empty the options selector
		new_form.find('.options-selector').empty();	

		// If there are more than one option groups
		if (Object.keys(likert_fields[selected_instrument]['choices']).length >= 2)
			// Add the option prompting a user to select an options group
			new_form.find('.options-selector').append('<option disabled selected value> -- select an options group -- </option>');
		
		// For each options group in the selected instrument
		$.each(likert_fields[selected_instrument]['choices'], function (key, value) {
			// Add the option group to the selector
			new_form.find('.options-selector').append(`<option value='${escapeHtml(key)}'>${escapeHtml(key)}</option>`);
		});
		// Show the options group
		new_form.find('.options-selector').show();
	}

	function update_checkboxes() {
		let selected_group = new_form.find('.options-selector').find(':selected').val();
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();
		// Empty the checkbox fields
		new_form.find('.form-right').empty();

		// Fill the checkbox div with the appropriate fields
		$.each(likert_fields[selected_instrument]['choices'][selected_group], function(key, value) {
			new_form.find('.form-right').append(`<label class="container">${data_dictionary[value]['field_label']}<input type='checkbox' name="fields" value=${value} checked='checked'><span class="checkmark"></span></label>`);
		});
		// Add a select all checkbox
		new_form.find('.form-right').append(`<hr><label class="container">Select All<input type='checkbox' checked='checked' class='select-all'><span class="checkmark"></span></label>`);
		// Whenever the select-all is checked
		new_form.find('.select-all').click(function() {
			// select or deselect all fields
			$(this).parent().parent().find('input:checkbox').prop('checked', this.checked);
		});
		// Set the form as ready to preview
		toggle_form(new_form, true);
	}

	// Let the selected instrument be the currently selected one
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	// If there is an instrument selected
	if (selected_instrument) 
		// Fill the options group selector with the available choices
		update_options();
	else
		// Otherwise hide the options selector
		new_form.find('.options-selector').hide();

	// If there is only one instrument
	if (!multiple_instruments) {
		// Hide the instrument selector
		new_form.find('.instrument-selector').hide();
		// And its label
		new_form.find('.instrument-selector').parent().hide();
	}

	// When the selected instrument changes
	new_form.find('.instrument-selector').change(function () {
		update_options();
	});

	// Let the selected options group be stored in selected_group
	let selected_group = new_form.find('.options-selector').find(':selected').val();

	// If both the instrument and options group is selected
	if (selected_group && selected_instrument) {
		update_checkboxes();
		// Set the form as ready to preview
		toggle_form(new_form, true);
	}

	// Whenever the options group changes
	new_form.find('.options-selector').change(function() {
		update_checkboxes();
	});

	// Whenever the checkbox changes
	new_form.find('.form-right').change(function () {
		// If any fields are checked
		if ($(this).find('input:checkbox:checked').not('.select-all').length) {
			// Consider this form ready to preview
			toggle_form(new_form, true);
			return;
		}

		// If no fields are checked
		// "Turn off" the form
		toggle_form(new_form, false);
	});

	// If any of the graph-options change
	new_form.find('.graph-options').change(function() {
		// Update the report
		update_report(new_form);
	});

	
	label_length_logic(new_form);
}

function scatter_div() {
	if (!graph_groups["scatter_groups"]
	|| Object.keys(graph_groups["scatter_groups"]).length === 0
	|| Object.getPrototypeOf(graph_groups["scatter_groups"]) !== Object.prototype)
		return;


	let scatter_html = `<div id="scatter" class="graph-type">\
						<h2 id="scatter_header">Scatter</h2>\
						<div class="explanation">
								<details class="instructions">
								<summary><a>Instructions</a> <div class="float-right align-middle" style="font-size:1.2em;color:#999;"><i class="fas fa-angle-down"></i></div></summary>
									<ol>
										<li>Click '+' to create a new graph</li>
										<li>Choose an instrument (if applicable)</li>
										<li>Select an X and Y field</li>
										<li>Click the line checkbox if a line is desired</li>
										<li>Click more options to view additional options for the graph</li>
									</ol>
								</details>
							</div>
						<input id="add_scatter" type="button" value="+">
					   </div>`;

	$('#advanced_graphs').append(scatter_html);

	$('#add_scatter').click(function() {
			scatter_form(this);
	});
}

function scatter_form(button) {
	let scatter_fields = graph_groups["scatter_groups"];
	// Are there more than one options for the instrument?
	let multiple_instruments = Object.keys(scatter_fields).length > 1;

	let instruments = (multiple_instruments ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in scatter_fields) {
		instruments += `<option value=\"${instrument}\">${scatter_fields[instrument]['instrument_label']}</option>`;
	}

	let main_options = `<div class="form-left">
							<label>Instrument<select class="instrument-selector">${instruments}</select></label><br>
							<label>"X" field<select class="x-field field-selector" name="x"></select></label>
							<label>"Y" field<select class="y-field field-selector" name="y"></select></label>
							<label class="container line">Line?<input type="checkbox" name="line" value="true"><span class="checkmark"></span></label>
						</div>
						<div class="form-right"></div>`;

	let other_options = 
			`
			<label>Title<input type="text" name="title" placeholder="Default"></input></label>
			<button class="close-options" type="button">Close</button>`;

	// Create a new form with default buttons
	let new_form = create_new_form(button, main_options, other_options);

	function update_options() {
		// Let the selected instrument be the currently selected one
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

		// Reset the options with the corresponding fields
		new_form.find('.x-field').empty();
		new_form.find('.y-field').empty();

		// Ask the user to choose a field
		new_form.find('.x-field').append(`<option disabled selected>-- Choose an x field --</option>`);
		new_form.find('.y-field').append(`<option disabled selected>-- Choose a y field --</option>`);

		// For each option group
		$.each(scatter_fields[selected_instrument]['fields'], function (key, value) {
			// Add the option group
			new_form.find('.x-field').append(`<optgroup label='${escapeHtml(key)}'>`);
			new_form.find('.y-field').append(`<optgroup label='${escapeHtml(key)}'>`);

			// Add the fields for this option group
			$.each(value, function (key, value) {
				new_form.find('.x-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
				new_form.find('.y-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
			});

			// Close the option group
			new_form.find('.x-field').append(`</optgroup>`);
			new_form.find('.y-field').append(`</optgroup>`);
		});

		// And show the selectors
		new_form.find('.x-field').show();
		new_form.find('.y-field').show();
		new_form.find('.x-field').parent().show();
		new_form.find('.y-field').parent().show();
		new_form.find('.line').show();
	}

	function hide_selectors() {
		// Otherwise hide the options selector
		new_form.find('.x-field').hide();
		new_form.find('.y-field').hide();
		new_form.find('.x-field').parent().hide();
		new_form.find('.y-field').parent().hide();
		new_form.find('.line').hide();
	}

	// Let the selected instrument be the currently selected one
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	// If there is an instrument selected
	if (selected_instrument) 
		// Update the options
		update_options();
	else
		// Otherwise hide the selectors until an instrument is selected
		hide_selectors();

	// If there is only one instrument
	if (!multiple_instruments) {
		// Hide the instrument selector
		new_form.find('.instrument-selector').hide();
		// And its label
		new_form.find('.instrument-selector').parent().hide();
	}

	// When the instrument changes
	new_form.find('.instrument-selector').change(function () {
		update_options();
	});

	// When a field gets selected
	new_form.find('.field-selector').change(function () {
		// If fewer than 2 fields are selected
		if (new_form.find('.field-selector :selected').not(':disabled').length != 2) {
			// Disable the form
			toggle_form(new_form, false);
			return;
		}

		// Otherwise enable the form
		toggle_form(new_form, true);
	});

	// Any time the line checkbox is clicked. Update the form
	new_form.find('.line').change(function () {
		update_report(new_form);
	})

}

function barplot_div() {
	if (!graph_groups["barplot_groups"]
	|| Object.keys(graph_groups["barplot_groups"]).length === 0
	|| Object.getPrototypeOf(graph_groups["barplot_groups"]) !== Object.prototype)
		return;


	let barplot_html = `<div id="barplot" class="graph-type">\
							<h2 id="barplot_header">Bar Plot</h2>\
							<div class="explanation">
								<details  class="instructions">
								<summary><a>Instructions</a> <div class="float-right align-middle" style="font-size:1.2em;color:#999;"><i class="fas fa-angle-down"></i></div></summary>
									<ol>
										<li>Click '+' to create a new graph</li>
										<li>Choose an instrument (if applicable)</li>
										<li>Choose an X field (bars from this field will be formed along the x-axis)</li>
										<li>Decide whether the plot should be: </li>
										<ul>
											<b>Regular</b>
											<li>Do you want a Bar chart or a Pie chart</li>
										</ul>
										<ul>
											<b>Cross-tabulation</b>
											<li>Should the bars be stacked on top of each other or grouped next to each other?</li>
											<li>Choose an Y field (this field will form the stacks or sub-groups)</li>
										</ul>
										<li>Choose a numerical field or count for the bar heights</li>
										<li>Choose a summary function for the height field (if applicable)</li>
										<li>Click more options to view additional options for the graph</li>
									</ol>
								</details>
							</div>
							<input id="add_barplot" type="button" value="+">
					   </div>`;

	$('#advanced_graphs').append(barplot_html);

	$('#add_barplot').click(function() {
			barplot_form(this);
	});
}

function barplot_form(button) {
	let barplot_fields = graph_groups["barplot_groups"];
	// Are there more than one options for the instrument?
	let multiple_instruments = Object.keys(barplot_fields).length > 1;

	let instruments = (multiple_instruments ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in barplot_fields) {
		instruments += `<option value=\"${instrument}\">${barplot_fields[instrument]['instrument_label']}</option>`;
	}

	let main_options = `<div class="form-child">
							<label>Instrument<select class="instrument-selector">${instruments}</select></label><br>
							<label class="container cross-tab">Cross Tabulation<input type="checkbox" name="crosstab" value="true"><span class="checkmark"></span></label>
							<div class="radio grouped">
								<label class="radio-label">
									<input class="radio-state" type="radio"  name="grouped" value="false"><div class="radio-button"></div>Stacked
								</label> 
								<label class="radio-label">
									<input class="radio-state" type="radio"  name="grouped"  value="true"><div class="radio-button"></div>Grouped
								</label>
							</div>
							<div class="radio pie-chart">
								<label class="radio-label">
									<input class="radio-state" type="radio"  name="pie" value="false"><div class="radio-button"></div>Bars
								</label>
								<label class="radio-label">
									<input class="radio-state" type="radio"  name="pie" value="true"><div class="radio-button"></div>Pie
								</label> 
							</div>
							<label>Category "X"<select class="x-field field-selector" name="x"></select></label><br>
							<label>Category "Y"<select class="y-field field-selector" name="y"></select></label>
						</div>
						<div class="form-child">
							<label>Bar Heights<select class="bar-height field-selector" name="height"></select></label><br>
							<label>Summary Function
								<select class="sum-func field-selector" name="sumfunc">
									<option value="sum">Sum</option>
									<option value="mean">Mean</option>
									<option value="min">Min</option>
									<option value="max">Max</option>
								</select>
							</label>
							<div class="table-options">
								<br><label class="container include-table">Include Table <input class="include-table" type="checkbox" name="table" value="true"><span class="checkmark"></span></label>
								<div class="table-options-extra">
									<div class="radio cross-tab-table-margins">
										<h2>Show totals by...</h2>
										<label class="container" style="display: inline;">
											<input type="checkbox"  name="margin" value="1"><div class="checkmark"></div>Rows
										</label>
										<label class="container" style="display: inline;">
											<input type="checkbox"  name="margin" value="2"><div class="checkmark"></div>Columns
										</label> 
									</div>
									<div class="radio">
										<h2>Values or Percents...</h2>
										<label class="radio-label">
											<input class="radio-state" type="radio"  name="table_percents" value="false" checked><div class="radio-button"></div>Values
										</label> 
										<label class="radio-label cross-tab-table-percent">
											<input class="radio-state" type="radio"  name="table_percents"  value="true"><div class="radio-button"></div>Percents
										</label>
									</div>
									<div class="radio cross-tab-table-percent-margins">
										<h2>Percent by...</h2>
										<label class="radio-label percents-row">
											<input class="radio-state" type="radio"  name="percent_margin" value="1"><div class="radio-button"></div>Rows
										</label>
										<label class="radio-label percents-col">
											<input class="radio-state" type="radio"  name="percent_margin" value="2"><div class="radio-button"></div>Columns
										</label>
										<label class="radio-label percents-both">
											<input class="radio-state" type="radio"  name="percent_margin" value="3"><div class="radio-button"></div>Table
										</label> 
									</div>
							</div>
						</div>
						<input class="is-count" type="checkbox" name="count" value="true" hidden></input>
						</div>`;

	let other_options = 
			`
			<label>Title<input type="text" name="title" placeholder="Default"></label>
			<hr>
			<div class="radio label-length">
				<label>Bar Label Digits <input type="number" step="1" name="digits" value="2"></label>
				<hr><h3>How should labels be handeled?</h3>
				<label class="radio-label"><input class="radio-state" name="wrap_label" type="radio" value="true" checked><div class="radio-button"></div>Wrap</label>
				<label class="radio-label"><input class="radio-state" name="wrap_label" type="radio" value="false"><div class="radio-button"></div>Truncate</label>
				<label class="radio-label"><input class="radio-state label-as-is" name="wrap_label" type="radio" value="false"><div class="radio-button"></div>As-is</label>
				<br><label class="label-length-label"><span class="trunc-wrap">Wrap</span> after <input type="number" class="max_label_length" step="1" name="max_label_length" value="30"></input> characters</label>
		  	</div>
			<button class="close-options" type="button">Close</button>`;

	// Create a new form with default buttons
	let new_form = create_new_form(button, main_options, other_options);

	function show_available_fields(selected_instrument) {
		new_form.find('.grouped').hide();
		new_form.find('.grouped').prop('checked', false);

		new_form.find('.cross-tab').hide();
		new_form.find('.cross-tab').prop('checked', false);

		new_form.find('.y-field').hide();
		new_form.find('.y-field').parent().hide();

		new_form.find('.sum-func').hide();
		new_form.find('.sum-func').parent().hide();
	
		// If there are at least two categorical fields
		if (barplot_fields[selected_instrument]['fields']['Categorical'] && barplot_fields[selected_instrument]['fields']['Categorical'].length >= 2) {
			// Show the cross-tab toggle
			new_form.find('.cross-tab').show();
	
	
			new_form.find('.cross-tab input').change(function () {
				if ($(this).prop('checked')) {
					// Show the grouped selector
					new_form.find('.grouped').show();
	
					// Hide pie toggle
					new_form.find('.pie-chart').hide();
					new_form.find('.pie-chart').prop('checked', false);

					// Show the Y field selector
					// And show the selectors
					new_form.find('.y-field').show();
					new_form.find('.y-field').parent().show();
					return;
				}
				// If cross tab is not checked

				// Hide the grouped toggle
				new_form.find('.grouped').hide();

				// Show pie toggle
				new_form.find('.pie-chart').show();
				new_form.find('.pie-chart').prop('checked', false);

				// Show the Y field selector
				// And show the selectors
				new_form.find('.y-field').hide();
				new_form.find('.y-field').parent().hide();
			});

		}

		// Show X-field
		new_form.find('.x-field').show();
		new_form.find('.x-field').parent().show();
		// Show Height field
		new_form.find('.bar-height').show();
		new_form.find('.bar-height').parent().show();
		// Show pie toggle
		new_form.find('.pie-chart').show();
		new_form.find('.pie-chart').prop('checked', false);
	}

	function hide_all_fields() {
		new_form.find('.grouped').hide();
		new_form.find('.grouped').prop('checked', false);

		new_form.find('.pie-chart').hide();
		new_form.find('.pie-chart').prop('checked', false);

		new_form.find('.cross-tab').hide();
		new_form.find('.cross-tab').prop('checked', false);

		new_form.find('.y-field').hide();
		new_form.find('.y-field').parent().hide();

		new_form.find('.x-field').hide();
		new_form.find('.x-field').parent().hide();

		new_form.find('.sum-func').hide();
		new_form.find('.sum-func').parent().hide();

		new_form.find('.table-options').hide();
	}

	function instrument_update() {
		// Let the selected instrument be the currently selected one
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

		// Reset the options with the corresponding fields
		new_form.find('.x-field').empty();
		new_form.find('.y-field').empty();
		new_form.find('.bar-height').empty();

		// Set Pie Chart to false
		new_form.find('.pie-chart').prop('checked', false);

		// Ask the user to choose a field
		new_form.find('.x-field').append(`<option disabled selected>-- Choose an x field --</option>`);
		new_form.find('.y-field').append(`<option disabled selected>-- Choose a y field --</option>`);

		// Add each category to the selectors
		$.each(barplot_fields[selected_instrument]['fields']['Categorical'], function (key, value) {
			new_form.find('.x-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
			new_form.find('.y-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
		});

		new_form.find('.bar-height').append(`<option disabled selected>-- Choose how bar heights are calculated --</option>`);

		// Add the count option to the heights bar
		new_form.find('.bar-height').append(`<optgroup label="Count"><option value="sum">Count</option></optgroup>`);

		// Add the numeric fields if there are any
		if (barplot_fields[selected_instrument]['fields']['Numeric'] && barplot_fields[selected_instrument]['fields']['Numeric'].length) {
			new_form.find('.bar-height').append(`<optgroup class="numeric-group" label="Numeric"></optgroup>`);

			// Add the Numeric Fields to heights selector
			$.each(barplot_fields[selected_instrument]['fields']['Numeric'], function (key, value) {
				new_form.find('.numeric-group').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
			});
		}	

		// When the bar-height is selected, show or hide the summary functions
		new_form.find('.bar-height').change(function() {
			if ($(this).find(':selected').parent().attr('label') === "Count") {
				// Set the count parameter to true
				new_form.find('.is-count').prop('checked', true);
				

				// Hide the summary functions
				new_form.find('.sum-func').val("sum");
				new_form.find('.sum-func').hide();
				new_form.find('.sum-func').parent().hide();

				return;
			}

			// Set the count parameter to false
			new_form.find('.is-count').prop('checked', false);

			// Show the summary functions
			new_form.find('.sum-func').show();
			new_form.find('.sum-func').parent().show();
		});

		// And show the selectors
		show_available_fields(selected_instrument);
	}

	// If there is only one instrument
	if (!multiple_instruments) {
		// Hide the instrument selector
		new_form.find('.instrument-selector').hide();
		// And its label
		new_form.find('.instrument-selector').parent().hide();
	}

	// Let the selected instrument be the currently selected one
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	// If there is an instrument selected
	if (selected_instrument)
		// Set the logic for based on the instrument
		instrument_update();
	else
		// Otherwise hide all the fields
		hide_all_fields();

	new_form.find('.table-options-extra').hide();

	// When the selected instrument changes
	new_form.find('.instrument-selector').change(function () {
		instrument_update();
	});

	// new_form.find('.table-options').change(function() {
	// 	if (!new_form.find('.table-options').find('.include-table input').prop('checked')) {
	// 		new_form.find('.table-options-extra').hide();
	// 		console.log("no table");
	// 		return;
	// 	}

	// 	new_form.find('.table-options-extra').show();
	// 	new_form.find('.cross-tab-table-percent').show();

	// 	new_form.find('.cross-tab-table-percent-margins').show();
	// 	new_form.find('.cross-tab-table-margins').show();


	// 	if (!new_form.find('.cross-tab input').prop('checked')) {
	// 		new_form.find('.cross-tab-table-percent-margins').hide();
	// 		new_form.find('.cross-tab-table-margins').hide();
	// 		console.log("one2");
	// 	}


		
	// })
	new_form.change(function () {
		// If the table is not included hide the extra table options
		if (!new_form.find('.table-options').find('.include-table input').prop('checked')) {
			new_form.find('.table-options-extra').hide();
			
			return;
		}

		// Otherwise show the extra table options
		new_form.find('.table-options-extra').show();

		// If crosstab is not checked remove the margin options
		if (!new_form.find('.cross-tab input').prop('checked')) {
			new_form.find('.cross-tab-table-percent-margins').hide();
			new_form.find('.cross-tab-table-margins').hide();
			return;
		}

		// Otherwise display the margin options
		new_form.find('.cross-tab-table-percent-margins').show();
		new_form.find('.cross-tab-table-margins').show();

		// If percents aren't selected hide the percent margin options
		if (!new_form.find('.table-options').find('.cross-tab-table-percent input').prop('checked')) {
			new_form.find('.cross-tab-table-percent-margins').hide();
			
			return;
		}

	});

	// new_form.find('.percents-both input').change(function() {
	// 	let checked = $(this).prop("checked")
	// 	new_form.find('.cross-tab-table-percent-margins input').not(this).each(function () {
	// 		$(this).prop("checked", checked)});
	// });

	// new_form.find('.cross-tab-table-percent-margins input').not('.percents-both input').change(function () {
	// 	new_form.find('.cross-tab-table-percent-margins input').not(this).prop('checked', false);
	// });

	new_form.change(function () {
		// If either the x-field or the height is not selected, we cannont preview
		if (!$(this).find('.x-field :selected').not(':disabled').attr('value') || !$(this).find('.bar-height :selected').not(':disabled').length)
			return toggle_form(new_form, false);

		let crosstab_checked = $(this).find('.cross-tab input').prop('checked');
		let y_selected = !$(this).find('.y-field :selected').not(':disabled').length;
		let x_equals_y = $(this).find('.x-field').val() === $(this).find('.y-field').val();

		if (// If cross-tab is selected
			crosstab_checked
			&& (
				//  but there is no Y field selected
				y_selected
				// Or the X field equals the Y field
				|| x_equals_y)
			)
			// No Preview
			return toggle_form(new_form, false);

		// Otherwise the form is ready for preview
		toggle_form(new_form, true);

	});

	label_length_logic(new_form);
}

function map_div() {
	if (!graph_groups["map_groups"]
	|| Object.keys(graph_groups["map_groups"]).length === 0
	|| Object.getPrototypeOf(graph_groups["map_groups"]) !== Object.prototype)
		return;


	let map_html = `<div id="map" class="graph-type">\
						<h2 id="map_header">Map</h2>\
						<div class="explanation">
							<details  class="instructions">
							<summary><a>Instructions</a> <div class="float-right align-middle" style="font-size:1.2em;color:#999;"><i class="fas fa-angle-down"></i></div></summary>
								<ol>
									<li>Click '+' to create a new graph</li>
									<li>Choose an instrument (if applicable)</li>
									<li>Select a latitude or longitude field (other field will update to match)</li>
									<li>
										<p><b>Cluster by count: </b><br> Each instance of a location willl be plotted on the 
										map and locations that are near each other or the same will be grouped into a 
										cluster which counts the location</p><br>
										<p><b>Cluster by location: </b><br> All instances of a location will be combined into a 
										single location by count or some by some function of a numerical field. For example: 
										minimum height per city. When zoomed out, nearby cities will be joined into clusters
										showing the number of cities contained within that cluster. If there is a categorical field
										with exactly one level per city, it can be used to categorize the locations by color, with a legend.</p><br>
										<ol>
											<li>Choose count or a numerical field for the location weights</li>
											<li>Choose a summary function for the location weights (if applicable)</li>
											<li>Choose a unique identifier for the locations (if available)</li>
										</ol>
									</li>
									<li>Click more options to view additional options for the graph</li>
								</ol>
							</details>
						</div>
						<input id="add_map" type="button" value="+">
					   </div>`;

	$('#advanced_graphs').append(map_html);

	$('#add_map').click(function() {
		map_form(this);
	});
}

function map_form(button) {
	let map_fields = graph_groups["map_groups"];
	// Are there more than one options for the instrument?
	let multiple_instruments = Object.keys(map_fields).length > 1;

	let instruments = (multiple_instruments ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in map_fields) {
		instruments += `<option value=\"${instrument}\">${map_fields[instrument]['instrument_label']}</option>`;
	}

	let main_options = `<div class="form-child">
							<label>Instrument<select class="instrument-selector">${instruments}</select></label><br>
							<div class="field-selector">
								<label>Longitude<select class="longitude-field" name="lng"></select></label><br>
								<label>Latitude<select class="latitude-field" name="lat"></select></label>
							</div>
						</div>
						<div class="form-right">
							<div class="radio cluster-type">
								<h4>Cluster By: </h4>
								<label class="radio-label"><input class="radio-state" name="cluster_by" type="radio" value="location" checked><div class="radio-button"></div>Location</label>
								<label class="radio-label"><input class="radio-state" name="cluster_by" type="radio" value="count"><div class="radio-button"></div>Count</label>
							</div>
							<div class="location-options">
								<label>Location weight<select class="map-count" name="weight"></select></label><br>
								<label>Summary Function
									<select class="sum-func" name="sumfunc">
										<option value="sum">Sum</option>
										<option value="mean">Mean</option>
										<option value="min">Min</option>
										<option value="max">Max</option>
									</select>
								</label><br>
								<label>Location identifier<select class="map-type" name="type"></select></label><br>
								<input class="is-count" type="checkbox" name="count" value="true" hidden></input>
							</div>
						</div>`;

	let other_options = 
			`
			<label>Title<input type="text" name="title" placeholder="Default"></label>
			<hr>
			<label>Mean dot size<input type="number" step="1" name="dot_size" value="10"></label>
			<button class="close-options" type="button">Close</button>`;


	function instrument_update() {
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

		

		// Reset the options with the corresponding fields
		new_form.find('.longitude-field').empty();
		new_form.find('.latitude-field').empty();
		new_form.find('.map-count').empty();

		// Set Pie Chart to false
		new_form.find('.pie-chart').prop('checked', false);

		// Ask the user to choose a field
		new_form.find('.longitude-field').append(`<option disabled selected>-- Choose a longitude field --</option>`);
		new_form.find('.latitude-field').append(`<option disabled selected>-- Choose a latitude field --</option>`);

		// Add each of the longitude fields
		$.each(map_fields[selected_instrument]['fields']['Coordinates'], function (key, value) {
			new_form.find('.latitude-field').append(`<option value='${escapeHtml(value['latitude'])}'>${data_dictionary[value['latitude']]['field_label']}</option>`);
			
			new_form.find('.longitude-field').append(`<option value='${escapeHtml(value['longitude'])}'>${data_dictionary[value['longitude']]['field_label']}</option>`);
		
			new_form.find('.latitude-field').change(function() {
				if ($(this).find(':selected').val() == value['latitude']) 
					new_form.find('.longitude-field').val(value['longitude']);
			});

			new_form.find('.longitude-field').change(function() {
				if ($(this).find(':selected').val() == value['longitude']) 
					new_form.find('.latitude-field').val(value['latitude']);
			});
		});

		// Add each of the latitude fields
		$.each(map_fields[selected_instrument]['fields']['Latitude'], function (key, value) {
			
		});

		// Add the count option to the heights bar
		new_form.find('.map-count').append(`<optgroup label="Count"><option value>Count</option></optgroup>`);
		console.log(map_fields[selected_instrument]['fields']['Numeric']);
		// Add the numeric fields if there are any
		if (map_fields[selected_instrument]['fields']['Numeric'] && map_fields[selected_instrument]['fields']['Numeric'].length) {
			new_form.find('.map-count').append(`<optgroup class="numeric-group" label="Numeric"></optgroup>`);

			// Add the Numeric Fields to heights selector
			$.each(map_fields[selected_instrument]['fields']['Numeric'], function (key, value) {
				new_form.find('.numeric-group').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
			});
		}

		new_form.find('.field-selector').show();
		new_form.find('.map-count').show();
	}

	function hide_all_fields() {
		new_form.find('.field-selector').hide();
		new_form.find('.form-right').hide();
	}
	// Create a new form with default buttons
	let new_form = create_new_form(button, main_options, other_options);

	// If there is only one instrument
	if (!multiple_instruments) {
		// Hide the instrument selector
		new_form.find('.instrument-selector').hide();
		// And its label
		new_form.find('.instrument-selector').parent().hide();
	}
	

	// Let the selected instrument be the currently selected one
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	// If there is an instrument selected
	if (selected_instrument)
		// Set the logic for based on the instrument
		instrument_update();
	else
		// Otherwise hide all the fields
		hide_all_fields();

	new_form.find('.form-right').hide();
	new_form.find('.sum-func').hide();
	new_form.find('.sum-func').parent().hide();


	// When the selected instrument changes
	new_form.find('.instrument-selector').change(function () {
		instrument_update();
	});

	// When the bar-height is selected, show or hide the summary functions
	new_form.find('.map-count').change(function() {
		if ($(this).find(':selected').parent().attr('label') === "Count") {
			
			// Set the count parameter to true
			new_form.find('.is-count').prop('checked', true);


			// Hide the summary functions
			new_form.find('.sum-func').val("sum");
			new_form.find('.sum-func').hide();
			new_form.find('.sum-func').parent().hide();

			return;
		}

		// Set the count parameter to false
		new_form.find('.is-count').prop('checked', false);


		// Show the summary functions
		new_form.find('.sum-func').show();
		new_form.find('.sum-func').parent().show();
	});

	// Hide or show additional clustering options based on location vs count clustering
	new_form.find('.cluster-type').change(function() {
		let selected = $(this).find("input[name='cluster_by']:checked");

		if (selected.val() === "location") {
			new_form.find('.location-options').show();
			return;
		}

		new_form.find('.location-options').hide();
	});

	// Get unique categorical fields for the locations
	new_form.find('.field-selector').change(function() {
		// Hide the right hand form
		new_form.find('.form-right').hide();

		// Let the selected instrument be the currently selected one
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();
		let longitude = new_form.find('.longitude-field').val();
		let latitude = new_form.find('.latitude-field').val();
		if (!longitude || !latitude)
			return;

		new_form.find('.form-right').show();

		let category_fields = [];

		for (const i in map_fields[selected_instrument]['fields']['Categorical']) {
			let category_field = map_fields[selected_instrument]['fields']['Categorical'][i];
			let skip = false;
			let record_list = {};
			for (const record in report) {
				let location = [report[record][longitude], report[record][latitude]];
				let current_option = report[record][category_field];
				let location_visited = location in record_list;

				if (location_visited && record_list[location] != current_option) {
					skip = true;
					break;
				}

				record_list[location] = current_option;
			}

			if (skip)
				continue;

			category_fields.push(category_field);
		}

		new_form.find('.map-type').empty();
		new_form.find('.map-type').hide();
		new_form.find('.map-type').parent().hide();
		

		if (!category_fields.length)
			return;

		new_form.find('.map-type').append(`<optgroup label="None"><option value>None</option></optgroup>`);
		new_form.find('.map-type').append(`<optgroup class="categories" label="Categories"></optgroup>`);


		$.each(category_fields, function(key, value) {
			new_form.find('.map-type').find('.categories').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
		});
		
		new_form.find('.map-type').show();
		new_form.find('.map-type').parent().show();
	});

	new_form.change(function() {
		let longitude = new_form.find('.longitude-field').val();
		let latitude = new_form.find('.latitude-field').val();
		if (!longitude || !latitude) {
			toggle_form(new_form, false);
			return;
		}

		toggle_form(new_form, true);
			
	});
}

function network_div() {

	if (!graph_groups["network_groups"]
	|| Object.keys(graph_groups["network_groups"]).length === 0
	|| Object.getPrototypeOf(graph_groups["network_groups"]) !== Object.prototype)
		return;


	let network_html = `<div id="network" class="graph-type">\
						<h2 id="network_header">Network</h2>\
						<div class="explanation">
								<details class="instructions">
									<summary><a>Instructions</a> <div class="float-right align-middle" style="font-size:1.2em;color:#999;"><i class="fas fa-angle-down"></i></div></summary>
									<ol>
										<li>Click '+' to create a new graph</li>
										<li>Choose an instrument (if applicable)</li>
										<li>Select an X and Y field (If the graph is directed X will point to Y)</li>
										<li>Check the directed checkbox the graph should be directed</li>
										<li>Click more options to view additional options for the graph</li>
									</ol>
								</details>
							</div>
						<input id="add_network" type="button" value="+">
						</div>`;

	$('#advanced_graphs').append(network_html);

	$('#add_network').click(function() {
		network_form(this);
	});
}

function network_form(button) {
	let network_fields = graph_groups["network_groups"];
	// Are there more than one options for the instrument?
	let multiple_instruments = Object.keys(network_fields).length > 1;

	let instruments = (multiple_instruments ? '<option disabled selected value> -- select an instrument -- </option>' : '');

	for (const instrument in network_fields) {
		instruments += `<option value=\"${instrument}\">${network_fields[instrument]['instrument_label']}</option>`;
	}

	let main_options = `<div class="form-left">
							<label>Instrument<select class="instrument-selector">${instruments}</select></label><br>
							<label>"X" field<select class="x-field field-selector" name="x"></select></label>
							<label>"Y" field<select class="y-field field-selector" name="y"></select></label>
							<label class="container directed">Directed?<input type="checkbox" name="directed" value="true" checked><span class="checkmark"></span></label>
						</div>
						<div class="form-right"></div>`;

	let other_options = 
			`
			<label>Title<input type="text" name="title" placeholder="Default"></input></label><hr>
			<label>Title Size<input type="number" step="1" name="title_size" value = "100"></input></label><br>
			<label>Arrow Width<input type="number" step="0.1" name="arrow_width" value = "0.5"></input></label><br>
			<label>Arrow Size<input type="number" step="0.1" name="arrow_width" value = "0.5"></input></label><br>
			<label>Vertex Size<input type="number" step="0.1" name="vertex_size" value = "5"></input></label><br>
			<label>Vertex Label Size<input type="number" step="0.1" name="vertex_label_size" value = "0.4"></input></label><br>
			<button class="close-options" type="button">Close</button>`;

	// Create a new form with default buttons
	let new_form = create_new_form(button, main_options, other_options);

	function update_options() {
		// Let the selected instrument be the currently selected one
		let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

		// Reset the options with the corresponding fields
		new_form.find('.x-field').empty();
		new_form.find('.y-field').empty();

		// Ask the user to choose a field
		new_form.find('.x-field').append(`<option disabled selected>-- Choose an x field --</option>`);
		new_form.find('.y-field').append(`<option disabled selected>-- Choose a y field --</option>`);

		// For each option group
		$.each(network_fields[selected_instrument]['fields'], function (key, value) {
			console.log(value);
			// Add the option group
			new_form.find('.x-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
			new_form.find('.y-field').append(`<option value='${escapeHtml(value)}'>${data_dictionary[value]['field_label']}</option>`);
		});

		// And show the selectors
		new_form.find('.x-field').show();
		new_form.find('.y-field').show();
		new_form.find('.x-field').parent().show();
		new_form.find('.y-field').parent().show();
		new_form.find('.directed').show();
	}

	function hide_selectors() {
		// Otherwise hide the options selector
		new_form.find('.x-field').hide();
		new_form.find('.y-field').hide();
		new_form.find('.x-field').parent().hide();
		new_form.find('.y-field').parent().hide();
		new_form.find('.directed').hide();
	}

	// Let the selected instrument be the currently selected one
	let selected_instrument = new_form.find('.instrument-selector').find(':selected').val();

	// If there is an instrument selected
	if (selected_instrument) 
		// Update the options
		update_options();
	else
		// Otherwise hide the selectors until an instrument is selected
		hide_selectors();

	// If there is only one instrument
	if (!multiple_instruments) {
		// Hide the instrument selector
		new_form.find('.instrument-selector').hide();
		// And its label
		new_form.find('.instrument-selector').parent().hide();
	}

	// When the instrument changes
	new_form.find('.instrument-selector').change(function () {
		update_options();
	});

	// When a field gets selected
	new_form.find('.field-selector').change(function () {
		// If fewer than 2 fields are selected
		if (new_form.find('.field-selector :selected').not(':disabled').length != 2 || new_form.find('.x-field').val() == new_form.find('.y-field').val() ) {
			// Disable the form
			toggle_form(new_form, false);
			return;
		}

		// Otherwise enable the form
		toggle_form(new_form, true);
	});

	// Any time the line checkbox is clicked. Update the form
	new_form.find('.directed').change(function () {
		update_report(new_form);
	})
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

function label_length_logic(form) {
	form.find('.label-length').change(function () {
		// Get the current selected radio button's value
		let selected = $(this).find("input[name='wrap_label']:checked");

		// If there is no value, the selected input is As-is
		if (selected.val() === "false" && selected.hasClass("label-as-is")) {
			// Set the value to the max_label_length to Infinity
			$(this).find('.max_label_length').prop('type', 'text');
			$(this).find('.max_label_length').val('Inf');
			// Hide the text input
			$(this).find('.label-length-label').hide();
			update_report(form);
			return;
		}

		// Otherwise show the text input
		$(this).find('.label-length-label').show();

		// If the current value is equal to Inf
		if ($(this).find('.max_label_length').val() === "Inf") {
			// Set the value to the max_label_length to 30
			$(this).find('.max_label_length').prop('type', 'number');
			$(this).find('.max_label_length').val('30');
		}

		update_report(form);

		if (selected === "true") {
			$(this).find('.trunc-wrap').text('Wrap');
			return;
		}

		$(this).find('.trunc-wrap').text('Truncate');

	});
	
}

function generate_graph(form) {
	if (!report_object.has(form)) {
		console.log("An error has occured, user should not be able to generate a disabled graph");
		return;
	}

	form.find(".preview-pane").html("<h2>Loading your graph...</h2>");

	console.log(report_object.get(form));

	$.ajax(ajax_url, {data: {params: refferer_parameters, graphs: [report_object.get(form)], method: "build_graphs"}, dataType: "json", method: "POST"}).done(function(data) { //, dataType: "html"
		console.log(data);
		if (!data["status"]) {
			form.find(".preview-pane").html("<h2 style=\"color: red;\">There was an error loading your graph</h2>");
			console.log(data["r_output"]);
			return;
		}
		
		form.find(".preview-pane").html(data["html"]);
	});
}


