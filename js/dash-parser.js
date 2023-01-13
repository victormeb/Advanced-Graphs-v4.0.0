function edit_form() {
    // report_array is a global object containing graph objects
    for (const form in report_array) {

    }

}

function load_likert(form_data) {
    let form = likert_form($('#add_likert'));

    form.find('.instrument-selector').val(form_data['instrument'][0]).change();

    form.find('.options-selector').val(form_data['options'][0]).change();

    $("input[name=fields]").each(function() {
        $(this).prop('checked', form_data['fields'].includes($(this).val()));
    });
    

    $(`input[name=wrap_label][value=${form_data['wrap_label'][0]}]`).prop("checked", true).change();

    $.each(["digits", "title", "label_text", "digits", "max_label_length", "legend_text", "legend_rows"], function(key, value) {
        form.find(`input[name=${value}]`).val(form_data[value][0]);
    });


    update_report(form);
}

function load_scatter() {

}

function load_barplot() {

}

function load_map() {

}

function load_network() {

}