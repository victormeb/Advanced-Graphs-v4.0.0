// Utils.js

// A function that gets the text from an HTML string 
export function stripHtml(html)
{
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

// A function that parses a fields select_choices_or_calculations string into an object
export function parseChoicesOrCalculations(field) {
    // If the field is not a radio field, return an empty object
    if (!isRadioField(field) && !isCheckboxField(field)) {
        return {};
    }

    // Get the choices or calculations string
    var choices_or_calculations = field.select_choices_or_calculations;

    // If the choices or calculations string is empty, return an empty array
    if (choices_or_calculations === '') {
        if (field.field_type === 'yesno')
        {
            return {0: 'No', 1: 'Yes'};
        }
        if (field.field_type === 'yesno')
        {
            return {0: 'False', 1: 'True'};
        }
      /*  if (field.field_type === 'yesno') {
            return {
                '0': module.tt('no_val'),
                '1': module.tt('yes_val')
            }
        }

        if (field.field_type === 'truefalse') {
            return {
                '0': module.tt('false_val'),
                '1': module.tt('true_val')
            }
        } */

        return {};
    }
    // If the choices or calculations string is not empty, return the parsed choices or calculations
    return stripChoicesOrCalculations(choices_or_calculations);
}

export function stripChoicesOrCalculations(choiceString) {
    // Split the choices or calculations string by |
    var choices_or_calculations_array = choiceString.split('|');

    // Create an array to hold the parsed choices or calculations
    var parsed_choices_or_calculations = {};

    // Parse the choices or calculations
    for (var i = 0; i < choices_or_calculations_array.length; i++) {
        // Split the choice or calculation by ,
        var choice_or_calculation = choices_or_calculations_array[i].split(',');
        var choice_or_calculation_value = choice_or_calculation[0];
        var choice_or_calculation_label = choice_or_calculation[1];

        // remove the leading and trailing spaces from the value and label
        choice_or_calculation_value = choice_or_calculation_value.trim();
        choice_or_calculation_label = stripHtml(choice_or_calculation_label.trim());

        // Add the parsed choice or calculation to the array
        parsed_choices_or_calculations[choice_or_calculation_value] = choice_or_calculation_label;
    }

    return parsed_choices_or_calculations;
}

// A function that returns whether or not a field is a radio field
export function isRadioField(field) {
    var radio_field_types = ['radio', 'dropdown', 'yesno', 'truefalse'];

    // Return whether or not the field is a radio field
    return radio_field_types.includes(field.field_type);
}

// A function that returns whether or not a field is a checkbox field
export function isCheckboxField(field) {
    var checkbox_field_types = ['checkbox'];

    // Return whether or not the field is a checkbox field
    return checkbox_field_types.includes(field.field_type);
}

// A function that returns whether or not a field is a categorical field
export function isCategoricalField(field) {
    return isRadioField(field) || isCheckboxField(field);
}

// A function that returns whether or not a field is a numeric field
export function isNumericField(field) {
    var non_numeric_field_names = ['record_id', 'redcap_event_name', 'redcap_repeat_instrument', 'redcap_repeat_instance', 'longitude', 'longitud', 'Longitude', 'Longitud', 'latitude', 'latitud', 'Latitude', 'Latitud'];
    var numeric_field_text_validation_types = ['number', 'integer', 'float', 'decimal'];

    return !non_numeric_field_names.some(v => field.field_name.includes(v)) && (
        (field.field_type == 'text' && numeric_field_text_validation_types.includes(field['text_validation_type_or_show_slider_number']))
        || field['field_type'] == 'calc');
}

export function isTextField(field) {
    return field.field_type == 'text';
}

export function isDateField(field) {
    return field.field_type == 'text' 
    // And the first 4 characters of the text_validation_type_or_show_slider_number is date
    && field.text_validation_type_or_show_slider_number.substring(0, 4) == 'date';
}


export function instrumentCanCreate(instrument, validationFunction) {
    return validationFunction(instrument);
}

export function getRadioFields(fields) {
    return fields.filter(isRadioField);
}

export function getCheckboxFields(fields) {
    return fields.filter(isCheckboxField);
}

export function getNumericFields(fields) {
    return fields.filter(isNumericField);
}

export function getTextFields(fields) {
    return fields.filter(isTextField);
}

export function getDateFields(fields) {
    return fields.filter(isDateField);
}

export function getCoordinateFields(fields) {
    const longitude_keywords = ['longitude', 'longitud', 'Longitude', 'Longitud'];
    const latitude_keywords = ['latitude', 'latitud', 'Latitude', 'Latitud'];

    var coordinate_fields = {};

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        var is_longitude = longitude_keywords.some(v => field.field_name.includes(v));

        if (is_longitude) {
            var stripped_name = field.field_name.replace(longitude_keywords.find(v => field.field_name.includes(v)), '');

            var matching_latitude_field = fields.find(v => v.field_name.includes(stripped_name) && latitude_keywords.some(b => v.field_name.includes(b)));

            if (!matching_latitude_field) {
                continue;
            }

            coordinate_fields[stripped_name] = {
                'longitude': field,
                'latitude': matching_latitude_field
            };
        }
    }

    return coordinate_fields;
}

// A function that takes a checkbox field name and returns a report that has been transformed into a longer format
export function getCheckboxReport(report, checkbox_field) {
    // If the field is not a checkbox field, return the report
    if (!isCheckboxField(checkbox_field)) {
        return report;
    }

    var checkbox_fields = Object.keys(report[0]).filter(function (field) {
        // The field matches regex `checkbox_field_name___[0-9]+\b`
        return field.match(new RegExp('^' + checkbox_field.field_name + '___[0-9]+\\b'));
    });

    var longer_report = report.flatMap(function (row) {
        var new_rows = [];

        for (var i = 0; i < checkbox_fields.length; i++) {
            // Get the numerical portion of the checkbox field name
            var checkbox_field_name = checkbox_fields[i];
            var checkbox_field_name_number = checkbox_field_name.split('___')[1];

            // Get the checkbox field value
            var checkbox_field_value = row[checkbox_field_name];

            // If the checkbox field is checked, add a new row to the report
            if (checkbox_field_value === '1') {
                var new_row = Object.assign({}, row);

                // Remove all the checkbox fields from the new row
                for (var j = 0; j < checkbox_fields.length; j++) {
                    delete new_row[checkbox_fields[j]];
                }

                // Add the checkbox field value to the new row
                new_row[checkbox_field_name] = checkbox_field_name_number;

                // Add the new row to the new rows
                new_rows.push(new_row);
            }
        }

        return new_rows;
    });

    return longer_report;
}

export function getFieldLabel (field) {
    return field.field_label;
}

// A function that wraps a string given a max width
export function wrapString(str, maxWidth) {
    var newLineStr = "\n";
    var res = '';
    while (str.length > maxWidth) {
        var found = false;
        // Inserts new line at first whitespace of the line
        for (var i = maxWidth - 1; i >= 0; i--) {
            if (" \n\r\t".includes(str.charAt(i))) {
                res = res + [str.slice(0, i), newLineStr].join('');
                str = str.slice(i + 1);
                found = true;
                break;
            }
        }
        // Inserts new line at maxWidth position, the word is too long to wrap
        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }
    }
    return res + str;
}

// A function that truncates a string given a max width
export function truncateString(str, maxWidth) {
    if (str.length > maxWidth) {
        return str.slice(0, maxWidth - 3) + '...';
    } else {
        return str;
    }
}

let uuid = 0;
export function getUuid() {
    return uuid++;
}