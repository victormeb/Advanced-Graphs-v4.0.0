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
    var instrumentList = createInstrumentList();
    var instrumentDictionary = createInstrumentDictionary();

    var AGM = this;

    // A dictionary containing graph types with their associated constructor functions
    var graphTypes = {
        // 'likert': LikertGraph,
        'bar': new BarGraph()//,
        // 'cross-bar': CrossBarGraph,
        // 'table': Table,
        // 'scatter': ScatterGraph,
        // 'map': MapGraph,
        // 'network': NetworkGraph
    };

    var aggregationFunctions = {
        'count': {'label': module.tt('count'), 'd3_function': d3.count},
        'sum': {'label': module.tt('sum'), 'd3_function': d3.sum},
        'mean': {'label': module.tt('mean'), 'd3_function': d3.mean},
        'median': {'label': module.tt('median'), 'd3_function': d3.median},
        'min': {'label': module.tt('min'), 'd3_function': d3.min},
        'max': {'label': module.tt('max'), 'd3_function': d3.max}
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
        titleInputBox.value = dashboard.title ? dashboard.title : module.tt('new_dashboard');

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

            // Add the new cell to the beginning of the cells div
            cellsDiv.insertBefore(newCell, cellsDiv.firstChild);
        });

        // Add the add cell button to the div
        addCellButtonDiv.appendChild(addCellButton);

        // Create a div to hold the row buttons
        var rowButtonsDiv = document.createElement('div');
        rowButtonsDiv.setAttribute('class', 'AG-editor-row-buttons');

        // Create the move row up button
        var moveRowUpButton = document.createElement('button');
        moveRowUpButton.setAttribute('class', 'btn AG-editor-row-button-up');
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
        moveRowDownButton.setAttribute('class', 'btn AG-editor-row-button-down');
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
        deleteRowButton.setAttribute('class', 'btn AG-editor-row-button-delete');
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
        graphFormDiv.setAttribute('class', 'AG-editor-graph-container');

        // Create a callback function to create the graph form from the selected graph type
        function createGraphFormFromSelectedGraphType(graphType) {
            // Remove the current graph form
            graphFormDiv.innerHTML = '';

            // Create a new graphType object from the graph type
            var graphTypeObject = graphTypes[graphType];

            // Get the graph form from the graph type object
            var graphForm = graphTypeObject.generateForm();

            // Add the graph form to the graph form div
            graphFormDiv.appendChild(graphForm);
        }

        // Create the graph type selector
        var graphTypeSelector = createGraphTypeSelector(createGraphFormFromSelectedGraphType);

        // Add the graph type selector to the graph form div
        cellButtonsDiv.appendChild(graphTypeSelector);

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

        // Create a button that adds a new cell to the right of the current cell
        var addCellRightButton = document.createElement('button');
        addCellRightButton.setAttribute('class', 'btn btn-success AG-editor-cell-button-add-right');
        addCellRightButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

        // Add the click event to the add cell right button
        addCellRightButton.addEventListener('click', function () {
            // Create a new cell
            var newCell = createCell();

            // Add the new cell to the right of the current cell
            cellDiv.parentNode.insertBefore(newCell, cellDiv.nextElementSibling);
        });

        // Add the add cell right button to the div
        cellButtonsDiv.appendChild(addCellRightButton);

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
        selectAGraphTypeOption.innerHTML = module.tt('select_graph_type');

        // Add the select a graph type option to the graph type selector
        graphTypeSelector.appendChild(selectAGraphTypeOption);


        // Add the graph types to the graph type selector
        for (var graphType in graphTypes) {
            // If the graph type cannot be created for any instrument, skip it
            if (!graphTypes[graphType].canCreate)
                continue;

            // Create an option element for the graph type
            var option = document.createElement('option');
            option.setAttribute('value', graphType);
            option.innerHTML = graphTypes[graphType].label;

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

        // Create a close button
        var closeButton = document.createElement('button');
        closeButton.setAttribute('class', 'AG-editor-modal-dialog-close');
        closeButton.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';

        // Add the click event to the close button
        closeButton.addEventListener('click', function () {
            // Remove the modal dialog
            modalDialogDiv.parentNode.removeChild(modalDialogDiv);
        });

        // Add the close button to the modal dialog title div
        modalDialogTitleDiv.appendChild(closeButton);

        // Create a modal dialogue body div
        var modalDialogBodyDiv = document.createElement('div');
        modalDialogBodyDiv.setAttribute('class', 'AG-editor-modal-dialog-body');

        // Check whether content is a string or an element
        if (typeof content === 'string') {
            // Make content a text node
            content = document.createTextNode(content);
        }

        // Add the content to the modal dialog body div
        modalDialogBodyDiv.appendChild(content);

        // Create a modal dialogue footer div
        var modalDialogFooterDiv = document.createElement('div');
        modalDialogFooterDiv.setAttribute('class', 'AG-editor-modal-dialog-footer');

        // Create a modal dialog button
        var modalDialogButton = function (label, className, callback) {
            // Create a button element
            var button = document.createElement('button');
            button.type = 'button';
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
                label: module.tt('cancel'),
                className: 'AG-editor-modal-dialog-cancel-button',
                callback: function () {
                    closeModalDialog();
                }
            },
            {
                label: module.tt('confirm'),
                className: 'AG-editor-modal-dialog-confirm-button',
                callback: function () {
                    closeModalDialog();
                    action();
                }
            }];

        // Return the modal dialog
        return createModalDialog(module.tt('are_you_sure'), content, buttons);
    }

    function createHelpDialogue(title, content) {
        var buttons = [
            {
                label: module.tt('close'),
                className: 'AG-editor-modal-dialog-cancel-button',
                callback: function () {
                    closeModalDialog();
                }
            }
        ]

        return createModalDialog(title, content, buttons);
    }

    // Create a function that closes the modal dialog
    function closeModalDialog() {
        // Get the modal dialog div
        var modalDialogDiv = document.querySelector('.AG-editor-modal-dialog');

        // Remove the modal dialog div
        modalDialogDiv.parentNode.removeChild(modalDialogDiv);
    }

    // Create a function that creates a div that contains a parameter for a graph
    function createParameterDiv(parameterElement, label, help = null) {
        // Create a div to hold the parameter
        var parameterDiv = document.createElement('div');
        parameterDiv.setAttribute('class', 'AG-editor-parameter');

        // Create a label for the parameter
        var parameterLabel = document.createElement('label');
        parameterLabel.setAttribute('class', 'AG-editor-parameter-label');
        parameterLabel.innerHTML = label;

        // Add the parameter label to the parameter div
        parameterDiv.appendChild(parameterLabel);

        // Add the parameter element to the parameter div
        parameterDiv.appendChild(parameterElement);

        // Add the help button to the label if help is provided
        if (help) {
            // Create a help button
            var helpButton = createHelpButton(help);

            // Add the help button to the parameter label
            parameterLabel.appendChild(helpButton);
        }

        // Return the parameter div
        return parameterDiv;
    }

    // Create a function that creates a help button
    // Parameters:
    //  help: An object containing the keys for the help title and content
    //    help = {
    //      title: 'help_title',
    //      content: 'help_content'
    //    }
    function createHelpButton(help) {
        // Create a help button
        var helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.setAttribute('class', 'AG-editor-help-button');
        helpButton.innerHTML = '<i class="fa fa-question-circle" aria-hidden="true"></i>';

        // Add the click event to the help button
        helpButton.addEventListener('click', function () {
            // Create the help dialogue
            var helpDialogue = createHelpDialogue(help['title'], help['content']);

            // Add the help dialogue to the page
            document.body.appendChild(helpDialogue);
        });

        // Return the help button
        return helpButton;
    }


    // A function that takes an object and creates a select element from it with option groups where necessary
    // Parameters:
    //  fieldObject: The object to create the select element from
    //    The object should be in on of the following formats:
    //      {
    //          'option group 1': [{field_name: "field_1", field_label: "Field 1", ...}, {field_name: "field_2", field_label: "Field 2", ...}, ...],
    //          'option group 2': [{field_name: "field_3", field_label: "Field 3", ...}, {field_name: "field_4", field_label: "Field 4", ...}, ...]
    //      }
    //      or
    //      [
    //         {
    //             'option group 1': [{field_name: "field_1", field_label: "Field 1", ...}, {field_name: "field_2", field_label: "Field 2", ...}, ...],
    //             'option group 2': [{field_name: "field_3", field_label: "Field 3", ...}, {field_name: "field_4", field_label: "Field 4", ...}, ...]
    //         },
    //         [{field_name: "field_5", field_label: "Field 5", ...}, {field_name: "field_6", field_label: "Field 6", ...}, ...}]
    //      ]
    //      or
    //      [{field_name: "field_1", field_label: "Field 1", ...}, {field_name: "field_2", field_label: "Field 2", ...}, ...]
    //  name: The name of the select element
    //  label: The label of the select element
    //  defaultOption: The default option of the select element, should be a DOM element
    function createFieldSelector(fieldObject, name, defaultOption = null) {
        // Create a select element
        var select = document.createElement('select');

        // Set the select element attributes
        select.setAttribute('class', 'form-control');
        select.setAttribute('name', name);

        // If there is a default option, add it to the select element
        if (defaultOption !== null) {
            // Add the default option to the select element
            select.appendChild(defaultOption);
        }

        function createFieldOption(field) {
            // Create an option element
            var option = document.createElement('option');

            // Set the option element attributes
            option.setAttribute('value', field.field_name);
            option.innerHTML = field.field_label;

            return option;
        }

        function addOptionRecurse(fieldObject, parentElement) {
            // Base case
            // fieldObject in an object and has the field_name and field_label properties
            if (typeof fieldObject === 'object' && fieldObject.hasOwnProperty('field_name') && fieldObject.hasOwnProperty('field_label')) {
                // Create an option element
                var option = createFieldOption(fieldObject);

                // Add the option to the parent element
                parentElement.appendChild(option);

                // Return
                return parentElement;
            }

            // Case 1
            // fieldObject is an array
            if (Array.isArray(fieldObject)) {
                // Loop through the array
                for (var i = 0; i < fieldObject.length; i++) {
                    // Recurse
                    addOptionRecurse(fieldObject[i], parentElement);
                }

                // Return
                return parentElement;
            }

            // Case 2
            // fieldObject is an object
            if (typeof fieldObject === 'object') {
                // Loop through the object
                for (var key in fieldObject) {
                    // Create an optgroup element
                    var optgroup = document.createElement('optgroup');
                    optgroup.setAttribute('label', module.tt(key));
                    optgroup.setAttribute('data-group', key);

                    // Add the optgroup to the parent element
                    parentElement.appendChild(optgroup);

                    // Recurse
                    addOptionRecurse(fieldObject[key], optgroup);
                }

                // Return
                return parentElement;
            }

            return parentElement;
        } 


        return addOptionRecurse(fieldObject, select);

    }

    function createAggregationFunctionSelector(name) {
        // Create a select element
        var select = document.createElement('select');

        // Set the select element attributes
        select.setAttribute('class', 'form-control');
        select.setAttribute('name', name);

        // Create a default disabled option element
        var defaultOptionElement = document.createElement('option');
        defaultOptionElement.setAttribute('disabled', 'disabled');
        defaultOptionElement.setAttribute('selected', 'selected');
        defaultOptionElement.innerHTML = module.tt('select_aggregation_function');

        // Add the default option to the select element
        select.appendChild(defaultOptionElement);

        // For each aggregation function in the aggregationFunctions object
        for (var key in aggregationFunctions) {
            // Create an option element
            var option = document.createElement('option');

            // Set the option element attributes
            option.setAttribute('value', key);
            option.innerHTML = aggregationFunctions[key].label;

            // Add the option to the select element
            select.appendChild(option);
        }

        // Return the select element
        return select;
    }




    function createRadioSelector(name, options, defaultOption = null) {
        // Create a div element
        var div = document.createElement('div');

        // Set the div element attributes
        div.setAttribute('class', 'AG-editor-radio-selector');

        // Loop through the options
        for (var i = 0; i < options.length; i++) {
            // Create a div element
            var optionDiv = document.createElement('div');

            // Set the div element attributes
            optionDiv.setAttribute('class', 'AG-editor-radio-selector-option');

            // Create a radio element
            var radio = document.createElement('input');

            // Set the radio element attributes
            radio.setAttribute('type', 'radio');
            radio.setAttribute('name', name);
            radio.setAttribute('value', options[i].value);

            // If the option is the default option, set the radio element to checked
            if (options[i].value === defaultOption) {
                radio.setAttribute('checked', 'checked');
            }

            // Create a label element
            var label = document.createElement('label');
            
            // Set the label element attributes
            label.setAttribute('for', options[i].value);
            label.innerHTML = options[i].label;

            // Add the radio and label elements to the option div
            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);

            // Add the option div to the div
            div.appendChild(optionDiv);
        }

        return div;
    }

    // TODO: Change this function so it takes a DOM element as a twin instead of a twin object
    // A function that creates a radio selector between dropping or replacing null values, if the selected option is replace, a text input is shown
    function createDropOrReplaceTwinSelect(name, options = {
            "drop": {"label": module.tt("drop"), "twin": null},
            "replace": {"label": module.tt("replace"), "twin": {"type": "number", "name": "replace_value", "label": module.tt("replace_value")}}
        },
        defaultOption = null) {
        // Create a div element
        var div = document.createElement('div');

        // Set the div element attributes
        div.setAttribute('class', 'AG-editor-drop-or-replace-twin-select');

        // For each option in the options object
        for (var key in options) {
            // Create a div element
            var optionDiv = document.createElement('div');

            // Set the div element attributes
            optionDiv.setAttribute('class', 'AG-editor-drop-or-replace-twin-select-option');

            // Create a radio element
            var radio = document.createElement('input');

            // Set the radio element attributes
            radio.setAttribute('type', 'radio');
            radio.setAttribute('name', name);
            radio.setAttribute('value', key);

            // If the option is the default option, set the radio element to checked
            if (key === defaultOption) {
                radio.setAttribute('checked', 'checked');
            }

            // Create a label element
            var label = document.createElement('label');

            // Set the label element attributes
            label.setAttribute('for', key);
            label.innerHTML = options[key].label;

            // Add the radio and label elements to the option div
            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);

            // If the option has a twin
            if (options[key].twin !== null) {
                // Create a div element
                var twinDiv = document.createElement('div');

                // Set the div element attributes
                twinDiv.setAttribute('class', 'AG-editor-drop-or-replace-twin-select-twin');

                // Create an input element
                var input = document.createElement('input');

                // Set the input element attributes
                input.setAttribute('type', options[key].twin.type);
                input.setAttribute('name', options[key].twin.name);
                input.setAttribute('value', 0);

                // When this radio button is selected, show the twin div
                div.addEventListener('change', function() {
                    input.style.display = 'none';
                    input.removeAttribute('value')
                    // If the radio button is checked
                    if (radio.checked) {
                        // Show the twin div
                        input.style.display = 'block';
                        input.setAttribute('value', 0); // TODO: add value attribute to twin intput
                    }
                });

                // trigger the change event to show the twin div if the radio button is checked
                div.dispatchEvent(new Event('change'));


                // Add the input element to the twin div
                twinDiv.appendChild(input);

                // Add the twin div to the option div
                optionDiv.appendChild(twinDiv);
            }

            // Add the option div to the div
            div.appendChild(optionDiv);


        }

        // Return the div
        return div;
    }
        


    // The AdvancedGraph class
    function AdvancedGraph(graphType, graphLabel, getForm, getGraph, checkReady, canCreate) {
        // The name of the graph type
        this.name = graphType;

        // The label of the graph type
        this.label = graphLabel;

        // The function used to get the form
        this.getForm = getForm;

        // The function used to get the graph
        this.getGraph = getGraph;

        // The function used to check whether the graph is ready to be created given a form
        this.checkReady = checkReady;

        // A boolean that determines whether the graph can be created
        this.canCreate = canCreate;


        this.generateForm = function(parameters = null) {
            // Create the div that will hold the graph header, the graph form, a preview pane, and the graph footer
            var graphDiv = document.createElement('div');
            graphDiv.setAttribute('class', 'AG-editor-graph');

            // Create the div that will hold the graph header
            var graphHeaderDiv = document.createElement('div');
            graphHeaderDiv.setAttribute('class', 'AG-editor-graph-header');

            // Add the label to the graph header as a text node
            graphHeaderDiv.appendChild(document.createTextNode(graphLabel));

            // Create the div that will hold the graph form
            var graphFormDiv = document.createElement('div');
            graphFormDiv.setAttribute('class', 'AG-editor-graph-form');

            // Create a new form
            var form = getForm(parameters);

            // Add the form to the graph form div
            graphFormDiv.appendChild(form);

            // Create the div that will hold the preview pane
            var previewPaneDiv = document.createElement('div');
            previewPaneDiv.setAttribute('class', 'AG-editor-preview-pane');

            // Create the div that will hold the graph footer
            var graphFooterDiv = document.createElement('div');
            graphFooterDiv.setAttribute('class', 'AG-editor-graph-footer');

            // Create a button to create the graph
            var createGraphButton = document.createElement('button');
            createGraphButton.setAttribute('class', 'AG-editor-create-graph-button');
            createGraphButton.setAttribute('disabled', 'disabled');
            createGraphButton.innerHTML = module.tt('preview');

            // Create an event listener that toggles the create graph button when the form is changed
            form.addEventListener('change', function () {
                // Check whether the form is ready
                if (checkReady(form)) {
                    // Enable the create graph button
                    createGraphButton.removeAttribute('disabled');
                } else {
                    // Disable the create graph button
                    createGraphButton.setAttribute('disabled', 'disabled');
                }
            });

            // Create an event listener that creates the graph when the create graph button is clicked
            createGraphButton.addEventListener('click', function () {
                // Check whether the form is ready
                if (checkReady(form)) {
                    // Serialize the form
                    var formData = serializeForm(form);

                    // Create the graph
                    var graph = getGraph(formData);

                    // Empty the preview pane
                    previewPaneDiv.innerHTML = '';

                    // Add the graph to the preview pane
                    previewPaneDiv.appendChild(graph);
                }
            });

            // Add the create graph button to the graph footer div
            graphFooterDiv.appendChild(createGraphButton);

            // Add the graph header div to the graph div
            graphDiv.appendChild(graphHeaderDiv);

            // Add the graph form div to the graph div
            graphDiv.appendChild(graphFormDiv);

            // Add the preview pane div to the graph div
            graphDiv.appendChild(previewPaneDiv);

            // Add the graph footer div to the graph div
            graphDiv.appendChild(graphFooterDiv);

            // Return the graph div
            return graphDiv;
        };
        
    }

    // A function constructor for the BarGraph class
    // This class is used to create a bar graph
    // It inherits from the AdvancedGraph class
    // The following are what the bar graph parameters look like:
    // {
    //     instrument: 'instrument_name',
    //     title: 'A title for the graph',
    //     description: 'A description of the graph',
    //     graph_type: 'bar' or 'pie',
    //     category: 'category_name',
    //     na_category: 'keep' or 'drop',
    //     numeric: 'numeric_name' or '',
    //     is_count (optional): true,
    //     aggregation_function: 'count' or 'sum' or 'mean' or 'median' or 'min' or 'max',
    //     is_percentage (optional): true,
    //     palette_brewer (optional): ['color1', 'color2', ...],
    //     show_which: 'graph' or 'table' or 'both' (if not specified, defaults to 'both'),
    //     table_values: "values" or "percentages" or "both" (if not specified, defaults to "both")
    // }
    function BarGraph() {
        var type = "bar";
        var label = module.tt('graph_type_bar');

        // The function used to get the form
        var getForm = function (parameters = null) {
            // Create a form
            var form = document.createElement('form');

            // Create a div to hold the graph options
            var graphOptionsDiv = document.createElement('div');
            graphOptionsDiv.setAttribute('class', 'AG-editor-graph-options');

            // Create an instrument selector
            var instrumentSelector = addInstrumentSelector(graphOptionsDiv);

            // If parameters.instrument is specified, set the instrument selector to the specified instrument
            if (parameters && parameters.instrument) {
                instrumentSelector.querySelector('select').value = parameters.instrument;

                // Trigger the change event
                instrumentSelector.querySelector('select').dispatchEvent(new Event('change'));

                // Update the graph options
                updateGraphOptions(graphOptionsDiv, parameters);
            }

            // Add the instrument selector to the form
            form.appendChild(instrumentSelector);

            // Add the graph options div to the form
            form.appendChild(graphOptionsDiv);

            // Return the form
            return form;
        };

        // The function used to get the graph
        var getGraph = function (parameters) {
            // return an empty div
            return document.createElement('div');
        };

        // The function that checks if the form is ready to create the graph
        var checkReady = function (form) {
            return true;
        };

        // The function used to check if the graph can be created given an instrument
        var validateInstrument = function (instrument) {
            return true;
        }

        // The function used to check if the graph can be created
        var canCreate = anyInstrumentValid(validateInstrument);

        // Call the AdvancedGraph constructor
        AdvancedGraph.call(this, type, label, getForm, getGraph, checkReady, canCreate);

        // The function that creates an instrument selector
        var addInstrumentSelector = function(optionsDiv) {
            var validInstruments = getValidInstruments(validateInstrument);

            // Create a callback function that creates a graph options div given an instrument
            var graphOptionsCallback = function(instrument_name) {
                // Get the instrument given the instrument name
                var instrument = instrumentDictionary[instrument_name];

                // Create a graph options div
                var graphOptionsDiv = graphOptions(instrument);

                // Empty the options div
                optionsDiv.innerHTML = '';

                // Add the graph options div to the options div
                optionsDiv.appendChild(graphOptionsDiv);

            };

            // Return a newley created instrument selector
            return createInstrumentSelector(validInstruments, graphOptionsCallback);
        }

        // The function that creates a graph options div given an instrument
        var graphOptions = function(instrument) {
            // Create a div to hold the graph options
            var graphOptionsDiv = document.createElement('div');
            graphOptionsDiv.setAttribute('class', 'AG-editor-graph-options');

            // Create a left div
            var leftDiv = document.createElement('div');
            leftDiv.setAttribute('class', 'AG-editor-graph-options-left');

            // Create a radio selector to select between bar and pie graphs
            var graphTypeRadioSelector = createRadioSelector('graph_type', [{'value': 'bar', 'label': module.tt('bar')}, {'value': 'pie', 'label': module.tt('pie')}], 'bar');

            // Create a help object for the graph type radio selector
            var graphTypeRadioSelectorHelp = {
                title: module.tt('bar_graph_type'),
                content: module.tt('bar_graph_type_help')
            }

            // Create a parameter div for the graph type radio selector
            var graphTypeRadioSelectorParameterDiv = createParameterDiv(graphTypeRadioSelector, module.tt('bar_graph_type'), graphTypeRadioSelectorHelp);

            // Add the graph type radio selector to the left div
            leftDiv.appendChild(graphTypeRadioSelectorParameterDiv);

            // Get the categorical fields
            var categoricalFields = getCategoricalFields(instrument['fields']);

            // Create a default disabled option for the categorical field selector
            var defaultOption = document.createElement('option');
            defaultOption.setAttribute('disabled', 'disabled');
            defaultOption.setAttribute('selected', 'selected');
            defaultOption.appendChild(document.createTextNode(module.tt('select_a_field')));

            // Create the categorical field selector
            var categoricalFieldSelector = createFieldSelector(categoricalFields, 'categorical_field', defaultOption);

            // Create a help object for the categorical field selector
            var categoricalFieldHelp = {
                title: module.tt('categorical_field'),
                content: module.tt('bar_categorical_field_help')
            }

            // Create a parameter div for the categorical field selector
            var categoricalFieldParameterDiv = createParameterDiv(categoricalFieldSelector, module.tt('categorical_field'), categoricalFieldHelp);

            // Add the categorical field selector to the left div
            leftDiv.appendChild(categoricalFieldParameterDiv);

            // Create a radio selector to select between keeping or dropping the NA category if it exists
            var naCategoryRadioSelector = createRadioSelector('na_category', [{'value': 'keep', 'label': module.tt('keep')}, {'value': 'drop', 'label': module.tt('drop')}], 'keep');

            // Create a help object for the NA category radio selector
            var naCategoryRadioSelectorHelp = {
                title: module.tt('na_category'),
                content: module.tt('na_category_help')
            }

            // Create a parameter div for the NA category radio selector
            var naCategoryRadioSelectorParameterDiv = createParameterDiv(naCategoryRadioSelector, module.tt('na_category'), naCategoryRadioSelectorHelp);

            // Add the NA category radio selector to the left div
            leftDiv.appendChild(naCategoryRadioSelectorParameterDiv);

            // Get the numeric fields
            var numericFields = getNumericFields(instrument['fields']);

            var numericFieldSelectorObject = [
                [numericFields],
                {
                    'count': [{'field_name': '', 'field_label': module.tt('count')}]
                }
            ];

            // Create a default disabled option for the numeric field selector
            var defaultOption = document.createElement('option');
            defaultOption.setAttribute('disabled', 'disabled');
            defaultOption.setAttribute('selected', 'selected');
            defaultOption.appendChild(document.createTextNode(module.tt('select_a_field')));

            // Create the numeric field selector
            var numericFieldSelector = createFieldSelector(numericFieldSelectorObject, 'numeric_field', defaultOption);

            // Create a help object for the numeric field selector
            var numericFieldHelp = {
                title: module.tt('numeric_field'),
                content: module.tt('bar_numeric_field_help')
            }

            // Create a parameter div for the numeric field selector
            var numericFieldParameterDiv = createParameterDiv(numericFieldSelector, module.tt('numeric_field'), numericFieldHelp);

            // Add the numeric field selector to the left div
            leftDiv.appendChild(numericFieldParameterDiv);

            // Create a radio selector to select between dropping or replacing missing values
            var missingValueRadioSelector = createDropOrReplaceTwinSelect('na_numeric', undefined,defaultOption = 'drop');

            // Create a help object for the missing value radio selector
            var missingValueRadioSelectorHelp = {
                title: module.tt('na_numeric'),
                content: module.tt('na_numeric_help')
            }

            // Create a parameter div for the missing value radio selector
            var missingValueRadioSelectorParameterDiv = createParameterDiv(missingValueRadioSelector, module.tt('na_numeric'), missingValueRadioSelectorHelp);

            // Add the missing value radio selector to the left div
            leftDiv.appendChild(missingValueRadioSelectorParameterDiv);

            // Create an aggregation function selector
            var aggregationFunctionSelector = createAggregationFunctionSelector('aggregation_function');

            // Create a help object for the aggregation function selector
            var aggregationFunctionHelp = {
                title: module.tt('aggregation_function'),
                content: module.tt('bar_aggregation_function_help')
            }

            // Create a parameter div for the aggregation function selector
            var aggregationFunctionParameterDiv = createParameterDiv(aggregationFunctionSelector, module.tt('aggregation_function'), aggregationFunctionHelp);

            // Add the aggregation function selector to the left div
            leftDiv.appendChild(aggregationFunctionParameterDiv);


            // Create an invisible checkbox to determine whether the option group of the numeric field has the data-group attribute set to count
            var numericFieldCountCheckbox = document.createElement('input');
            numericFieldCountCheckbox.setAttribute('type', 'checkbox');
            numericFieldCountCheckbox.setAttribute('name', 'numeric_field_count');
            numericFieldCountCheckbox.setAttribute('style', 'display: none;');
            numericFieldCountCheckbox.setAttribute('value', 'is_count');

            // Add the numeric field count checkbox to the left div
            leftDiv.appendChild(numericFieldCountCheckbox);

            // When the form is first created, hide the aggregation function selector and the missing value radio selector
            numericFieldCountCheckbox.checked = true;
            aggregationFunctionParameterDiv.style.display = 'none';
            missingValueRadioSelectorParameterDiv.style.display = 'none';

            // When the numeric field selector changes, if the selected field is count, hide the aggregation function selector and the missing value radio selector
            numericFieldSelector.addEventListener('change', function() {
                // Get the data-group attribute of the selected option's option group
                var dataGroup = numericFieldSelector.options[numericFieldSelector.selectedIndex].parentNode.getAttribute('data-group');

                if (dataGroup == 'count') {
                    numericFieldCountCheckbox.checked = true;
                    aggregationFunctionParameterDiv.style.display = 'none';
                    missingValueRadioSelectorParameterDiv.style.display = 'none';
                } else {
                    numericFieldCountCheckbox.checked = false;
                    aggregationFunctionParameterDiv.style.display = 'block';
                    missingValueRadioSelectorParameterDiv.style.display = 'block';
                }
            });
            

            // Create a right div

            // Add the left div to the graph options div
            graphOptionsDiv.appendChild(leftDiv);

            // Return the graph options div
            return graphOptionsDiv;
        }

        // A function that updates the graph options div given parameters
        var updateGraphOptions = function(graphOptionsDiv, parameters) {
            // Get the categorical field selector
            var categoricalFieldSelector = graphOptionsDiv.querySelector('select[name="categorical_field"]');

            // Get the numeric field selector
            var numericFieldSelector = graphOptionsDiv.querySelector('select[name="numeric_field"]');

            // If parameters.categorical_field is specified, set the categorical field selector to the specified field
            if (parameters.categorical_field) {
                categoricalFieldSelector.value = parameters.categorical_field;
            }

            // If parameters.numeric_field is specified, set the numeric field selector to the specified field
            if (parameters.numeric_field) {
                numericFieldSelector.value = parameters.numeric_field;
            }
        }

    }

    // A function that gets the instrument list from the module
    function getInstrumentList() {
        // If instrument list is set, return it
        if (instrumentList) {
            return instrumentList;
        }

        // create the instrument list and return it
        return createInstrumentList();
    }

    // A function that creates and instrument list from the instrument dictionary
    function createInstrumentList() {
        var instrumentList = [];
        var instrument_names = [];

        for (var instrument in instruments['repeat_instruments']) {
            instrumentList.push(instruments['repeat_instruments'][instrument]);
            instrument_names.push(instruments['repeat_instruments'][instrument]['form_name']);
        }

        if (!instruments['non_repeats'])
            return instrumentList;

        // Create a name and label for the non-repeat instruments
        var non_repeat_instrument_name = 'non_repeats';
        var non_repeat_instrument_label = module.tt('non_repeat_instrument_label');

        // While the non-repeat instrument name is in the instrument names, add an underscore to the end of the name
        while (instrument_names.includes(non_repeat_instrument_name)) {
            non_repeat_instrument_name += '_';
        }

        // Add the non-repeat instrument to the instruments
        instrumentList.push({
            'form_name': non_repeat_instrument_name,
            'form_label': non_repeat_instrument_label,
            'fields': instruments['non_repeats']
        });

        return instrumentList;
    }

    function createInstrumentDictionary() {
        var instrumentDictionary = {};

        // Make the key for each instrument the form_name for the instrument
        for (const instrument in instrumentList) {
            instrumentDictionary[instrumentList[instrument]['form_name']] = instrumentList[instrument];
        }

        return instrumentDictionary;
    }

    function getInstrumentFields(form_name) {
        return instrumentDictionary[form_name].fields;
    }

    // A function that returns a list of valid instruments given a validation function
    function getValidInstruments(validateInstrument) {
        // Get the instrument list
        var instrumentList = getInstrumentList();

        // Create a list of valid instruments
        var validInstruments = [];

        // Check if any instrument is valid
        for (var i = 0; i < instrumentList.length; i++) {
            if (validateInstrument(instrumentList[i])) {
                validInstruments.push(instrumentList[i]);
            }
        }

        return validInstruments;
    }

    // A function that checks if any instrument is valid given a validation function
    function anyInstrumentValid(validateInstrument) {
        // Get the instrument list
        var instrumentList = getInstrumentList();

        // Check if any instrument is valid
        for (var i = 0; i < instrumentList.length; i++) {
            if (validateInstrument(instrumentList[i])) {
                return true;
            }
        }

        return false;
    }

    // Create an instrument selector constructor given a callback function
    function createInstrumentSelector(validInstruments, callback) {
        // Create a div to hold the instrument selector
        var instrumentSelectorDiv = document.createElement('div');
        instrumentSelectorDiv.setAttribute('class', 'AG-editor-instrument-selector');

        // Create a label for the instrument selector
        var instrumentSelectorLabel = document.createElement('label');
        instrumentSelectorLabel.innerHTML = module.tt('instrument_selector_label');

        // Create a select element for the instrument selector
        var instrumentSelectorSelect = document.createElement('select');
        instrumentSelectorSelect.setAttribute('class', 'form-control');
        instrumentSelectorSelect.setAttribute('name', 'instrument');

        // Create an option element for the instrument selector
        var instrumentSelectorOption = document.createElement('option');
        instrumentSelectorOption.setAttribute('disabled', 'disabled');
        instrumentSelectorOption.setAttribute('selected', 'selected');
        instrumentSelectorOption.innerHTML = module.tt('select_an_instrument');

        // Add the option element to the select element
        instrumentSelectorSelect.appendChild(instrumentSelectorOption);

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
            callback(this.value);
        });

        // Add the label to the div
        instrumentSelectorDiv.appendChild(instrumentSelectorLabel);

        // Add the select element to the div
        instrumentSelectorDiv.appendChild(instrumentSelectorSelect);

        // Return the div
        return instrumentSelectorDiv;
    };

    // A function that gets a field from  the data dictionary
    function getField(field_name) {
        return data_dictionary[field_name];
    }

    // A function that returns whether or not a field is a radio field
    function isRadioField(field) {
        var radio_field_types = ['radio', 'dropdown', 'yesno', 'truefalse'];

        // If the field is a string, get the field from the data dictionary
        if (typeof field === 'string') {
            field = getField(field);
        }

        // Return whether or not the field is a radio field
        return radio_field_types.includes(field.field_type);
    }

    // A function that gets the radio type fields from the fields (each field is a data dictionary entry)
    function getRadioFields(fields) {
        var radio_field_types = ['radio', 'dropdown', 'yesno', 'truefalse'];
        var radioFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (isRadioField(fields[i])) {
                radioFields.push(fields[i]);
            }
        }

        return radioFields;
    }

    // A function that returns whether or not a field is a checkbox field
    function isCheckboxField(field) {
        var checkbox_field_types = ['checkbox'];

        // If the field is a string, get the field from the data dictionary
        if (typeof field === 'string') {
            field = getField(field);
        }

        // Return whether or not the field is a checkbox field
        return checkbox_field_types.includes(field.field_type);
    }


    // A function that returns the checkbox type fields from the fields (each field is a data dictionary entry)
    function getCheckboxFields(fields) {
        var checkbox_field_types = ['checkbox'];
        var checkboxFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (isCheckboxField(fields[i])) {
                checkboxFields.push(fields[i]);
            }
        }

        return checkboxFields;
    }

    // A function that returns a dictionary of the categorical fields from the fields (each field is a data dictionary entry)
    function getCategoricalFields(fields) {
        var categoricalFields = {
            "radiolike": getRadioFields(fields),
            "checkbox": getCheckboxFields(fields)
        };

        return categoricalFields;
    }

    // A function that returns whether or not a field is a numeric field
    function isNumericField(field) {
        var non_numeric_field_names = ['record_id', 'redcap_event_name', 'redcap_repeat_instrument', 'redcap_repeat_instance', 'longitude', 'longitud', 'Longitude', 'Longitud', 'latitude', 'latitud', 'Latitude', 'Latitud'];
        var numeric_field_text_validation_types = ['number', 'integer', 'float', 'decimal'];

        // If field is a string get the field from the data dictionary
        if (typeof field === 'string') {
            field = getField(field);
        }

        return !non_numeric_field_names.some(v => field.field_name.includes(v)) && (
            (field.field_type == 'text' && numeric_field_text_validation_types.includes(field['text_validation_type_or_show_slider_number']))
            || field['field_type'] == 'calc');
    }

    // A function that returns the numeric fields from the fields (each field is a data dictionary entry)
    function getNumericFields(fields) {
        var non_numeric_field_names = ['record_id', 'redcap_event_name', 'redcap_repeat_instrument', 'redcap_repeat_instance', 'longitude', 'longitud', 'Longitude', 'Longitud', 'latitude', 'latitud', 'Latitude', 'Latitud'];
        var numeric_field_text_validation_types = ['number', 'integer', 'float', 'decimal'];

        var numericFields = [];

        for (var i = 0; i < fields.length; i++) {
            if (isNumericField(fields[i])) {
                numericFields.push(fields[i]);
            }
        }

        return numericFields;

    }



    // A function that creates a formData object from the form and turns it into an object 
    function serializeForm(form) {
        var formData = new FormData(form);
        var object = {};
        formData.forEach(function (value, key) {
            object[key] = value;
        });
        return object;
    }
}
