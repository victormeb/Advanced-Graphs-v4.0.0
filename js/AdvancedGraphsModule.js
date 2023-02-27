// Create a class that will be used to create a module for the dashboard editor
var AdvancedGraphsModule = function (module, dashboard, data_dictionary, report, report_fields) {
    this.version = '1.0';
    this.authors = 'Victor Esposita, Joel Cohen, David Cherry, and others';
    this.email = '';

    this.module = module;
    this.dashboard = dashboard;
    this.data_dictionary = data_dictionary;
    this.report = report;
    this.report_fields = report_fields;

    this.categorical_fields = {'field1': 'Field one', 'field2': 'Field two', 'field3': 'Field three'};
    this.numerical_fields = {'field1': 'Field one', 'field2': 'Field two', 'field3': 'Field three'};
    this.date_fields = {'field1': 'Field one', 'field2': 'Field two', 'field3': 'Field three'};
    this.text_fields = {'field1': 'Field one', 'field2': 'Field two', 'field3': 'Field three'};

    this.loadDashboardEditor = function () {
        // Add a button to the dashboard editor that will add a row to the dashboard with a graph selector
        var addGraphSelectorRowButton = document.createElement('button');
        addGraphSelectorRowButton.setAttribute('class', 'addGraphSelectorRowButton');
        addGraphSelectorRowButton.innerHTML = this.module.tt('add_row');
        var dashboardEditor = document.getElementById('dashboard_editor');
        dashboardEditor.appendChild(addGraphSelectorRowButton);

        // When the button is clicked, add a row with a graph selector
        addGraphSelectorRowButton.addEventListener('click', function (event) {
            var dashboardTable = document.getElementById('dashboard_table');

            dashboardTable.appendChild(this.addGraphSelectorRow());
            
        }.bind(this));

    };

    // A function to add a row with a single graph selector cell.
    this.addGraphSelectorRow = function () {
        var AGM = this;

        var graphSelectorRow = document.createElement('div');
        graphSelectorRow.setAttribute('class', 'graphSelectorRow');

        var graphSelectorCell = this.addGraphSelector();
        graphSelectorRow.appendChild(graphSelectorCell);


        // Append this row to the advanced_graphs_dashboard div
        var advancedGraphsDashboard = document.getElementById('dashboard_table');
        advancedGraphsDashboard.appendChild(graphSelectorRow);

        // Add a button that moves this row up
        var moveGraphSelectorRowUpButton = document.createElement('button');
        moveGraphSelectorRowUpButton.setAttribute('class', 'moveGraphSelectorRowUpButton');
        moveGraphSelectorRowUpButton.innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';

        // When this button is clicked, move this row up
        moveGraphSelectorRowUpButton.addEventListener('click', function (event) {
            // Get the index of this row
            var graphSelectorRowIndex = Array.prototype.indexOf.call(graphSelectorRow.parentNode.children, graphSelectorRow);
            
            // If this row is not the first row, move it up
            if (graphSelectorRowIndex > 0) {
                // Get the row above this row
                var rowAboveGraphSelectorRow = graphSelectorRow.parentNode.children[graphSelectorRowIndex - 1];
                
                // Move this row above the row above this row
                graphSelectorRow.parentNode.insertBefore(graphSelectorRow, rowAboveGraphSelectorRow);
            }
        });

        // Add a button that moves this row down
        var moveGraphSelectorRowDownButton = document.createElement('button');
        moveGraphSelectorRowDownButton.setAttribute('class', 'moveGraphSelectorRowDownButton');
        moveGraphSelectorRowDownButton.innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';

        // When this button is clicked, move this row down
        moveGraphSelectorRowDownButton.addEventListener('click', function (event) {
            // Get the index of this row
            var graphSelectorRowIndex = Array.prototype.indexOf.call(graphSelectorRow.parentNode.children, graphSelectorRow);

            // If this row is not the last row, move it down
            if (graphSelectorRowIndex < graphSelectorRow.parentNode.children.length - 1) {
                // Get the row below this row
                var rowBelowGraphSelectorRow = graphSelectorRow.parentNode.children[graphSelectorRowIndex + 1];

                // Move this row below the row below this row
                graphSelectorRow.parentNode.insertBefore(rowBelowGraphSelectorRow, graphSelectorRow);
            }
        });


        // Add a button to the row that removes this row
        var removeGraphSelectorRowButton = document.createElement('button');
        removeGraphSelectorRowButton.setAttribute('class', 'removeGraphSelectorRowButton');
        removeGraphSelectorRowButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

        // When this button is clicked, open a modal that asks the user to confirm that they want to remove this row
        removeGraphSelectorRowButton.addEventListener('click', function (event) {
            // Create a modal that asks the user to confirm that they want to remove this row
            AGM.createConfirmModalDialog(function () {
                // If the user confirms that they want to remove this row, remove this row
                graphSelectorRow.parentNode.removeChild(graphSelectorRow);
            }, AGM.module.tt('remove_row_confirm'));

        });

        // Create a cell to hold the buttons
        var buttonsCell = document.createElement('div');
        buttonsCell.setAttribute('class', 'graphSelectorRowButtons');

        // Add the buttons to the cell
        buttonsCell.appendChild(moveGraphSelectorRowUpButton);
        buttonsCell.appendChild(moveGraphSelectorRowDownButton);
        buttonsCell.appendChild(removeGraphSelectorRowButton);

        // Add the cell to the row
        graphSelectorRow.appendChild(buttonsCell);

        return graphSelectorRow;
    };

    this.addGraphSelector = function () {
        // Create a cell that will contain a button that adds a graph selector cell along with this cell
        var cell = document.createElement('div');
        cell.setAttribute('class', 'graphSelectorAdderCell');

        // Create a button that adds a graph selector cell along with this cell
        var addGraphSelectorButton = document.createElement('button');
        addGraphSelectorButton.setAttribute('class', 'addGraphSelectorButton');
        addGraphSelectorButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

        // When this button is clicked, add a graph selector cell along with this cell
        addGraphSelectorButton.addEventListener('click', function (event) {
            // Get the row that contains this cell
            var graphSelectorRow = cell.parentNode;

            // Get the index of this cell
            var graphSelectorCellIndex = Array.prototype.indexOf.call(graphSelectorRow.children, cell);

            // Add a graph selector cell along with this cell
            graphSelectorRow.insertBefore(this.GraphSelector(), graphSelectorRow.children[graphSelectorCellIndex + 1]);

            // Add a graphSelectorAdderCell to the right of the added graphSelectorCell
            graphSelectorRow.insertBefore(this.addGraphSelector(), graphSelectorRow.children[graphSelectorCellIndex + 2]);
        }.bind(this));

        // Add the button to the cell
        cell.appendChild(addGraphSelectorButton);

        return cell;
    }

    this.GraphSelector = function () {
        var AGM = this;
        // Create a cell that will contain the graph selector and the graph form
        var cell = document.createElement('div');
        cell.setAttribute('class', 'graphSelectorCell');

        // Create a div that will contain the graph selector and a div that will contain the graph form
        var graphSelectorDiv = document.createElement('div');
        graphSelectorDiv.setAttribute('class', 'graphSelectorDiv');
        var graphFormDiv = document.createElement('div');
        graphFormDiv.setAttribute('class', 'graphFormDiv');

        // Create a button to move the selected GraphSelector to the left
        var moveGraphSelectorLeftButton = document.createElement('button');
        moveGraphSelectorLeftButton.setAttribute('class', 'moveGraphSelectorLeftButton');
        moveGraphSelectorLeftButton.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true"></i>';

        // When this button is clicked, move the selected graphSelector to the left by moving the selected graphSelectorCell to the left
        moveGraphSelectorLeftButton.addEventListener('click', function (event) {
            var graphSelectorRow = cell.parentNode;
            var graphSelectorCell = cell;
            var graphSelectorRowCells = graphSelectorRow.childNodes;
            var graphSelectorCellIndex = 0;
            for (var i = 0; i < graphSelectorRowCells.length; i++) {
                if (graphSelectorRowCells[i] == graphSelectorCell) {
                    graphSelectorCellIndex = i;
                }
            }
            // Move the selected graphSelectorCell to the left of the button to the left of it
            if (graphSelectorCellIndex > 0) {
                graphSelectorRow.insertBefore(graphSelectorCell, graphSelectorRow.childNodes[graphSelectorCellIndex - 1]);
            }
        });

         // Create a new graph selector
        var graphSelector = document.createElement('select');
        graphSelector.setAttribute('class', 'graphSelector');

        let graphTypes = this.getGraphTypes(); 

        for (let graphType in graphTypes) {
            if (!graphTypes[graphType])
                continue;

            let option = document.createElement('option');
            option.setAttribute('value', graphType);
            option.innerHTML = graphType;
            this.graphSelector.appendChild(option);

            // when this option gets selected, fill the graph form div with the form for the selected graph type
            option.addEventListener('click', function (event) {
                graphFormDiv.innerHTML = '';
                graphFormDiv.appendChild(graphTypes[event.target.value]);
            });
        }



        // Create a button to remove the selected GraphSelector and the button to the right of it
        var removeGraphSelectorButton = document.createElement('button');
        removeGraphSelectorButton.setAttribute('class', 'removeGraphSelectorButton');
        removeGraphSelectorButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

        // When this button is clicked, remove the selected graphSelector and the button to the right of it
        removeGraphSelectorButton.addEventListener('click', function (event) {
            var graphSelectorRow = cell.parentNode;
            var graphSelectorCell = cell;
            var graphSelectorRowCells = graphSelectorRow.childNodes;
            var graphSelectorCellIndex = 0;
            for (var i = 0; i < graphSelectorRowCells.length; i++) {
                if (graphSelectorRowCells[i] == graphSelectorCell) {
                    graphSelectorCellIndex = i;
                }
            }

            // Remove the selected graphSelector and the button to the right of it
            graphSelectorRow.removeChild(graphSelectorRowCells[graphSelectorCellIndex]);
            graphSelectorRow.removeChild(graphSelectorRowCells[graphSelectorCellIndex]);
        });


        // Create a button to move the selected GraphSelector to the right
        var moveGraphSelectorRightButton = document.createElement('button');
        moveGraphSelectorRightButton.setAttribute('class', 'moveGraphSelectorRightButton');
        moveGraphSelectorRightButton.innerHTML = '<i class="fa fa-arrow-right" aria-hidden="true"></i>';

        // When this button is clicked, move the selected graphSelector to the right by moving the selected graphSelectorCell to the right
        moveGraphSelectorRightButton.addEventListener('click', function (event) {
            var graphSelectorRow = cell.parentNode;
            var graphSelectorCell = cell;
            var graphSelectorRowCells = graphSelectorRow.childNodes;
            var graphSelectorCellIndex = 0;
            for (var i = 0; i < graphSelectorRowCells.length; i++) {
                if (graphSelectorRowCells[i] == graphSelectorCell) {
                    graphSelectorCellIndex = i;
                }
            }
            // Move the selected graphSelectorCell to the right of the button to the right of it
            if (graphSelectorCellIndex < graphSelectorRowCells.length - 1) {
                graphSelectorRow.insertBefore(graphSelectorRowCells[graphSelectorCellIndex + 1], graphSelectorCell);
            }
        });

        // Add the left button, the graph selector, the right button, and the remove button to the graph selector div
        graphSelectorDiv.appendChild(moveGraphSelectorLeftButton);
        graphSelectorDiv.appendChild(graphSelector);
        graphSelectorDiv.appendChild(moveGraphSelectorRightButton);
        graphSelectorDiv.appendChild(removeGraphSelectorButton);

        // Add the graph selector div and the graph form div to the cell
        cell.appendChild(graphSelectorDiv);
        cell.appendChild(graphFormDiv);


        // Return cell
        return cell;
    };

    // A function that takes the data dictionary and the report and returns a dictionary of each type of graph with the corresponding form parameters.
    this.getGraphTypes = function () {
        // Bar and pie graphs are the same, except for the type of graph they are.
        var graphTypes = {
            "bar": this.getBargraphFormParameters(),
            "cross-bar": this.getCrossBargraphFormParameters(),
            "likert": this.getLikertFormParameters(),
            "map": this.getMapFormParameters(),
            "network": this.getNetworkFormParameters(),
            "table": this.getTableFormParameters()
        };
        return graphTypes;
    };

    // A function that uses the data_dictionary and the report to return the parameters needed to create a bar graph.
    this.getBargraphFormParameters = function () {
        if (this.categorical_fields.length < 1) {
            return null;
        }

        // Create a form to hold the parameters for the bargraph
        var bargraphForm = document.createElement('form');
        bargraphForm.setAttribute('class', 'bargraphForm');


        // return a radio button that lets you choose whether to display as pie chart or bar chart
        var graphTypeSelector = this.createRadioSelector({'bar': 'Bar', 'pie': 'Pie'}, 'graphTypeSelector', 'Graph Type');

        // return a selector that lets you choose the categorical field
        var categoricalFieldSelector = this.createFieldSelector(this.categorical_fields, 'categoricalFieldSelector', 'Categorical Field');

        // return a selector that lets you choose the numerical field or a count of each instance of the categorical field
        var numericalFieldSelector = this.createFieldSelector(this.numerical_fields, 'numericalFieldSelector', 'Numerical Field');
        var countOption = document.createElement('option');

        // Add an option group for the Count option
        var countOptionGroup = document.createElement('optgroup');
        countOptionGroup.setAttribute('label', 'Count');
        numericalFieldSelector.insertBefore(countOptionGroup, numericalFieldSelector.firstChild);
        
        // Add the Count option
        countOption.setAttribute('value', 'count');
        countOption.innerHTML = 'Count';
        countOptionGroup.appendChild(countOption);

        // if the numeric fields aren't empty, add a selctor for the aggregation function
        aggregationFunctionSelector = this.createAggregationFunctionSelector('aggregationFunctionSelector', 'Aggregation Function');

        // only show the aggregation function selector if the numerical field selector is not set to count
        var numericalFieldSelectorChange = function (event) {
            if (event.target.parentNode.label === 'Count') {
                aggregationFunctionSelector.setAttribute('disabled', 'disabled');
                aggregationFunctionSelector.value = 'none';
            } else {
                aggregationFunctionSelector.removeAttribute('disabled');
            }
        }

        // add the event listener to the numerical field selector
        numericalFieldSelector.addEventListener('change', numericalFieldSelectorChange);
        

        // add a radio option to display the graph, the table, or both the graph and the table
        var displaySelector = this.createRadioSelector({'graph': 'Graph', 'table': 'Table', 'both': 'Both'}, 'displaySelector', 'Display');

        // when table or both is selected, add the options that are avaiable to "summary" tables
        var summaryTableOptions = this.summaryTableOptions();

        // if both or table becomes selected
        var displaySelectorChange = function (event) {
            if (event.target.value === 'both' || event.target.value === 'table') {
                // add the summary table options
                this.cell.appendChild(summaryTableOptions);
            } else {
                // remove the summary table options
                this.cell.removeChild(summaryTableOptions);
            }
        }

        // add the event listener to the display selector
        displaySelector.addEventListener('change', displaySelectorChange.bind(this));

        // create a div to hold the preview of the graph
        var previewDiv = document.createElement('div');
        previewDiv.setAttribute('class', 'previewDiv');


        // add a preview button that is disabled by default
        var previewButton = this.createButton('Preview', 'previewButton', 'Preview', 'disabled');

        // when the categoricalFieldSelector is selected and the numerical field selector is selected, if the numerical field selector isn't count and the aggregate function is selected, enable the preview button 
        var previewButtonChange = function (event) {
            if (categoricalFieldSelector.value || numericalFieldSelector.value == 'count' || aggregationFunctionSelector.value !== 'none') {
                previewButton.removeAttribute('disabled');
            } else {
                previewButton.setAttribute('disabled', 'disabled');
            }
        }

        // when the button is clicked, create a preview of the graph by calling a wrapper to the d3 library that creates a bar (or pie) chart. Also, if the display selector is set to table or both, create a table preview from the "summary" table wrapper.
        var previewButtonClick = function (event) {
            // serialize the form data using this module's function
            var formData = this.serializeForm(bargraphForm);

            // call the d3 wrapper to create a bar (or pie) chart
            var bargraph = new this.Bargraph(this.report, formData);

            // if the display selector is set to table or both, create a table preview from the "summary" table wrapper
            if (formData.display === 'table' || formData.display === 'both') {
                var summaryTable = new this.SummaryTable(this.report, formData);
            }

            // if the display selector is set to graph or both, create a graph preview
            if (formData.display === 'graph' || formData.display === 'both') {
                // fill the preview div with the bargraph
                previewDiv.innerHTML = bargraph.getGraph();
            }

            // if the display selector is set to table or both, create a table preview
            if (formData.display === 'table' || formData.display === 'both') {
                // fill the preview div with the summary table
                previewDiv.innerHTML = summaryTable.getTable();
            }

        }

        // add the event listener to the categorical field selector, the numerical field selector, and the aggregation function selector
        categoricalFieldSelector.addEventListener('change', previewButtonChange);
        numericalFieldSelector.addEventListener('change', previewButtonChange);
        aggregationFunctionSelector.addEventListener('change', previewButtonChange);

        
        // Create a left hand side and right hand side of the form
        var leftSide = document.createElement('div');
        leftSide.setAttribute('class', 'leftSide');
        var rightSide = document.createElement('div');
        rightSide.setAttribute('class', 'rightSide');

        // add the graphTypeSelector categorical field selector, the numerical field selector, and the aggregation function selector to the left side of the form
        leftSide.appendChild(graphTypeSelector);
        leftSide.appendChild(categoricalFieldSelector);
        leftSide.appendChild(numericalFieldSelector);
        leftSide.appendChild(aggregationFunctionSelector);

        // add the display selector and the summary table options to the right side of the form
        rightSide.appendChild(displaySelector);
        rightSide.appendChild(summaryTableOptions);

        // add the left side and the right side to the form
        bargraphForm.appendChild(leftSide);
        bargraphForm.appendChild(rightSide);

        // add the preview div and preview button to the form
        bargraphForm.appendChild(previewDiv);
        bargraphForm.appendChild(previewButton);


        // return the form
        return bargraphForm;

    };

    this.Bargraph = function (report, formData) {
        // Use d3, the report and the formData to create a bargraph
        this.report = report;
        this.formData = formData;

        this.getGraph = function () {
            return '<div class="graphWrapper"><svg class="bargraph"></svg></div>';
        };

    };

    this.getCrossBargraphFormParameters = function() {
        return null;
    };

    this.getLikertFormParameters = function() {
        return null;
    };

    this.getMapFormParameters = function() {
        return null;
    };

    this.getNetworkFormParameters = function() {
        return null;
    };

    this.getTableFormParameters = function() {
        return null;
    };

    this.summaryTableOptions = function () {
        // for now display an div that contains the header pending
        var summaryTableOptions = document.createElement('div');
        summaryTableOptions.setAttribute('class', 'summaryTableOptions');
        summaryTableOptions.innerHTML = 'Summary Table Options';

        return summaryTableOptions;
    };
    

    this.summaryTable = function (report, formData) {
        // Use the report and the formData to create a summary table
        this.report = report;
        this.formData = formData;

        this.getTable = function () {
            return '<div class="tableWrapper"><table class="summaryTable"></table></div>';
        };

    };

    // Create a modal dialog
    this.createModalDialog = function (title, content, buttons) {
        // Create a modal dialog
        var modalDialog = document.createElement('div');
        modalDialog.setAttribute('class', 'modalDialog');

        // Create a modal dialog content
        var modalDialogContent = document.createElement('div');
        modalDialogContent.setAttribute('class', 'modalDialogContent');
        
        // Create a modal dialog title
        var modalDialogTitle = document.createElement('div');
        modalDialogTitle.setAttribute('class', 'modalDialogTitle');
        modalDialogTitle.innerHTML = title;

        // Create a modal dialog body
        var modalDialogBody = document.createElement('div');
        modalDialogBody.setAttribute('class', 'modalDialogBody');
        modalDialogBody.innerHTML = content;

        // Create a modal dialog footer
        var modalDialogFooter = document.createElement('div');
        modalDialogFooter.setAttribute('class', 'modalDialogFooter');

        // Create a modal dialog button
        var modalDialogButton = function (label, className, event) {
            var button = document.createElement('button');
            button.setAttribute('class', className);
            button.innerHTML = label;
            button.addEventListener('click', event);
            return button;
        }

        // Create a modal dialog button for each button in the buttons array
        for (var i = 0; i < buttons.length; i++) {
            modalDialogFooter.appendChild(modalDialogButton(buttons[i].label, buttons[i].class, buttons[i].event));
        }

        // Add the modal dialog title, body, and footer to the modal dialog content
        modalDialogContent.appendChild(modalDialogTitle);
        modalDialogContent.appendChild(modalDialogBody);
        modalDialogContent.appendChild(modalDialogFooter);

        // Add the modal dialog content to the modal dialog
        modalDialog.appendChild(modalDialogContent);

        // Add the modal dialog to the body
        document.body.appendChild(modalDialog);

        return modalDialog;
    };

    // Create a modal dialogue that confirms a user's action
    this.createConfirmModalDialog = function (action, content) {
        var buttons = [
            {'label': this.module.tt('cancel'),
            'class': 'modalCancelButton',
            'event': function (event) {
                event.preventDefault();
                this.parentNode.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode.parentNode);
            }},
            {'label': this.module.tt('confirm'), 
            'class': 'modalConfirmButton',
            'event': function(event) {
                event.preventDefault();
                this.parentNode.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode.parentNode);
                action();
            }}
        ];

        var modalDialog = this.createModalDialog('Are you sure?', content, buttons);

    }

    // Create a Radio Selector
    this.createRadioSelector = function (options, name, label) {
        var radioSelector = document.createElement('div');
        radioSelector.setAttribute('class', 'radioSelector');

        var radioSelectorLabel = document.createElement('label');
        radioSelectorLabel.innerHTML = label;
        radioSelector.appendChild(radioSelectorLabel);

        for (var option in options) {
            var radioOption = document.createElement('input');
            radioOption.setAttribute('type', 'radio');
            radioOption.setAttribute('name', name);
            radioOption.setAttribute('value', option);
            radioOption.innerHTML = options[option];
            radioSelector.appendChild(radioOption);
        }

        return radioSelector;

    };

    // Create a field selector
    this.createFieldSelector = function (fields, name, label) {
        var fieldSelector = document.createElement('div');
        fieldSelector.setAttribute('class', 'fieldSelector');

        var fieldSelectorLabel = document.createElement('label');
        fieldSelectorLabel.innerHTML = label;
        fieldSelector.appendChild(fieldSelectorLabel);

        var fieldSelectorSelect = document.createElement('select');
        fieldSelectorSelect.setAttribute('name', name);
        fieldSelector.appendChild(fieldSelectorSelect);

        var noneOption = document.createElement('option');
        noneOption.setAttribute('value', '');
        noneOption.innerHTML = 'None';
        fieldSelectorSelect.appendChild(noneOption);

        for (var field in fields) {
            var fieldOption = document.createElement('option');
            fieldOption.setAttribute('value', field);
            fieldOption.innerHTML = fields[field];
            fieldSelectorSelect.appendChild(fieldOption);
        }

        return fieldSelector;

    };

    // Create a checkbox selector
    this.createCheckboxSelector = function (options, name, label) {
        var checkboxSelector = document.createElement('div');
        checkboxSelector.setAttribute('class', 'checkboxSelector');

        var checkboxSelectorLabel = document.createElement('label');
        checkboxSelectorLabel.innerHTML = label;
        checkboxSelector.appendChild(checkboxSelectorLabel);

        for (var option in options) {
            var checkboxOption = document.createElement('input');
            checkboxOption.setAttribute('type', 'checkbox');
            checkboxOption.setAttribute('name', name);
            checkboxOption.setAttribute('value', option);
            checkboxOption.innerHTML = options[option];
            checkboxSelector.appendChild(checkboxOption);
        }

        return checkboxSelector;

    };

    // Create an aggregation function selector
    this.createAggregationFunctionSelector = function (name, label) {
        var aggregationFunctionSelector = document.createElement('div');
        aggregationFunctionSelector.setAttribute('class', 'aggregationFunctionSelector');

        var aggregationFunctionSelectorLabel = document.createElement('label');
        aggregationFunctionSelectorLabel.innerHTML = label;
        aggregationFunctionSelector.appendChild(aggregationFunctionSelectorLabel);

        var aggregationFunctionSelectorSelect = document.createElement('select');
        aggregationFunctionSelectorSelect.setAttribute('name', name);
        aggregationFunctionSelector.appendChild(aggregationFunctionSelectorSelect);

        var noneOption = document.createElement('option');
        noneOption.setAttribute('value', '');
        noneOption.innerHTML = 'None';
        aggregationFunctionSelectorSelect.appendChild(noneOption);

        // Sum option
        var sumOption = document.createElement('option');
        sumOption.setAttribute('value', 'sum');
        sumOption.innerHTML = 'Sum';

        // Average option
        var averageOption = document.createElement('option');
        averageOption.setAttribute('value', 'average');
        averageOption.innerHTML = 'Average';

        // Min option
        var minOption = document.createElement('option');
        minOption.setAttribute('value', 'min');
        minOption.innerHTML = 'Min';

        // Max option
        var maxOption = document.createElement('option');
        maxOption.setAttribute('value', 'max');
        maxOption.innerHTML = 'Max';

        aggregationFunctionSelectorSelect.appendChild(sumOption);
        aggregationFunctionSelectorSelect.appendChild(averageOption);
        aggregationFunctionSelectorSelect.appendChild(minOption);
        aggregationFunctionSelectorSelect.appendChild(maxOption);

        return aggregationFunctionSelector;

    };


    // Create a button
    this.createButton = function (label, name, value) {
        var button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('name', name);
        button.setAttribute('value', value);
        button.innerHTML = label;

        return button;
    };
    



    // Turns a form into a JSON object
    this.serializeForm = function (form) {
        var serializedForm = {};
        for (var i = 0; i < form.elements.length; i++) {
            var element = form.elements[i];
            if (element.type === 'radio' && element.checked) {
                serializedForm[element.name] = element.value;
            } else if (element.type === 'checkbox' && element.checked) {
                if (!serializedForm[element.name]) {
                    serializedForm[element.name] = [];
                }
                serializedForm[element.name].push(element.value);
            } else if (element.type !== 'radio' && element.type !== 'checkbox') {
                serializedForm[element.name] = element.value;
            }
        }
        return serializedForm;
    }
};
