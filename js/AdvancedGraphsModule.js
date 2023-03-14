// Create a class that will be used to create a module for the dashboard editor
var AdvancedGraphsModule = function (module, dashboard, data_dictionary, report, instruments) {
    this.authors = 'Victor Esposita, Joel Cohen, David Cherry, and others';

    var module = module;
    var dashboard = dashboard;
    var data_dictionary = data_dictionary;
    var report = report;

    // insruments is an object with the following structure:
    // {
        // "repeating": {
            // example_name: {"form_name": "example_name",
            // "form_label": "Example Label",
            // "fields": ["example_field_1", "example_field_2"]},
            // example_name_2: {"form_name": "example_name_2",
            // "form_label": "Example Label 2",
            // "fields": ["example_field_1", "example_field_2"]}
        // },
        // "non_repeating": ["example_field_1", "example_field_2"]
    // }
    var instruments = instruments;
    var instrumentList = createInstrumentList();
    var instrumentDictionary = createInstrumentDictionary();

    var links = {
        'edit': module.getUrl('edit_dash.php'),
        'view': module.getUrl('view_dash.php'),
        'dash_list': module.getUrl('advanced_graphs.php'),
        'public': module.getUrl('public_dash.php', true)
    };

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

    // A function used to create a table showing all the created dashboards
    this.loadDashList = function (parent) {
        var project_id = module.getUrlParameter('pid');

        // If the pid is not set, then we are not in a project context
        if (project_id === null) {
            // Display an error message
            var error = document.createElement('div');
            error.setAttribute('class', 'alert alert-danger');
            error.innerHTML = module.tt('project_context_error');
            parent.append(error);
        }

        // Get the dashboards from the server
        var dashboards = getDashboards(project_id);

        // If the dashboards are null, then there was an error
        if (dashboards === null) {
            // Display an error message
            var error = document.createElement('div');
            error.setAttribute('class', 'alert alert-danger');
            error.innerHTML = module.tt('dashboard_list_load_error');
            parent.append(error);
        }

        // Render the dashboard list
        var table = renderDashboardList(dashboards);

        // Add the table to the parent
        parent.append(table);
    }

    function getPublicLink(dashboardId) {
        // Replace this with your actual URL generation logic
        return "#";
    }
    
    function viewDashboard(dashboardId) {
        console.log("View dashboard:", dashboardId);
    }
    
    function editDashboard(dashboardId) {
        console.log("Edit dashboard:", dashboardId);
    }
    
    function deleteDashboard(dashboardId) {
        console.log("Delete dashboard:", dashboardId);
    }

    async function getDashboards(project_id) {
        // Get the dashboards from the server
        try {
            var dashboards = await module.ajax('getDashboards', project_id);
            return dashboards;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async function getReportName(reportId) {
        // Replace this with your actual AJAX request to fetch the report name
        return new Promise(resolve => {
            setTimeout(() => {
                resolve("Report " + reportId);
            }, 200);
        });
    }
    
    async function renderDashboardList(dashboards) {
        // Create a table to hold the dashboards
        var table = document.createElement('table');
        table.className = 'table table-striped';
        table.style.width = '100%';
    
        // Create the table header
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        var headers = [
            module.tt('dashboard_title'),
            module.tt('report_name'),
            '',
            module.tt('public_link'),
            module.tt('view'),
            module.tt('edit'),
            module.tt('delete')
        ];
    
        // Create the table header cells
        headers.forEach(function(header) {
            var th = document.createElement('th');
            th.innerText = header;
            headerRow.appendChild(th);
        });
    
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        // Create the table body
        var tbody = document.createElement('tbody');
    
        // Create a row for each dashboard
        for (const dashboard of dashboards) {
            var tr = document.createElement('tr');
    
            // Create the cells for the row
            var tdTitle = document.createElement('td');
            tdTitle.innerText = dashboard.title;
            tr.appendChild(tdTitle);
    
            var tdReportName = document.createElement('td');
            tdReportName.innerText = await getReportName(dashboard.report_id);
            tr.appendChild(tdReportName);
    
            var tdSeparator = document.createElement('td');
            tr.appendChild(tdSeparator);
    
            var tdPublicLink = document.createElement('td');
            if (dashboard.is_public) {
                var publicLink = document.createElement('a');
                publicLink.href = getPublicLink(dashboard.dash_id);
                publicLink.innerText = module.tt('public_link_href');
                tdPublicLink.appendChild(publicLink);
            }
            tr.appendChild(tdPublicLink);
    
            var tdView = document.createElement('td');
            var viewButton = document.createElement('button');
            viewButton.className = 'btn btn-primary';
            viewButton.innerText = module.tt('view_button');
            viewButton.onclick = function() {
                viewDashboard(dashboard.dash_id);
            };
            tdView.appendChild(viewButton);
            tr.appendChild(tdView);
    
            var tdEdit = document.createElement('td');
            var editButton = document.createElement('button');
            editButton.className = 'btn btn-warning';
            editButton.innerText = module.tt('edit_button');
            editButton.onclick = function() {
                editDashboard(dashboard.dash_id);
            };
            tdEdit.appendChild(editButton);
            tr.appendChild(tdEdit);
    
            var tdDelete = document.createElement('td');
            var deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger';
            deleteButton.innerText = module.tt('delete_button');
            deleteButton.onclick = function() {
                let deleteSuccess = deleteDashboard(dashboard.dash_id);
                if (deleteSuccess) {
                    tr.remove();
                } else {
                    alert(module.tt('delete_error'));
                }
            };
            tdDelete.appendChild(deleteButton);
            tr.appendChild(tdDelete);
    
            tbody.appendChild(tr);
        }
    
        table.appendChild(tbody);
    
        return table;
    }

    // The function used to create the dashboard options div
    function createDashboardOptions() {
        // Create the div that will hold the dashboard options
        var dashboardOptions = document.createElement('div');

        // Set the id of the dashboard options div
        dashboardOptions.setAttribute('id', 'AG-dashboard-options');

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
        titleInputBox.setAttribute('name', 'dash_title');

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
        // set the id of the table div
        tableDiv.setAttribute('id', 'AG-editor-table');

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
            // Call the function to save the dashboard
            saveDashboard();
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
            "replace": {"label": module.tt("replace"), "twin": {"type": "number", "name": "na_numeric_value", "label": module.tt("replace_value")}}
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

    // A function that creates an input given an object containing attribute - value pairs
    function createInput(attributes) {
        var inputElement = document.createElement('input');

        for (var attribute in attributes) {
            inputElement.setAttribute(attribute, attributes[attribute]);
        }

        return inputElement;
    }

    // A function that takes a dom element and returns an object with a checkbox that adds or removes the dom element from the div
    function createOptionalInput(domElement, label, help = null) {
        // Create a div element
        var div = document.createElement('div');

        // Set the div element attributes
        div.setAttribute('class', 'AG-editor-optional-input');

        // Create a checkbox element
        var checkbox = document.createElement('input');

        // Set the checkbox element attributes
        checkbox.setAttribute('type', 'checkbox');

        // Create a label element
        var labelElement = document.createElement('label');

        // Set the label element attributes
        labelElement.innerHTML = label;

        // When the checkbox changes, remove or add the dom element to the div
        checkbox.addEventListener('change', function() {
            if (checkbox.checked) {
                div.appendChild(domElement);
            } else {
                div.removeChild(domElement);
            }
        });

        // Add the checkbox and label elements to the div
        div.appendChild(checkbox);
        div.appendChild(labelElement);
        div.appendChild(document.createElement('br'));

        // If the help parameter is not null
        if (help !== null) {
            // Create a help element
            var helpButton = createHelpButton(help);

            // Add the help element to the label element
            labelElement.appendChild(helpButton);
        }

        // Return the div
        return div;
    }




    // A function that returns a palette brewer color selector
    function createColorsSelector(name, defaultColors = ["#440154", "#482878", "#3E4A89", "#31688E", "#26828E", "#1F9E89", "#35B779", "#6DCD59","#B4DE2C", "#FDE725"]) {
        // Create a div element
        var div = document.createElement('div');

        // Set the div element attributes
        div.setAttribute('class', 'AG-editor-colors-selector');

        // Create a button that will add a color to the selector
        var addColorButton = document.createElement('button');
        addColorButton.setAttribute('class', 'AG-editor-colors-selector-add-color');
        addColorButton.innerHTML = '<i class="fas fa-plus"></i>';
        addColorButton.type = 'button';

        // Create a div element that will hold the color inputs
        var colorsDiv = document.createElement('div');
        colorsDiv.setAttribute('class', 'AG-editor-colors-selector-colors');

        // A function that creates a color input
        function createColorInput(color = null) {
            // Create a div element
            var colorDiv = document.createElement('div');

            // Set the div element attributes
            colorDiv.setAttribute('class', 'AG-editor-colors-selector-color');

            // Create an input element
            var input = document.createElement('input');

            // Set the input element attributes
            input.setAttribute('type', 'color');
            input.setAttribute('name', name);
            input.setAttribute('value', color ? color : "#ffffff");

            // Create a button that will remove the color input
            var removeColorButton = document.createElement('button');
            removeColorButton.setAttribute('class', 'AG-editor-colors-selector-remove-color');
            removeColorButton.innerHTML = '<i class="fas fa-times"></i>';
            removeColorButton.type = 'button';

            // When the removeColorButton is clicked, remove the color input
            removeColorButton.addEventListener('click', function() {
                colorDiv.remove();
            });

            // A button that adds a new color input to the right of the current color input
            var addColorButton = document.createElement('button');
            addColorButton.setAttribute('class', 'AG-editor-colors-selector-add-color');
            addColorButton.innerHTML = '<i class="fas fa-plus"></i>';
            addColorButton.type = 'button';

            // When the addColorButton is clicked, add a color input to the right of the current color input
            addColorButton.addEventListener('click', function() {
                colorDiv.after(createColorInput());
            });

            // Add the input and buttons to the color div
            colorDiv.appendChild(input);
            colorDiv.appendChild(removeColorButton);
            colorDiv.appendChild(addColorButton);

            // Return the color div
            return colorDiv;
        }

        // When the addColorButton is clicked, add a color input to the beginning of the colors div
        addColorButton.addEventListener('click', function() {
            colorsDiv.prepend(createColorInput());
        });

        // Add the addColorButton to the div
        div.appendChild(addColorButton);

        // Add the colors div to the div
        div.appendChild(colorsDiv);

        // Add the default colors to the colors div
        for (var i = 0; i < defaultColors.length; i++) {
            colorsDiv.appendChild(createColorInput(defaultColors[i]));
        }

        // Return the div
        return div;
    } 

    // A function that creates a color selector modal
    function createColorsSelectorModal(name, defaultColors = ["#440154", "#482878", "#3E4A89", "#31688E", "#26828E", "#1F9E89", "#35B779", "#6DCD59","#B4DE2C", "#FDE725"]) {
        // Create a div element that will hold the initally hidden modal
        var div = document.createElement('div');

        // Set the div element attributes
        div.setAttribute('class', 'AG-editor-color-selector-modal');

        // Create a button that will open the modal
        var openModalButton = document.createElement('button');
        openModalButton.setAttribute('class', 'AG-editor-color-selector-modal-open');
        openModalButton.innerHTML = module.tt('choose_colors');
        openModalButton.type = 'button';

        // Create a div element that will hold the modal
        var modalDiv = document.createElement('div');
        modalDiv.setAttribute('class', 'AG-editor-color-selector-modal-modal');
        modalDiv.style.display = 'none';

        // Create a div element that will hold the modal contents
        var modalContentDiv = document.createElement('div');
        modalContentDiv.setAttribute('class', 'AG-editor-color-selector-modal-content');

        // Create a div element that will hold the color selector
        var colorSelectorDiv = document.createElement('div');
        colorSelectorDiv.setAttribute('class', 'AG-editor-color-selector-modal-color-selector');

        // Create a color selector
        var colorSelector = createColorsSelector(name, defaultColors);

        // Add the color selector to the color selector div
        colorSelectorDiv.appendChild(colorSelector);

        // Create a div element that will hold the modal footer
        var modalFooterDiv = document.createElement('div');

        // Create a button that will close the modal
        var closeModalButton = document.createElement('button');
        closeModalButton.setAttribute('class', 'AG-editor-color-selector-modal-close');
        closeModalButton.innerHTML = module.tt('close');
        closeModalButton.type = 'button';

        // When the closeModalButton is clicked, close the modal
        closeModalButton.addEventListener('click', function() {
            modalDiv.style.display = 'none';
        });

        // Add the closeModalButton to the modal footer div
        modalFooterDiv.appendChild(closeModalButton);

        // Add the color selector div, and the modal footer div to the modal div
        modalContentDiv.appendChild(colorSelectorDiv);
        modalContentDiv.appendChild(modalFooterDiv);

        // Add the modal content div to the modal div
        modalDiv.appendChild(modalContentDiv);

        // When the openModalButton is clicked, open the modal
        openModalButton.addEventListener('click', function() {
            modalDiv.style.display = 'block';
        });

        // Add the openModalButton to the div
        div.appendChild(openModalButton);

        // Add the modal div to the div
        div.appendChild(modalDiv);

        // Return the div
        return div;
    }


    // A function that takes an array of dom elements and returns a div containing them all
    function fillDiv(domElements, className) {
        var div = document.createElement("div");
        div.setAttribute('class', className);

        for (var element of domElements) {
            div.append(element);
        }

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
                    previewPaneDiv.append(graph);
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
    //     categorical_field: 'category_name',
    //     na_category: 'keep' or 'drop',
    //     unused_categories: 'keep' or 'drop',
    //     numeric_field: 'numeric_name' or '',
    //     is_count (optional): true,
    //     na_numeric: 'drop' or 'replace',
    //     na_numeric_value (optional): 0,
    //     aggregation_function: 'count' or 'sum' or 'mean' or 'median' or 'min' or 'max',
    //     -- More Options --
    //     show_legend: true,
    //     bottom_margin: 80,
    //     x_title_offset: 45,
    //     x_title_size: 15,
    //     x_title_limit: "wrap" or "truncate",
    //     x_title_length: 40,
    //     x_label_size: 10,
    //     x_label_length: "wrap" or "truncate"
    //     x_label_width: 100,
    //     x_rotate: 0,
    //     left_margin: 45,
    //     y_title_offset: 45,
    //     y_title_size: 15,
    //     y_title_limit: "wrap" or "truncate",
    //     y_title_length: 40,
    //     y_label_size: 10,
    //     y_label_length: "wrap" or "truncate"
    //     y_label_width: 100,
    //     y_rotate: 0,
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
            graphOptionsDiv.setAttribute('class', 'AG-editor-graph-options-div');

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
            console.log("findline");
            // Get the choices for the category
            var choices = parseChoicesOrCalculations(parameters.categorical_field);

            var this_report = report;

            // If the category is a checkbox field, get a checkbox field report
            if (isCheckboxField(parameters.categorical_field)) {
                this_report = getCheckboxFieldReport(parameters.categorical_field);
            }

            // Get a dataframe that only has entries for the instrument specified by the instrument parameter
            var filteredReport = this_report.filter(function (d) { return d['redcap_repeat_instrument'] == parameters.instrument; });

            // If na_category is 'drop', filter out the rows with missing values for the field specified by the category parameter
            if (parameters.na_category == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.categorical_field] != ''; });
            }

            // If there are some NA entries for the category in the filtered report
            if (filteredReport.some(d => d[parameters.categorical_field] == ""))
                // Add an NA category to choices
                choices[""] = module.tt("na");

            // If we are using a numeric field and na_numeric is set to drop filter out the rows with missing values for the field specified by the numeric parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'drop') {
                filteredReport = filteredReport.filter(function (d) { return d[parameters.numeric_field] != ''; });
            }

            // If we are using a numeric field and na_numeric is set to replace, set the bar height function to use the na_numeric_value parameter
            if (!parameters.is_count && parameters.numeric_field != '' && parameters.na_numeric == 'replace') {
                var barHeightFunction = function (d) { return d[parameters.numeric_field] == '' ? parameters.na_numeric_value : d[parameters.numeric_field]; };
            } else {
                var barHeightFunction = function (d) { return d[parameters.numeric_field]; };
            }

            // If we are not using a numeric field, get the counts for each category
            if (parameters.is_count || parameters.numeric_field == '') {
                var counts = d3.rollup(filteredReport, v => v.length, d => d[parameters.categorical_field]);
            } else {
                // If we are using a numeric field, get the aggregation function for each category
                var counts = d3.rollup(filteredReport, v => d3[parameters.aggregation_function](v, barHeightFunction), d => d[parameters.categorical_field]);
            }

            // If unused_categories is set to keep, set the domain to all the choices
            if (parameters.unused_categories == 'keep') {
                var domain = Object.keys(choices);
            } else {
                // If unused_categories is set to drop, set the domain to the categories that have counts
                var domain = Array.from(counts, ([key, value]) => key);
            }

            var barHeights = Array.from(counts, ([key, value]) => ({key: key, value: value}));

            // Create a function to interpolate between colors for each category
            var interpolateColors = d3.interpolateRgbBasis(parameters.palette_brewer ? parameters.palette_brewer : ['red', 'green', 'blue']);
        
            var colorScale = d3.scaleOrdinal()
                .domain(domain)
                .range(domain.map((d, i) => interpolateColors(i / (domain.length > 1 ? domain.length-1: 1))));

            const x_title_size = parameters.x_title_size ? Number(parameters.x_title_size) : 15;
            const x_title_limit = parameters.x_title_limit ? parameters.x_title_limit : null;
            const x_title_length = parameters.x_title_length ? Number(parameters.x_title_length) : 0;
            const x_label_size = parameters.x_label_size ? Number(parameters.x_label_size) : 10;
            const x_label_limit = parameters.x_label_limit ? Number(parameters.x_label_limit) : null;
            const x_label_length = parameters.x_label_length ? Number(parameters.x_label_length) : Math.max(...domain.map(d => choices[d].length));
            
            // Get the x tick format
            var x_tick_format = d => choices[d];

            // If x_label_limit is set to truncate, truncate the labels
            if (x_label_limit == 'truncate') {
                x_tick_format = d => truncateString(choices[d], x_label_length);
            }
            // If x_label_limit is set to wrap, wrap the labels
            if (x_label_limit == 'wrap') {
                x_tick_format = d => wrapString(choices[d], x_label_length);
            }
            
            const x_rotate = parameters.x_rotate ? Number(parameters.x_rotate) : x_label_length * x_label_size * 1.2 > 640 / domain.length ? 90 : 0;
            const x_title_offset = parameters.x_title_offset ? Number(parameters.x_title_offset) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180) + x_title_size + 20;
            const bottom_margin = parameters.bottom_margin ? Number(parameters.bottom_margin) : x_label_length * x_label_size * Math.sin(x_rotate * Math.PI / 180) + x_title_size * 2 + 20;
            
            const y_title_size = parameters.y_title_size ? Number(parameters.y_title_size) : 15;
            const y_title_limit = parameters.y_title_limit ? parameters.y_title_limit : null;
            const y_title_length = parameters.y_title_length ? Number(parameters.y_title_length) : 0;
            const y_label_size = parameters.y_label_size ? Number(parameters.y_label_size) : 10;
            const y_label_limit = parameters.y_label_limit ? Number(parameters.y_label_limit) : null;
            const y_label_length = parameters.y_label_length ? Number(parameters.y_label_length) : Math.max(...barHeights.map(d => d.value.toString().length));
            
            // Get the y tick format
            var y_tick_format = d => d;

            // If y_label_limit is set to truncate, truncate the labels
            if (y_label_limit == 'truncate') {
                y_tick_format = d => truncateString(d, y_label_length);
            }
            // If y_label_limit is set to wrap, wrap the labels
            if (y_label_limit == 'wrap') {
                y_tick_format = d => wrapString(d, y_label_length);
            }

            // If y_label_limit is a string and not truncate or wrap, use it as the tick format
            if (y_label_limit != 'truncate' && y_label_limit != 'wrap' && y_label_limit != null) {
                y_tick_format = d => d3.format(y_label_limit)(d);
            }


            const y_rotate = parameters.y_rotate ? Number(parameters.y_rotate) : 0;
            const y_title_offset = parameters.y_title_offset ? Number(parameters.y_title_offset) : 45;
            const left_margin = parameters.left_margin ? Number(parameters.left_margin) : 80;

            // If the graph type is bar
            if (parameters.graph_type == 'bar') {      

                // Create x axis labels
                const xAxisLabels = Plot.axisX(domain, {
                    domain: domain,
                    type: 'band',
                    tickFormat: x_tick_format,
                    tickRotate:  x_rotate,
                    fontSize: x_label_size, 
                });

                // Create x axis title
                const xAxisTitle = Plot.axisX({
                    domain: domain,
                    type: 'band',
                    label:  getFieldLabel(parameters.categorical_field),
                    labelOffset: x_title_offset,
                    ticks: null,
                    tickFormat: null,
                    fontSize: x_title_size
                });

                // Create y axis labels
                const yAxisLabels = Plot.axisY({
                    label: null,
                    tickFormat: y_tick_format,
                    tickRotate: y_rotate,
                    fontSize: y_label_size
                });

                // Create y axis title
                const yAxisTitle = Plot.axisY({
                    label: parameters.numeric_field ? getFieldLabel(parameters.numeric_field) : module.tt('count'),
                    labelAnchor: 'center',
                    labelOffset: y_title_offset,
                    fontSize: y_title_size,
                    tick: null,
                    tickFormat: d=>''
                });

                // Create a bar chart
                const bars = Plot.barY(barHeights, {
                    domain: domain,
                    x: d => d.key,
                    y: 'value',
                    fill: d=>colorScale(d.key)
                });

                var graph = Plot.plot({
                    x: {
                        domain: domain,
                        type: 'band'
                    },
                    y: {
                        type: 'linear'
                    },
                    marks: [
                        yAxisTitle,
                        yAxisLabels,
                        xAxisTitle,
                        xAxisLabels,
                        bars
                    ],
                    marginLeft: parameters.left_margin ? parameters.left_margin : 80,
                    marginBottom: bottom_margin
                });

                return graph;
            }
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

            // Create a div to hold the more options
            var moreOptionsDiv = document.createElement('div');
            moreOptionsDiv.setAttribute('class', 'AG-editor-more-options');

            // Create a radio selector to select between bar and pie graphs
            var graphTypeRadioSelector = createRadioSelector('graph_type', [{'value': 'bar', 'label': module.tt('bar')}, {'value': 'pie', 'label': module.tt('pie')}], 'bar');

            // Create a help object for the graph type radio selector
            var graphTypeRadioSelectorHelp = {
                title: module.tt('bar_graph_type'),
                content: module.tt('bar_graph_type_help')
            }

            // When the value of graph_type changes, set the moreOptionsDiv to the appropriate div
            graphTypeRadioSelector.addEventListener('change', function() {
                // If the radio option 'bar' is selected
                if (graphTypeRadioSelector.querySelector('input[value="bar"]').checked) {
                    // Set the moreOptionsDiv to the barMoreOptionsDiv
                    moreOptionsDiv.innerHTML = '';
                    var barMoreOptionsDiv = moreOptions([
                        fillDiv([
                            (function () {
                                var label = document.createElement('label');
                                label.innerHTML = module.tt('show_legend');
                                return label;
                            })(),
                            createInput({
                                'name': 'show_legend',
                                'type': 'checkbox',
                                'value': true,
                                'checked': true
                            })
                        ]),
                        fillDiv([
                            fillDiv([
                                (function () {
                                    var label = document.createElement('label');
                                    label.innerHTML = module.tt('x_axis_options');
                                    label.style.fontSize = '1.2em';
                                    return label;
                                })(),
                                createOptionalInput(createInput({
                                    'name': 'x_title_offset',
                                    'label': module.tt('x_title_offset'),
                                    'type': 'number',
                                    'value': 40
                                }), 
                                module.tt('x_title_offset'),
                                {
                                    title: module.tt('x_title_offset'),
                                    content: module.tt('x_title_offset_help')}
                                ),
                                
                                createOptionalInput(createInput({
                                    'name': 'x_title_size',
                                    'label': module.tt('x_title_size'),
                                    'type': 'number',
                                    'value': 15
                                }), 
                                module.tt('x_title_size'),
                                {
                                    title: module.tt('x_title_size'),
                                    content: module.tt('x_title_size_help')}
                                ),

                                createOptionalInput(fillDiv([
                                    createRadioSelector('x_title_limit', [{'value': 'wrap', 'label': module.tt('wrap')}, {'value': 'truncate', 'label': module.tt('truncate')}], 'wrap'),
                                    createInput({
                                        'name': 'x_title_length',
                                        'label': module.tt('x_title_length'),
                                        'type': 'number',
                                        'value': 40
                                    })
                                ]), 
                                module.tt('x_title_length'),
                                {
                                    title: module.tt('x_title_length'),
                                    content: module.tt('x_title_length_help')}
                                ),

                                createOptionalInput(
                                    createInput({
                                        'name': 'x_label_size',
                                        'label': module.tt('x_label_size'),
                                        'type': 'number',
                                        'value': 12
                                    }), 
                                    module.tt('x_label_size'),
                                    {
                                        title: module.tt('x_label_size'),
                                        content: module.tt('x_label_size_help')
                                    }),

                                createOptionalInput(fillDiv([
                                    createRadioSelector('x_label_limit', [{'value': 'wrap', 'label': module.tt('wrap')}, {'value': 'truncate', 'label': module.tt('truncate')}], 'wrap'),
                                    createInput({
                                        'name': 'x_label_length',
                                        'label': module.tt('x_label_length'),
                                        'type': 'number',
                                        'value': 20
                                    })
                                ]),
                                module.tt('x_label_length'),
                                {
                                    title: module.tt('x_label_length'),
                                    content: module.tt('x_label_length_help')
                                }),

                                createOptionalInput(createInput({
                                    'name': 'x_label_rotation',
                                    'label': module.tt('x_label_rotation'),
                                    'type': 'number',
                                    'value': 0
                                }), 
                                module.tt('x_label_rotation'),
                                {
                                    title: module.tt('x_label_rotation'),
                                    content: module.tt('x_label_rotation_help')
                                })
                            ], 'AG-editor-graph-options-x-axis-options'),

                            fillDiv([
                                (function () {
                                    var label = document.createElement('label');
                                    label.innerHTML = module.tt('y_axis_options');
                                    label.style.fontSize = '1.2em';
                                    return label;
                                })(),
                                createOptionalInput(
                                    createInput({
                                        'name': 'y_title_offset',
                                        'label': module.tt('y_title_offset'),
                                        'type': 'number',
                                        'value': 80
                                    }), 
                                    module.tt('y_title_offset'),
                                    {
                                        title: module.tt('y_title_offset'),
                                        content: module.tt('y_title_offset_help')
                                    }),
                                createOptionalInput(
                                    createInput({
                                        'name': 'y_title_size',
                                        'label': module.tt('y_title_size'),
                                        'type': 'number',
                                        'value': 0
                                    }), 
                                    module.tt('y_title_size'),
                                    {
                                        title: module.tt('y_title_size'),
                                        content: module.tt('y_title_size_help')
                                    }),
                                createOptionalInput(
                                    fillDiv([
                                        createRadioSelector('y_title_limit', [{'value': 'wrap', 'label': module.tt('wrap')}, {'value': 'truncate', 'label': module.tt('truncate')}], 'wrap'),
                                        createInput({
                                            'name': 'y_title_length',
                                            'label': module.tt('y_title_length'),
                                            'type': 'number',
                                            'value': 40
                                        })
                                    ]), 
                                    module.tt('y_title_length'),
                                    {
                                        title: module.tt('y_title_length'),
                                        content: module.tt('y_title_length_help')
                                    }),
                                createOptionalInput(
                                    createInput({
                                        'name': 'y_label_size',
                                        'label': module.tt('y_label_size'),
                                        'type': 'number',
                                        'value': 12
                                    }), 
                                    module.tt('y_label_size'),
                                    {
                                        title: module.tt('y_label_size'),
                                        content: module.tt('y_label_size_help')
                                    }),
                                createOptionalInput(fillDiv([
                                    createRadioSelector('y_label_limit', [{'value': 'wrap', 'label': module.tt('wrap')}, {'value': 'truncate', 'label': module.tt('truncate')}], 'wrap'),
                                    createInput({
                                        'name': 'y_label_length',
                                        'label': module.tt('y_label_length'),
                                        'type': 'number',
                                        'value': 20
                                    })
                                ]),
                                module.tt('y_label_length'),
                                {
                                    title: module.tt('y_label_length'),
                                    content: module.tt('y_label_length_help')
                                }),
                                createOptionalInput(createInput({
                                    'name': 'y_label_rotation',
                                    'label': module.tt('y_label_rotation'),
                                    'type': 'number',
                                    'value': 0
                                }), 
                                module.tt('y_label_rotation'),
                                {
                                    title: module.tt('y_label_rotation'),
                                    content: module.tt('y_label_rotation_help')
                                })
                            ], 'AG-editor-graph-options-y-axis-options'),
                        ], 'AG-editor-graph-options-axis-options')
                    ]);

                    moreOptionsDiv.appendChild(barMoreOptionsDiv);
                }
                // If the radio option 'pie' is selected
                else if (graphTypeRadioSelector.value == 'pie') {
                    // Set the moreOptionsDiv to the pieMoreOptionsDiv
                    moreOptionsDiv.innerHTML = '';
                    var pieMoreOptionsDiv = moreOptions([
                        document.createTextNode("TEST")
                    ]);

                    moreOptionsDiv.appendChild(pieMoreOptionsDiv);
                }
            });

             // Trigger the change event on the graph type radio selector
             graphTypeRadioSelector.dispatchEvent(new Event('change'));
            



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

            // Create a radio selector to select between keeping or dropping unused categories
            var unusedCategoriesRadioSelector = createRadioSelector('unused_categories', [{'value': 'keep', 'label': module.tt('keep')}, {'value': 'drop', 'label': module.tt('drop')}], 'keep');

            // Create a help object for the unused categories radio selector
            var unusedCategoriesRadioSelectorHelp = {
                title: module.tt('unused_categories'),
                content: module.tt('unused_categories_help')
            }

            // Create a parameter div for the unused categories radio selector
            var unusedCategoriesRadioSelectorParameterDiv = createParameterDiv(unusedCategoriesRadioSelector, module.tt('unused_categories'), unusedCategoriesRadioSelectorHelp);

            // Add the unused categories radio selector to the left div
            leftDiv.appendChild(unusedCategoriesRadioSelectorParameterDiv);

            // Create a right div
            var rightDiv = document.createElement('div');
            rightDiv.setAttribute('class', 'AG-editor-graph-options-right');

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

            // Add the numeric field selector to the right div
            rightDiv.appendChild(numericFieldParameterDiv);

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
            rightDiv.appendChild(missingValueRadioSelectorParameterDiv);

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
            rightDiv.appendChild(aggregationFunctionParameterDiv);


            // Create an invisible checkbox to determine whether the option group of the numeric field has the data-group attribute set to count
            var numericFieldCountCheckbox = document.createElement('input');
            numericFieldCountCheckbox.setAttribute('type', 'checkbox');
            numericFieldCountCheckbox.setAttribute('name', 'numeric_field_count');
            numericFieldCountCheckbox.setAttribute('style', 'display: none;');
            numericFieldCountCheckbox.setAttribute('value', 'is_count');

            // Add the numeric field count checkbox to the left div
            rightDiv.appendChild(numericFieldCountCheckbox);

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

            // Create a div for the more options details element that will contain more input elements

            // Create a colors selector modal
            var colorsSelectorModal = createColorsSelectorModal('palette_brewer');

            // Create a help object for the colors selector modal
            var colorsSelectorModalHelp = {
                title: module.tt('bar_colors'),
                content: module.tt('bar_colors_help')
            };



            // Create a parameter div for the colors selector
            var colorsParameterDiv = createParameterDiv(colorsSelectorModal, module.tt('bar_colors'), colorsSelectorModalHelp);

            // Add the colors selector to the left div
            leftDiv.appendChild(colorsParameterDiv);
            

            // Create a right div

            // Add the left div to the graph options div
            graphOptionsDiv.appendChild(leftDiv);

            // Add the right div to the graph options div
            graphOptionsDiv.appendChild(rightDiv);

            // Add the more options div to the graph options div
            graphOptionsDiv.appendChild(moreOptionsDiv);


            // Return the graph options div
            return graphOptionsDiv;
        }

        // A function that creates additional options for the graph
        var moreOptions = function(parameters) {
            // Create a div for the more options
            var moreOptionsDiv = document.createElement('div');

            // Create a details element for the more options div
            var moreOptionsDetails = document.createElement('details');

            // Create a summary element for the more options details element
            var moreOptionsSummary = document.createElement('summary');

            // Create a text node for the summary element
            var moreOptionsSummaryText = document.createTextNode(module.tt('more_options'));

            // Add the text node to the summary element
            moreOptionsSummary.appendChild(moreOptionsSummaryText);

            // Create a div for the more options details element that will contain more input elements
            var moreOptionsInputs = document.createElement('div');
            moreOptionsInputs.setAttribute('class', 'AG-editor-graph-options-more-options-inputs');

            // For each parameter in parameters
            for (var key in parameters) {
                // If the more option is not null
                if (parameters[key]) {
                    // Add the more option to the more options inputs div
                    moreOptionsInputs.appendChild(parameters[key]);
                }
            }

            // Add the summary element to the details element
            moreOptionsDetails.appendChild(moreOptionsSummary);

            // Add the more options inputs div to the details element
            moreOptionsDetails.appendChild(moreOptionsInputs);

            // Add the details element to the more options div
            moreOptionsDiv.appendChild(moreOptionsDetails);

            // Return the more options div
            return moreOptionsDiv;
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
        var non_repeat_instrument_name = '';
        var non_repeat_instrument_label = module.tt('non_repeat_instrument_label');

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

    // A function that returns the field label give a field name
    function getFieldLabel(field_name) {
        return getField(field_name).field_label;
    }

    // A function that takes a checkbox field name and returns a report that has been transformed into a longer format
    function getCheckboxReport(report, checkbox_field) {
        // If the field is a string, get the field from the data dictionary
        if (typeof checkbox_field === 'string') {
            checkbox_field = getField(checkbox_field);
        }

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
                    

    // A function that parses a fields select_choices_or_calculations string
    function parseChoicesOrCalculations(field) {
        // If the field is a string, get the field from the data dictionary
        if (typeof field === 'string') {
            field = getField(field);
        }

        // If the field is not a radio field, return an empty object
        if (!isRadioField(field)) {
            return {};
        }

        // Get the choices or calculations string
        var choices_or_calculations = field.select_choices_or_calculations;

        // If the choices or calculations string is empty, return an empty array
        if (choices_or_calculations === '') {
            if (field.field_type === 'yesno') {
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
            }

            return {};
        }


        // Split the choices or calculations string by |
        var choices_or_calculations_array = choices_or_calculations.split('|');

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
            choice_or_calculation_label = choice_or_calculation_label.trim();

            // Add the parsed choice or calculation to the array
            parsed_choices_or_calculations[choice_or_calculation_value] = choice_or_calculation_label;
        }

        return parsed_choices_or_calculations;
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

    // A function that wraps a string given a max width
    function wrapString(str, maxWidth) {
        var newLineStr = "\n";
        var done = false;
        var res = '';
        while (str.length > maxWidth) {
            var found = false;
            // Inserts new line at first whitespace of the line
            for (var i = maxWidth - 1; i >= 0; i--) {
                if (testWhite(str.charAt(i))) {
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
    function truncateString(str, maxWidth) {
        if (str.length > maxWidth) {
            return str.slice(0, maxWidth - 3) + '...';
        } else {
            return str;
        }
    }

    // A function that measures the length a string of text
    //https://stackoverflow.com/a/48172630
    function measureText(str, fontSize) {
        const widths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.2796875,0.2765625,0.3546875,0.5546875,0.5546875,0.8890625,0.665625,0.190625,0.3328125,0.3328125,0.3890625,0.5828125,0.2765625,0.3328125,0.2765625,0.3015625,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.2765625,0.2765625,0.584375,0.5828125,0.584375,0.5546875,1.0140625,0.665625,0.665625,0.721875,0.721875,0.665625,0.609375,0.7765625,0.721875,0.2765625,0.5,0.665625,0.5546875,0.8328125,0.721875,0.7765625,0.665625,0.7765625,0.721875,0.665625,0.609375,0.721875,0.665625,0.94375,0.665625,0.665625,0.609375,0.2765625,0.3546875,0.2765625,0.4765625,0.5546875,0.3328125,0.5546875,0.5546875,0.5,0.5546875,0.5546875,0.2765625,0.5546875,0.5546875,0.221875,0.240625,0.5,0.221875,0.8328125,0.5546875,0.5546875,0.5546875,0.5546875,0.3328125,0.5,0.2765625,0.5546875,0.5,0.721875,0.5,0.5,0.5,0.3546875,0.259375,0.353125,0.5890625]
        const avg = 0.5279276315789471

        return Array.from(str).reduce(
          (acc, cur) => acc + (widths[cur.charCodeAt(0)] ?? avg), 0
        ) * fontSize
      }

    async function newDashboard() {
        try {
            var result = await module.ajax('newDashboard', module.getUrlParameter('report_id'));
            return JSON.parse(result);
        } catch (error) {
            // Create a modal telling the user that the dashboard could not be saved
            var errorModal = createModalDialog(module.tt('error'), module.tt('error_saving_dashboard'), [
                {
                    label: module.tt('ok'),
                    className: 'btn btn-primary',
                    callback: function () {
                        closeModalDialog();
                    }
                }
            ]);

            document.body.append(errorModal);
        }
    }
    // A function that serializes the dashboard and saves it to the server
    async function saveDashboard() {
        // If the dashboard is empty
        if (Object.keys(dashboard).length === 0 || dashboard.length === 0) {
            // Create a new dashboard
            dashboard = await newDashboard();
        }

        console.log(dashboard);

        // Get the div that holds the dahsboard options
        var dashboard_options = document.getElementById('AG-dashboard-options');

        // Get the dashboard title by getting the value of the input with the name dash_title
        dashboard.title = dashboard_options.querySelector('input[name="dash_title"]').value;

        // Get the dashboard is_public option by getting the checked attribute of the checkbox with the name is_public
        dashboard.is_public = dashboard_options.querySelector('input[name="is_public"]').checked;



        // Clear the dashboard rows
        dashboard.body = [];

        // Get the div that holds the rows
        var table = document.getElementById('AG-editor-table');

        // Get the divs with the class AG-editor-row
        var rows = table.getElementsByClassName('AG-editor-row');

        // Loop through the rows
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            var serialized_row = [];

            // Get the cells div from the row (the div with the calss AG-editor-row-cells)
            var cells = row.getElementsByClassName('AG-editor-row-cells')[0];

            // For each cell in the row
            for (var j = 0; j < cells.children.length; j++) {
                // Get the graph container from the cell
                var graph_container = cells.children[j].getElementsByClassName('AG-editor-graph-container')[0];

                // Get the graph type selector from the cell
                var graph_type_selector = cells.children[j].getElementsByClassName('AG-editor-graph-type-selector')[0];

                // Get the value of the select element in the graph type selector
                var graph_type = graph_type_selector.getElementsByTagName('select')[0].value;

                // If the graph type is not a string
                if (typeof graph_type !== 'string') {
                    // Add an empty object to the serialized row
                    serialized_row.push({});
                    continue;
                }

                // Get the form element from the graph container
                var form = graph_container.getElementsByTagName('form')[0];

                // Serialize the form
                var serialized_form = form ? serializeForm(form) : {};

                // Add the cell with it's type and parameters to the serialized row
                serialized_row.push({
                    type: graph_type,
                    parameters: serialized_form
                });
            }

            // Add the serialized row to the dashboard
            dashboard.body.push(serialized_row);
        }
        console.log(dashboard);
        // Send the dashboard to the server
        module.ajax('saveDashboard', dashboard).then(function (result) {
            // If the dashboard was saved successfully
            console.log(result);
            console.log("tried to save");
            if (result) {
                result = JSON.parse(result);
                // Create a modal telling the user that the dashboard was saved successfully
                var successModal = createModalDialog(module.tt('success'), module.tt('dashboard_saved_successfully', result.name), [
                    {
                        label: module.tt('view_dashboard'),
                        className: 'btn btn-primary',
                        callback: function () {
                            closeModalDialog();
                            window.location.href = result.view_url;
                        }
                    },
                    {
                        label: module.tt('return_to_dashboards'),
                        className: 'btn btn-primary',
                        callback: function () {
                            closeModalDialog();
                            window.location.href = result.dash_list_url;
                        }
                    },
                    {
                        label: module.tt('continue_editing'),
                        className: 'btn btn-primary',
                        callback: function () {
                            closeModalDialog();
                        }
                    }
                ]);

                document.body.append(successModal);
            } else {
                // Create a modal telling the user that the dashboard could not be saved
                var errorModal = createModalDialog(module.tt('error'), module.tt('error_saving_dashboard'), [
                    {
                        label: module.tt('ok'),
                        className: 'btn btn-primary',
                        callback: function () {
                            closeModalDialog();
                        }
                    }
                ]);
            
                // Show the modal
                document.body.appendChild(errorModal);
            }
        }).catch(function (error) {
            console.log(error);
            // Create a modal telling the user that the dashboard could not be saved
            var errorModal = createModalDialog(module.tt('error'), module.tt('error_saving_dashboard'), [
                {
                    label: module.tt('ok'),
                    className: 'btn btn-primary',
                    callback: function () {
                        closeModalDialog();
                    }
                }
            ]);

            // Show the modal
            document.body.appendChild(errorModal);
        });
    }







    // A function that creates a formData object from the form and turns it into an object 
    function serializeForm(form) {
        var formData = new FormData(form);
        var object = {};
        for (const key of formData.keys()) {
            const value = formData.getAll(key);

            if (!value.length)
                continue;

            if (value.length == 1) {
                object[key] = value[0];
                continue;
            }

            object[key] = value;
        }
        return object;
    }
}
