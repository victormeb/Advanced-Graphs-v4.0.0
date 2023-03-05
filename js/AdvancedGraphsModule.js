// Create a class that will be used to create a module for the dashboard editor
var AdvancedGraphsModule = function (module, dashboard, data_dictionary, report, instruments) {
    this.authors = 'Victor Esposita, Joel Cohen, David Cherry, and others';

    var module = module;
    var dashboard = dashboard;
    var data_dictionary = data_dictionary;
    var report = report;

    // insruments is an object with the following structure:
    // {
        // "repeating": [
            // {"form_name": "example_name",
            // "form_label": "Example Label",
            // "fields": ["example_field_1", "example_field_2"]},
            // {"form_name": "example_name_2",
            // "form_label": "Example Label 2",
            // "fields": ["example_field_1", "example_field_2"]}
        // ],
        // "non_repeating": ["example_field_1", "example_field_2"]
    // }
    var instruments = instruments;

    var AGM = this;

    // A dictionary containing graph types with their associated constructor functions
    var graphTypes = {
        // 'likert': LikertGraph,
        'bar': BarGraph//,
        // 'cross-bar': CrossBarGraph,
        // 'table': Table,
        // 'scatter': ScatterGraph,
        // 'map': MapGraph,
        // 'network': NetworkGraph
    };

    // The function used to load and populate the dashboard editor
    this.loadEditor = function (parent) {
        // Create a div to hold dashboard options and information
        var dashboardOptions = createDashboardOptions();

        // Add the div to the parent
        parent.append(dashboardOptions);

        // Create a div to hold the rows of the editor
        var table = createEditorTable();

        // Add the table to the parent
        parent.append(table);

        // Add a button that allows you to add more rows
        var addRowButton = createAddRowButton(table);

        // Add the button to the parent
        parent.append(addRowButton);

        // Add a container that holds the save and cancel buttons
        var buttonContainer = createEditorFinalButtons();

        // Add the container to the parent
        parent.append(buttonContainer);
    }

    // The function used to create the dashboard options div
    function createDashboardOptions() {
        // Create the div that will hold the dashboard options
        var dashboardOptions = document.createElement('div');

        // Create a table to hold the dashboard options
        var table = document.createElement('table');
        table.setAttribute('class', 'AG-dashboard-options');

        // Create a row to hold the dashboard title
        var titleRow = document.createElement('tr');

        // Create a cell to hold the dashboard title label
        var titleLabel = document.createElement('td');
        titleLabel.setAttribute('class', 'labelrc');
        titleLabel.innerHTML = 'Dashboard Title:';
        titleRow.appendChild(titleLabel);

        // Create a cell to hold the dashboard title input
        var titleInput = document.createElement('td');
        titleInput.setAttribute('class', 'labelrc');
        var titleInputBox = document.createElement('input');
        titleInputBox.setAttribute('type', 'text');
        titleInputBox.setAttribute('name', 'dash-title');

        // Set the value of the input box to the dashboard title
        titleInputBox.value = dashboard ? dashboard.title : 'New Dashboard';

        titleInput.appendChild(titleInputBox);
        titleRow.appendChild(titleInput);

        // Add the title row to the table
        table.appendChild(titleRow);


        // Create a row to hold the public toggle
        var publicRow = document.createElement('tr');

        // Create a cell to hold the public toggle label
        var publicLabel = document.createElement('td');
        publicLabel.setAttribute('class', 'labelrc');
        publicLabel.innerHTML = 'Public:';
        publicRow.appendChild(publicLabel);

        // Create a cell to hold the public toggle input
        var publicInput = document.createElement('td');
        publicInput.setAttribute('class', 'labelrc');

        // Create the public toggle input
        var publicToggleDiv = document.createElement('div');
        publicToggleDiv.setAttribute('class', 'custom-control custom-switch mt-2');
        var publicToggleInput = document.createElement('input');
        publicToggleInput.setAttribute('type', 'checkbox');
        publicToggleInput.setAttribute('class', 'custom-control-input');
        publicToggleInput.setAttribute('name', 'is_public');
        publicToggleInput.setAttribute('id', 'is_public');
        publicToggleInput.checked = dashboard ? dashboard.is_public : false;
        publicToggleDiv.appendChild(publicToggleInput);
        var publicToggleLabel = document.createElement('label');
        publicToggleLabel.setAttribute('class', 'custom-control-label');
        publicToggleLabel.setAttribute('for', 'is_public');
        publicToggleLabel.innerHTML = module.tt('is_public_description');
        publicToggleDiv.appendChild(publicToggleLabel);
        publicInput.appendChild(publicToggleDiv);
        publicRow.appendChild(publicInput);

        // Add the public row to the table
        table.appendChild(publicRow);

        // Add the table to the dashboard options div
        dashboardOptions.appendChild(table);

        // Return the dashboard options div
        return dashboardOptions;

    }

    // The function used to create the editor table
    function createEditorTable() {
        // Create a div to hold the rows of the editor
        var tableDiv = document.createElement('div');
        tableDiv.setAttribute('class', 'AG-editor-table');

        // If the dashboard is null, return the table div
        if (!dashboard) {
            return tableDiv;
        }

        return tableDiv;

    }

    // The function used to create the add row button
    function createAddRowButton(table) {
        // Create a div to hold the add row button
        var addRowButtonDiv = document.createElement('div');
        addRowButtonDiv.setAttribute('class', 'AG-add-row-button');

        // Create the add row button
        var addRowButton = document.createElement('button');
        addRowButton.setAttribute('class', 'btn btn-primary');
        addRowButton.innerHTML = module.tt('add_row');

        // Add the click event to the add row button
        addRowButton.addEventListener('click', function () {
            // Create a new row
            var newRow = createRow();

            // Add the new row to the table
            table.appendChild(newRow);
        });

        // Add the add row button to the div
        addRowButtonDiv.appendChild(addRowButton);

        // Return the div
        return addRowButtonDiv;
    }

    // The function used to create the final buttons container
    function createEditorFinalButtons() {
        // Create a div to hold the final buttons
        var buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('class', 'AG-editor-final-buttons');

        // Create the save button
        var saveButton = document.createElement('button');
        saveButton.setAttribute('class', 'btn btn-primary');

        // Set the text of the save button
        saveButton.innerHTML = dashboard ? module.tt('save') : module.tt('create');

        // Add the click event to the save button
        saveButton.addEventListener('click', function () {
            // do nothing
        });

        // Add the save button to the container
        buttonContainer.appendChild(saveButton);


        // Create the cancel button
        var cancelButton = document.createElement('button');
        cancelButton.setAttribute('class', 'btn btn-secondary');

        // Set the text of the cancel button
        cancelButton.innerHTML = module.tt('cancel');

        // Add the click event to the cancel button
        cancelButton.addEventListener('click', function () {
            // do nothing
        });

        // Add the cancel button to the container
        buttonContainer.appendChild(cancelButton);

        // Return the container
        return buttonContainer;

    }

    // The function used to create a row
    function createRow(row = null) {
        // Create a div to hold the row
        var rowDiv = document.createElement('div');
        rowDiv.setAttribute('class', 'AG-editor-row');

        // Create a div to hold the add cell button
        var addCellButtonDiv = document.createElement('div');
        addCellButtonDiv.setAttribute('class', 'AG-add-cell-button');

        // Create a div to hold the cells
        var cellsDiv = document.createElement('div');
        cellsDiv.setAttribute('class', 'AG-editor-row-cells');

        // Create the add cell button
        var addCellButton = document.createElement('button');
        addCellButton.setAttribute('class', 'btn btn-primary');
        addCellButton.innerHTML = '+';

        // Add the click event to the add cell button
        addCellButton.addEventListener('click', function () {
            // Create a new cell
            var newCell = createCell();

            // Add the new cell to the row
            cellsDiv.appendChild(newCell);
        });

        // Add the add cell button to the div
        addCellButtonDiv.appendChild(addCellButton);

        // Create a div to hold the row buttons
        var rowButtonsDiv = document.createElement('div');
        rowButtonsDiv.setAttribute('class', 'AG-editor-row-buttons');

        // Create the move row up button
        var moveRowUpButton = document.createElement('button');
        moveRowUpButton.setAttribute('class', 'btn btn-primary');
        moveRowUpButton.innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';

        // Add the click event to the move row up button
        moveRowUpButton.addEventListener('click', function () {
            // if the row is the first row, return
            if (rowDiv.previousElementSibling === null) {
                return;
            }

            // Move the row up
            rowDiv.parentNode.insertBefore(rowDiv, rowDiv.previousElementSibling);
        });

        // Add the move row up button to the div
        rowButtonsDiv.appendChild(moveRowUpButton);

        // Create the move row down button
        var moveRowDownButton = document.createElement('button');
        moveRowDownButton.setAttribute('class', 'btn btn-primary');
        moveRowDownButton.innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';

        // Add the click event to the move row down button
        moveRowDownButton.addEventListener('click', function () {
            // if the row is the last row, return
            if (rowDiv.nextElementSibling === null) {
                return;
            }

            // Move the row down
            rowDiv.parentNode.insertBefore(rowDiv.nextElementSibling, rowDiv);
        });

        // Add the move row down button to the div
        rowButtonsDiv.appendChild(moveRowDownButton);

        // Create the delete row button
        var deleteRowButton = document.createElement('button');
        deleteRowButton.setAttribute('class', 'btn btn-danger');
        deleteRowButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

        // Add the click event to the delete row button
        deleteRowButton.addEventListener('click', function () {
            // Create the callback function that deletes the row
            var callback = function () {
                // Remove the row
                rowDiv.parentNode.removeChild(rowDiv);
            };

            // Create the modal
            var modal = createConfirmDialog(callback, module.tt('remove_row_confirm'));
        
            // Add the modal to the body
            document.body.appendChild(modal);
        });

        // Add the delete row button to the div
        rowButtonsDiv.appendChild(deleteRowButton);

        // Add the add cell button div to the row div
        rowDiv.appendChild(addCellButtonDiv);

        // Add the cells div to the row div
        rowDiv.appendChild(cellsDiv);

        // Add the row buttons div to the row div
        rowDiv.appendChild(rowButtonsDiv);

        // If the row is null, return the row div
        if (!row) {
            return rowDiv;
        }

        // Todo: Add the cells to the row
        return rowDiv;
    }

    // The function used to create a cell
    function createCell(cell = null) {
        // Create a div to hold the cell
        var cellDiv = document.createElement('div');
        cellDiv.setAttribute('class', 'AG-editor-cell');


        // Create a div to hold the cell buttons and graph type selector
        var cellButtonsDiv = document.createElement('div');
        cellButtonsDiv.setAttribute('class', 'AG-editor-cell-buttons');

        // Create the move cell left button
        var moveCellLeftButton = document.createElement('button');
        moveCellLeftButton.setAttribute('class', 'btn btn-primary');
        moveCellLeftButton.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true"></i>';

        // Add the click event to the move cell left button
        moveCellLeftButton.addEventListener('click', function () {
            // if the cell is the first cell, return
            if (cellDiv.previousElementSibling === null) {
                return;
            }
            
            // Move the cell left
            cellDiv.parentNode.insertBefore(cellDiv, cellDiv.previousElementSibling);
        });

        // Add the move cell left button to the div
        cellButtonsDiv.appendChild(moveCellLeftButton);

        // Create a div to hold the graph form
        var graphFormDiv = document.createElement('div');
        graphFormDiv.setAttribute('class', 'AG-editor-graph-form');

        // Create a callback function to create the graph form from the selected graph type
        function createGraphFormFromSelectedGraphType(graphType) {
            // Remove the current graph form
            graphFormDiv.innerHTML = '';

            // Create a new graphType object from the graph type
            var graphTypeObject = new AGM.module.graphTypes[graphType]();

            // Get the graph form from the graph type object
            var graphForm = graphTypeObject.getForm();

            // Add the graph form to the graph form div
            graphFormDiv.appendChild(graphForm);
        }

        // Create the graph type selector
        var graphTypeSelector = createGraphTypeSelector(createGraphFormFromSelectedGraphType);

        // Add the graph type selector to the graph form div
        graphFormDiv.appendChild(graphTypeSelector);

        // Create the move cell right button
        var moveCellRightButton = document.createElement('button');
        moveCellRightButton.setAttribute('class', 'btn btn-primary');
        moveCellRightButton.innerHTML = '<i class="fa fa-arrow-right" aria-hidden="true"></i>';

        // Add the click event to the move cell right button
        moveCellRightButton.addEventListener('click', function () {
            // if the cell is the last cell, return
            if (cellDiv.nextElementSibling === null) {
                return;
            }

            // Move the cell right
            cellDiv.parentNode.insertBefore(cellDiv.nextElementSibling, cellDiv);
        });

        // Add the move cell right button to the div
        cellButtonsDiv.appendChild(moveCellRightButton);

        // Create the delete cell button
        var deleteCellButton = document.createElement('button');
        deleteCellButton.setAttribute('class', 'btn btn-danger');
        deleteCellButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

        // Add the click event to the delete cell button
        deleteCellButton.addEventListener('click', function () {
            // Create the callback function that deletes the cell
            var callback = function () {
                // Remove the cell
                cellDiv.parentNode.removeChild(cellDiv);
            }

            // Create the modal
            var modal = createConfirmDialog(callback, module.tt('remove_cell_confirm'));

            // Add the modal to the document
            document.body.appendChild(modal);
        });

        // Add the delete cell button to the div
        cellButtonsDiv.appendChild(deleteCellButton);

        // Add the cell buttons div to the cell div
        cellDiv.appendChild(cellButtonsDiv);

        // Add the graph form div to the cell div
        cellDiv.appendChild(graphFormDiv);

        // If the cell is null, return the cell div
        if (!cell) {
            return cellDiv;
        }

        // Todo: Fill the cell with the cell data
    }

    // Create a graph type selector
    function createGraphTypeSelector(callback) {
        // Create a div to hold the graph type selector
        var graphTypeSelectorDiv = document.createElement('div');
        graphTypeSelectorDiv.setAttribute('class', 'AG-editor-graph-type-selector');

        // Create a select element to hold the graph types
        var graphTypeSelector = document.createElement('select');

        // Set the graph type selector attributes
        graphTypeSelector.setAttribute('class', 'form-control');
        graphTypeSelector.setAttribute('name', 'type');

        // Create a select a graph type option
        var selectAGraphTypeOption = document.createElement('option');
        selectAGraphTypeOption.setAttribute('value', '');
        selectAGraphTypeOption.setAttribute('disabled', 'disabled');
        selectAGraphTypeOption.setAttribute('selected', 'selected');
        selectAGraphTypeOption.innerHTML = AGM.module.tt('select_graph_type');

        // Add the select a graph type option to the graph type selector
        graphTypeSelector.appendChild(selectAGraphTypeOption);


        // Add the graph types to the graph type selector
        for (var graphType in AGM.graphTypes) {
            // If the graph type cannot be created for any instrument, skip it
            if (!AGM.graphTypes[graphType]().hasValidInstruments)
                continue;

            // Create an option element for the graph type
            var option = document.createElement('option');
            option.setAttribute('value', graphType);
            option.innerHTML = AGM.graphTypes[graphType]().label;

            // Add the option to the graph type selector
            graphTypeSelector.appendChild(option);
        }

        // Add the change event to the graph type selector
        graphTypeSelector.addEventListener('change', function () {
            callback(this.value);
        });

        // Add the graph type selector to the graph type selector div
        graphTypeSelectorDiv.appendChild(graphTypeSelector);

        // Return the graph type selector div
        return graphTypeSelectorDiv;
    }


    // Create a modal dialog
    function createModalDialog(title, content, buttons) {
        // Create a div to hold the modal dialog
        var modalDialogDiv = document.createElement('div');
        modalDialogDiv.setAttribute('class', 'AG-editor-modal-dialog');

        // Create a div to hold the modal dialog content
        var modalDialogContentDiv = document.createElement('div');
        modalDialogContentDiv.setAttribute('class', 'AG-editor-modal-dialog-content');

        // Create a div to hold the modal dialog title
        var modalDialogTitleDiv = document.createElement('div');
        modalDialogTitleDiv.setAttribute('class', 'AG-editor-modal-dialog-title');
        modalDialogTitleDiv.innerHTML = title;

        // Create a modal dialogue body div
        var modalDialogBodyDiv = document.createElement('div');
        modalDialogBodyDiv.setAttribute('class', 'AG-editor-modal-dialog-body');

        // Add the content to the modal dialog body div
        modalDialogBodyDiv.appendChild(content);

        // Create a modal dialogue footer div
        var modalDialogFooterDiv = document.createElement('div');
        modalDialogFooterDiv.setAttribute('class', 'AG-editor-modal-dialog-footer');

        // Create a modal dialog button
        var modalDialogButton = function (label, className, callback) {
            // Create a button element
            var button = document.createElement('button');
            button.setAttribute('class', className);
            button.innerHTML = label;

            // Add the click event to the button
            button.addEventListener('click', callback);

            // Return the button
            return button;
        };

        // Add the buttons to the modal dialog footer div
        for (var i = 0; i < buttons.length; i++) {
            modalDialogFooterDiv.appendChild(modalDialogButton(buttons[i].label, buttons[i].className, buttons[i].callback));
        }

        // Add the modal dialog title div to the modal dialog content div
        modalDialogContentDiv.appendChild(modalDialogTitleDiv);

        // Add the modal dialog body div to the modal dialog content div
        modalDialogContentDiv.appendChild(modalDialogBodyDiv);

        // Add the modal dialog footer div to the modal dialog content div
        modalDialogContentDiv.appendChild(modalDialogFooterDiv);

        // Add the modal dialog content div to the modal dialog div
        modalDialogDiv.appendChild(modalDialogContentDiv);

        // Return the modal dialog div
        return modalDialogDiv;
    }

    // Create a modal dialog that confirms a user's action
    function createConfirmDialog(action, content) {
        // Create the buttons
        var buttons = [
            {
                label: AGM.module.tt('cancel'),
                className: 'btn btn-default',
                callback: function () {
                    AGM.closeModalDialog();
                }
            },
            {
                label: AGM.module.tt('confirm'),
                className: 'btn btn-primary',
                callback: function () {
                    AGM.closeModalDialog();
                    action();
                }
            }];

        // Create the modal dialog
        var modalDialog = createModalDialog(AGM.module.tt('are_you_sure'), content, buttons);
    }

    // Create a function that closes the modal dialog
    function closeModalDialog() {
        // Get the modal dialog div
        var modalDialogDiv = document.querySelector('.AG-editor-modal-dialog');

        // Remove the modal dialog div
        modalDialogDiv.parentNode.removeChild(modalDialogDiv);
    }

    // The AdvancedGraph class
    function AdvancedGraph(graphType, graphLabel, getForm, getGraph, canCreate) {
        // The name of the graph type
        this.name = graphType;

        // The label of the graph type
        this.label = graphLabel;

        // The function used to get the form
        this.getForm = getForm;

        // The function used to get the graph
        this.getGraph = getGraph;

        // The function used to check if the graph can be created given an instrument
        this.canCreate = canCreate;

        // A function that returns all the instruments that can create this graph
        this.validInstruments = function () {
            var instruments = AGM.getInstrumentList();
            var validInstruments = [];

            for (var i = 0; i < instruments.length; i++) {
                if (this.canCreate(instruments[i])) {
                    validInstruments.push(instruments[i]);
                }
            }

            return validInstruments;
        };

        // A function that returns true if there is at least one valid instrument
        this.hasValidInstruments = function () {
            return this.validInstruments().length > 0;
        };

        // Create an instrument selector constructor given a callback function
        this.instrumentSelector = function (callback) {
            // Create a div to hold the instrument selector
            var instrumentSelectorDiv = document.createElement('div');
            instrumentSelectorDiv.setAttribute('class', 'AG-editor-instrument-selector');

            // Create a label for the instrument selector
            var instrumentSelectorLabel = document.createElement('label');
            instrumentSelectorLabel.innerHTML = AGM.module.tt('instrument_selector_label');

            // Create a select element for the instrument selector
            var instrumentSelectorSelect = document.createElement('select');
            instrumentSelectorSelect.setAttribute('class', 'form-control');

            // Create an option element for the instrument selector
            var instrumentSelectorOption = document.createElement('option');
            instrumentSelectorOption.setAttribute('value', '');
            instrumentSelectorOption.setAttribute('disabled', 'disabled');
            instrumentSelectorOption.setAttribute('selected', 'selected');
            instrumentSelectorOption.innerHTML = AGM.module.tt('select_an_instrument');

            // Add the option element to the select element
            instrumentSelectorSelect.appendChild(instrumentSelectorOption);

            // Get the valid instruments
            var validInstruments = this.validInstruments();

            // Add the valid instruments to the select element
            for (var i = 0; i < validInstruments.length; i++) {
                // Create an option element for the instrument selector
                var instrumentSelectorOption = document.createElement('option');
                instrumentSelectorOption.setAttribute('value', validInstruments[i].form_name);
                instrumentSelectorOption.innerHTML = validInstruments[i].form_label;

                // Add the option element to the select element
                instrumentSelectorSelect.appendChild(instrumentSelectorOption);
            }

            // Add the change event to the select element
            instrumentSelectorSelect.addEventListener('change', function () {
                // Call the callback function
                callback(AGM.getInstrumentFields(this.value));
            });

            // Add the label to the div
            instrumentSelectorDiv.appendChild(instrumentSelectorLabel);

            // Add the select element to the div
            instrumentSelectorDiv.appendChild(instrumentSelectorSelect);

            // Return the div
            return instrumentSelectorDiv;
        };
    }

    // A function constructor for the BarGraph class
    function BarGraph() {
        var type = "bar";
        var label = AGM.module.tt('graph_type_bar');

        // The function used to get the form
        var getForm = function (parameters = null) {
            // Create a div to hold the form
            var formDiv = document.createElement('div');
            formDiv.setAttribute('class', 'AG-editor-form');

            // Create a div the hold the graph parameters
            var graphParametersDiv = document.createElement('div');
            graphParametersDiv.setAttribute('class', 'AG-editor-graph-parameters');

            // Create a callback function for the instrument selector
            var callback = function (fields) {
                // Get the categorical fields from AGM
                var categoricalFields = AGM.getCategoricalFields(fields);

                // Get the numeric fields from AGM
                var numericFields = AGM.getNumericFields(fields);

                // Add hi to the graph parameters div
                graphParametersDiv.innerHTML = 'hi';
            };
        };

        // The function used to get the graph
        var getGraph = function (parameters) {
            // return an empty div
            return document.createElement('div');
        };

        // The function used to check if the graph can be created given an instrument
        var canCreate = function (instrument) {
            return true;
        };

        // Call the AdvancedGraph constructor
        AdvancedGraph.call(this, type, label, getForm, getGraph, canCreate);


    }

    // A function that gets the radio type fields from the fields (each field is a data dictionary entry)
    function getRadioFields(fields) {
        var radio_field_types = ['radio', 'dropdown', 'yesno', 'truefalse'];
        var radioFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (radio_field_types.includes(fields[i].field_type)) {
                radioFields.push(fields[i]);
            }
        }

        return radioFields;
    }

    // A function that returns the checkbox type fields from the fields (each field is a data dictionary entry)
    function getCheckboxFields(fields) {
        var checkbox_field_types = ['checkbox'];
        var checkboxFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (checkbox_field_types.includes(fields[i].field_type)) {
                checkboxFields.push(fields[i]);
            }
        }

        return checkboxFields;
    }

    // A function that returns a dictionary of the categorical fields from the fields (each field is a data dictionary entry)
    function getCategoricalFields(fields) {
        var categoricalFields = {
            radio: getRadioFields(fields),
            checkbox: getCheckboxFields(fields)
        };

        return categoricalFields;
    }

    // A function that returns the numeric fields from the fields (each field is a data dictionary entry)
    function getNumericFields(fields) {
        var non_numeric_field_names = ['record_id', 'redcap_event_name', 'redcap_repeat_instrument', 'redcap_repeat_instance', 'longitude', 'longitud', 'Longitude', 'Longitud', 'latitude', 'latitud', 'Latitude', 'Latitud'];
        var numeric_field_text_validation_types = ['number', 'integer', 'float', 'decimal'];

        var numericFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (!non_numeric_field_names.some(v => field[i].field_name.includes(v)) && (
                (field[i].field_type == 'text' && numeric_field_text_validation_types.includes(instrument[field]['text_validation_type_or_show_slider_number']))
                || field[i]['field_type'] == 'calc')) {
                    numericFields.push(fields[i]);
                }
        }

        return numericFields;

    }

};
