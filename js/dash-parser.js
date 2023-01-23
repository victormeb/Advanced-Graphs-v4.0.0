function edit_form(report_array) {
    // report_array is a global object containing graph objects
    for (const key in report_array) {
        let graph = report_array[key];

        switch (graph['type']) {
            case 'likert':
                load_likert(graph);
                break;
            case 'scatter':
                load_scatter(graph);
                break;
            default:
                console.log(`${graph['type']} not ready yet.`);
        }
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

    $.each(["title", "description", "label_text", "digits", "max_label_length", "legend_text", "legend_rows"], function(key, value) {
        form.find(`input[name=${value}]`).val(form_data[value][0]);
    });


    update_report(form);

    return form;
}

function load_scatter(form_data) {
    let form = scatter_form($('#add_scatter'));

    form.find('.instrument-selector').val(form_data['instrument'][0]).change();

    form.find('.x-field').val(form_data['x'][0]).change();
    form.find('.y-field').val(form_data['y'][0]).change();

    if (form_data['line'])
        form.find('intput[name=line]').prop('checked', true);
    
    $.each(["title", "description"], function(key, value) {
        form.find(`input[name=${value}]`).val(form_data[value][0]);
    });

    update_report(form);

    return form;
}

function load_barplot() {

}

function load_map() {

}

function load_network() {

}