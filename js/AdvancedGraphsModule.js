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
        var graphSelectorRow = document.createElement('div');
        graphSelectorRow.setAttribute('class', 'graphSelectorRow');

        // Add a button that adds a graph selector cell to the row.
        var graphSelectorAdder = this.addGraphSelector();
        graphSelectorRow.appendChild(graphSelectorAdder);

        // Create a div that will hold the graph selectors
        var graphSelectors = document.createElement('div');
        graphSelectors.setAttribute('class', 'graphSelectors');

        // Add the graph selectors div to the row
        graphSelectorRow.appendChild(graphSelectors);


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
            this.createConfirmModalDialog(function () {
                // If the user confirms that they want to remove this row, remove this row
                graphSelectorRow.parentNode.removeChild(graphSelectorRow);
            }, this.module.tt('remove_row_confirm'));

        }.bind(this));

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
        // Create a button that adds a graph selector cell along with this cell
        var addGraphSelectorButton = document.createElement('button');
        addGraphSelectorButton.setAttribute('class', 'addGraphSelectorButton');
        addGraphSelectorButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';



        // When this button is clicked, add a graph selector cell to the beginning of the graphSelectors div in the row that contains this button
        addGraphSelectorButton.addEventListener('click', function (event) {
            // Get the row that contains this button
            var graphSelectorRow = addGraphSelectorButton.parentNode;

            // Get the graphSelectors div in this row
            var graphSelectors = graphSelectorRow.getElementsByClassName('graphSelectors')[0];

            // Add a graph selector cell to the beginning of the graphSelectors div
            graphSelectors.insertBefore(this.GraphSelector(), graphSelectors.children[0]);
        }.bind(this));

        return addGraphSelectorButton;
    }

    this.GraphSelector = function () {
        var AGM = this;
        // Create a cell that will contain the graph selector and the graph form
        var cell = document.createElement('div');
        cell.setAttribute('class', 'graphSelectorCell');

        // Create a div that will contain the graph selector inputs
        var graphSelectorButtons = document.createElement('div');
        graphSelectorButtons.setAttribute('class', 'graphSelectorButtons');

        // Create an arrow that will move the graph selector cell to the left
        var moveGraphSelectorCellLeftButton = document.createElement('button');
        moveGraphSelectorCellLeftButton.setAttribute('class', 'graphSelectorArrow');
        moveGraphSelectorCellLeftButton.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true"></i>';

        // When this button is clicked, move the graph selector cell to the left
        moveGraphSelectorCellLeftButton.addEventListener('click', function (event) {
            // Get the row that contains this cell
            var graphSelectorRow = cell.parentNode;

            // Get the index of this cell
            var graphSelectorCellIndex = Array.prototype.indexOf.call(graphSelectorRow.children, cell);

            // If this cell is not the first cell, move it to the left
            if (graphSelectorCellIndex > 0) {
                // Get the cell to the left of this cell
                var cellToLeftOfGraphSelectorCell = graphSelectorRow.children[graphSelectorCellIndex - 1];

                // Move this cell to the left of the cell to the left of this cell
                graphSelectorRow.insertBefore(cell, cellToLeftOfGraphSelectorCell);
            }
        }.bind(this));

        // Create a div that will contain the graph selector and a div that will contain the graph form
        var graphSelectorDiv = document.createElement('div');
        graphSelectorDiv.setAttribute('class', 'graphSelectorDiv');

        // Create a new graph selector
        var graphSelector = document.createElement('select');
        graphSelector.setAttribute('class', 'graphSelector');

        // Add a disabled default option
        var defaultOption = document.createElement('option');
        defaultOption.setAttribute('value', '');
        defaultOption.setAttribute('disabled', 'disabled');
        defaultOption.setAttribute('selected', 'selected');
        defaultOption.innerHTML = this.module.tt('select_graph_type');
        graphSelector.appendChild(defaultOption);

        // Add an option for each graph type
        let graphTypes = this.getGraphTypes(); 

        for (let graphType in graphTypes) {
            if (!graphTypes[graphType]['form'])
                continue;

            let option = document.createElement('option');
            option.setAttribute('value', graphType);
            option.innerHTML = graphTypes[graphType]['label'];
            graphSelector.appendChild(option);
        }

        // When the graph selector changes, show the graph form for the selected graph type
        graphSelector.addEventListener('change', function (event) {
            // Get the graph form div
            var graphFormDiv = cell.getElementsByClassName('graphFormDiv')[0];

            // Remove all the children of the graph form div
            while (graphFormDiv.firstChild) {
                graphFormDiv.removeChild(graphFormDiv.firstChild);
            }

            // If a graph type was selected, show the graph form for that graph type
            if (graphSelector.value) {
                // Get the graph form for the selected graph type
                var graphForm = graphTypes[graphSelector.value]['form'];

                // Add the graph form to the graph form div
                graphFormDiv.appendChild(graphForm);
            }
        }.bind(this));

        // Add the graph selector to the graph selector div
        graphSelectorDiv.appendChild(graphSelector);

        // Create a button that will move the graph selector cell to the right
        var moveGraphSelectorCellRightButton = document.createElement('button');
        moveGraphSelectorCellRightButton.setAttribute('class', 'graphSelectorArrow');
        moveGraphSelectorCellRightButton.innerHTML = '<i class="fa fa-arrow-right" aria-hidden="true"></i>';

        // When this button is clicked, move the graph selector cell to the right
        moveGraphSelectorCellRightButton.addEventListener('click', function (event) {
            // Get the row that contains this cell
            var graphSelectorRow = cell.parentNode;

            // Get the index of this cell
            var graphSelectorCellIndex = Array.prototype.indexOf.call(graphSelectorRow.children, cell);

            // If this cell is not the last cell, move it to the right
            if (graphSelectorCellIndex < graphSelectorRow.children.length - 1) {
                // Get the cell to the right of this cell
                var cellToRightOfGraphSelectorCell = graphSelectorRow.children[graphSelectorCellIndex + 1];
                
                // Move this cell to the right of the cell to the right of this cell
                graphSelectorRow.insertBefore(cell, cellToRightOfGraphSelectorCell.nextSibling);
            }
        });


        // Create a button to remove the selected GraphSelector and the button to the right of it
        var removeGraphSelectorButton = document.createElement('button');
        removeGraphSelectorButton.setAttribute('class', 'graphSelectorRemover');
        removeGraphSelectorButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

       
        // When this button is clicked, open a modal that asks the user to confirm that they want to remove this graph selector
        removeGraphSelectorButton.addEventListener('click', function (event) {
            // Create a modal that asks the user to confirm that they want to remove this row
            this.createConfirmModalDialog(function () {
                // If the user confirms that they want to remove this graph selector, remove this graph selector and the button to the right of it
                cell.parentNode.removeChild(cell);
            }, this.module.tt('remove_graph_selector_confirm'));

        }.bind(this));

        // Create a button that creates a new graph selector and adds it to the graphSelectors div in the row that contains this graph selector 
        var addGraphSelectorButton = document.createElement('button');
        addGraphSelectorButton.setAttribute('class', 'graphSelectorAdder');
        addGraphSelectorButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

        // When this button is clicked, add a graph selector cell to the right of this button's parent
        addGraphSelectorButton.addEventListener('click', function (event) {
            // Get the row that contains this button
            var graphSelectors = this.parentNode.parentNode.parentNode;

            // Get the index of this graph selector
            var graphSelectorCellIndex = Array.prototype.indexOf.call(graphSelectors.children, cell);

            // Create a new graph selector
            var newGraphSelector = AGM.GraphSelector();

            // Add the new graph selector to the graphSelectors div
            graphSelectors.insertBefore(newGraphSelector, graphSelectors.children[graphSelectorCellIndex + 1]);
        });


        // Create a div that will contain the graph form
        var graphFormDiv = document.createElement('div');
        graphFormDiv.setAttribute('class', 'graphFormDiv');

        // Add the move left button, the graph selector, the move right button, the remove button, the add button and the graph form div to the graph selector button cell
        graphSelectorButtons.appendChild(moveGraphSelectorCellLeftButton);
        graphSelectorButtons.appendChild(graphSelectorDiv);
        graphSelectorButtons.appendChild(moveGraphSelectorCellRightButton);
        graphSelectorButtons.appendChild(removeGraphSelectorButton);
        graphSelectorButtons.appendChild(addGraphSelectorButton);


        // Add the move left button, the graph selector, the move right button, the remove button, the add button and the graph form div to the graph selector div cell
        cell.appendChild(graphSelectorButtons);
        cell.appendChild(graphFormDiv);

        // Add the graph selector to the graph selector div
        graphSelectorDiv.appendChild(graphSelector);

    

        // Return cell
        return cell;
    };

    // A function that takes the data dictionary and the report and returns a dictionary of each type of graph with the corresponding form parameters.
    this.getGraphTypes = function () {
        // Bar and pie graphs are the same, except for the type of graph they are.
        var graphTypes = {
            "scatter": {"label": this.module.tt('graph_type_scatter'), "form": this.getScatterFormParameters()},
            "bar": {"label": this.module.tt('graph_type_bar'), "form": this.getBargraphFormParameters()},
            "cross-bar": {"label": this.module.tt('graph_type_crossbar'), "form": this.getCrossBargraphFormParameters()},
            "likert": {"label": this.module.tt('graph_type_likert'), "form": this.getLikertFormParameters()},
            "map": {"label": this.module.tt('graph_type_map'), "form": this.getMapFormParameters()},
            "network": {"label": this.module.tt('graph_type_network'), "form": this.getNetworkFormParameters()},
            "table": {"label": this.module.tt('graph_type_table'), "form": this.getTableFormParameters()}
        };
        return graphTypes;
    };

    // A function that uses the data_dictionary and the report to return the parameters needed to create a scatter graph.
    this.getScatterFormParameters = function () {
        if (this.numerical_fields.length < 2) {
            return null;
        }

        return null;
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
        var graphTypeSelector = this.createRadioSelector({'bar': this.module.tt('bar'), 'pie': this.module.tt('pie')}, 'graph_type', this.module.tt('graph_type'));

        // Set bar as the default graph type
        graphTypeSelector.querySelector('input[value="bar"]').checked = true;

        // return a selector that lets you choose the categorical field
        var categoricalFieldSelector = this.createFieldSelector(this.categorical_fields, 'categorical_field', this.module.tt('categorical_field'));

        // return a selector that lets you choose the numerical field or a count of each instance of the categorical field
        var numericalFieldSelectorDiv = this.createFieldSelector(this.numerical_fields, 'numerical_field', this.module.tt('bar_heights'));

        var numericalFieldSelector = numericalFieldSelectorDiv.getElementsByClassName('fieldSelector')[0];

        var countOption = document.createElement('option');

        // Add an option group for the Count option
        var countOptionGroup = document.createElement('optgroup');
        countOptionGroup.setAttribute('label', this.module.tt('count'));
        numericalFieldSelector.appendChild(countOptionGroup);
        
        // Add the Count option
        countOption.setAttribute('value', '');
        countOption.innerHTML = this.module.tt('count');
        countOptionGroup.appendChild(countOption);

        // Add a hidden checkbox that keeps track of whether the numerical field selector is set to count
        var numericalFieldSelectorIsCount = document.createElement('input');
        numericalFieldSelectorIsCount.setAttribute('type', 'checkbox');
        numericalFieldSelectorIsCount.setAttribute('hidden', 'hidden');
        numericalFieldSelectorIsCount.setAttribute('class', 'numericalFieldSelectorIsCount');
        numericalFieldSelectorIsCount.setAttribute('checked', 'checked');
        numericalFieldSelectorIsCount.setAttribute('name', 'is_count');

        // Add the checkbox to the numerical field selector div
        numericalFieldSelectorDiv.appendChild(numericalFieldSelectorIsCount);

        // if the numeric fields aren't empty add a selctor for the aggregation function
        var aggregationFunctionSelector = this.createAggregationFunctionSelector('aggregationFunctionSelector', this.module.tt('aggregate_function'));

        // hide the aggregation function selector 
        aggregationFunctionSelector.setAttribute('hidden', 'hidden');

        // only show the aggregation function selector if the numerical field selector is not set to count
        var numericalFieldSelectorChange = function (event) {
            if (event.target.querySelector('option:checked').parentElement.label === this.module.tt('count')) {
                aggregationFunctionSelector.setAttribute('disabled', 'disabled');
                aggregationFunctionSelector.value = 'none';

                // hide the aggregation function selector
                aggregationFunctionSelector.setAttribute('hidden', 'hidden');

                // set the numerical field selector to count
                numericalFieldSelectorIsCount.setAttribute('checked', 'checked');
            } else {
                aggregationFunctionSelector.removeAttribute('disabled');

                // show the aggregation function selector
                aggregationFunctionSelector.removeAttribute('hidden');

                // set the numerical field selector to not count
                numericalFieldSelectorIsCount.removeAttribute('checked');
            }
        }.bind(this);

        // add the event listener to the numerical field selector
        numericalFieldSelector.addEventListener('change', numericalFieldSelectorChange);
        

        // add a radio option to display the graph, the table, or both the graph and the table
        var displaySelector = this.createRadioSelector({'graph': this.module.tt('graph'), 'table': this.module.tt('table'), 'both': this.module.tt('both')}, 'displaySelector', this.module.tt('display'));

        // set graph as the default display option
        displaySelector.querySelector('input[value="graph"]').checked = true;

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
        var previewButton = this.createButton('Preview', 'previewButton', 'preview');
        previewButton.setAttribute('disabled', 'disabled');

        // when the categoricalFieldSelector is selected and the numerical field selector is selected, if the numerical field selector isn't count and the aggregate function is selected, enable the preview button 
        var previewButtonChange = function (event) {
            if (
                // The categorical field is selected
                categoricalFieldSelector.querySelector('select').value !== '' 
                // And the numerical field is a field or count
                && (
                    numericalFieldSelectorDiv.querySelector('select').value !== '' 
                    || numericalFieldSelector.querySelector('option:checked').parentElement.label === this.module.tt('count')
                    )
                // And if the numerical field is not count then the aggregate field has a selected value
                && (
                    numericalFieldSelector.querySelector('option:checked').parentElement.label === this.module.tt('count')
                    || aggregationFunctionSelector.querySelector('select').value !== ''
                    )
                ) {
                previewButton.removeAttribute('disabled');
            } else {
                previewButton.setAttribute('disabled', 'disabled');
            }
        }.bind(this);

        // when the button is clicked, create a preview of the graph by calling a wrapper to the d3 library that creates a bar (or pie) chart. Also, if the display selector is set to table or both, create a table preview from the "summary" table wrapper.
        var previewButtonClick = function (event) {
            // serialize the form data using this module's function
            var formData = this.serializeForm(bargraphForm);

            console.log(formData);
            // call the plot wrapper to create a bar (or pie) chart
            var bargraph = new this.Bargraph(this.report, formData);

            // if the display selector is set to table or both, create a table preview from the "summary" table wrapper
            if (formData.display === 'table' || formData.display === 'both') {
                var summaryTable = new this.SummaryTable(this.report, formData);
            }

            // if the display selector is set to graph or both, create a graph preview
            if (formData.display === 'graph' || formData.display === 'both') {
                // fill the preview div with the bargraph
                previewDiv.appendChild(bargraph.getChart());
            }

            // if the display selector is set to table or both, create a table preview
            if (formData.display === 'table' || formData.display === 'both') {
                // fill the preview div with the summary table
                previewDiv.appendChild(summaryTable.getTable());
            }

        }

        // add the event listener to the preview button
        previewButton.addEventListener('click', previewButtonClick.bind(this));

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
        leftSide.appendChild(numericalFieldSelectorDiv);
        leftSide.appendChild(aggregationFunctionSelector);


        // add the display selector and the summary table options to the right side of the form
        rightSide.appendChild(displaySelector);
        rightSide.appendChild(summaryTableOptions);

        // add the left side and the right side to the form
        bargraphForm.appendChild(leftSide);
        bargraphForm.appendChild(rightSide);

        // add the preview div and preview button to the form
        bargraphForm.appendChild(previewDiv);

        // Add a div to hold the buttons at the bottom of the form
        formButtons = document.createElement('div');
        formButtons.setAttribute('class', 'graphFormButtons');

        // Add the preview button to the formButtons
        formButtons.appendChild(previewButton);

        // Add the formButtons to the bargraphForm
        bargraphForm.appendChild(formButtons);


        // return the form
        return bargraphForm;

    };

    this.Bargraph = function (report, formData) {
        // Use the report and the formData to create a bargraph
        this.report = report;
        this.formData = formData;

        this.aggregate_function = this.formData.aggregate_function;

        this.categorical_field = this.formData.categorical_field;

        this.numerical_field = this.formData.numerical_field;

        this.graph_type = this.formData.graph_type;

        // if is_count is in the formData
        if ('is_count' in this.formData) {
            // set this.data to the count of the categorical field
            this.data = d3.rollup(this.report, v => v.length, d => d[this.categorical_field]);
        } else {
            // otherwise, set this.data to the aggregate function of the numerical field
            this.data = d3.rollup(this.report, v => d3[this.aggregate_function](v, d => d[this.numerical_field]), d => d[this.categorical_field]);
        }

        this.getChart = function () {
            // if the graph type is pie, create a pie chart
            if (this.graph_type === 'pie') {
                return d3.PieChart(this.data);
            } else {
                // otherwise, create a bar chart
                return d3.BarChart(this.data);
            }
        }
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

        var modalDialog = this.createModalDialog(this.module.tt('are_you_sure'), content, buttons);

    }

    // Create a Radio Selector
    this.createRadioSelector = function (options, name, label) {
        // Create a radio selector
        var radioSelector = document.createElement('div');
        radioSelector.setAttribute('class', 'radioSelector');

        // Create a radio selector label
        var radioSelectorLabel = document.createElement('label');

        // Add a radioTitle class to the radio selector label
        radioSelectorLabel.setAttribute('class', 'radioTitle');
        radioSelectorLabel.innerHTML = label;
        radioSelector.appendChild(radioSelectorLabel);

        // Create a radio selector option for each option in the options array
        for (var option in options) {
            // Create a label for the radio selector option
            var radioOptionLabel = document.createElement('label');

            // Add a radioOption class to the radio selector option label
            radioOptionLabel.setAttribute('class', 'radioOption');

            // Create a text node for the radio selector option label
            var radioOptionLabelText = document.createTextNode(options[option]);
            radioSelector.appendChild(radioOptionLabel);

            // Add the text node to the radio selector option label
            radioOptionLabel.appendChild(radioOptionLabelText);

            // Create a radio selector option
            var radioOption = document.createElement('input');
            radioOption.setAttribute('type', 'radio');
            radioOption.setAttribute('name', name);
            radioOption.setAttribute('value', option);

            // Add the radio selector option to the radio selector option label
            radioOptionLabel.appendChild(radioOption);
        }

        return radioSelector;

    };

    // Create a field selector
    this.createFieldSelector = function (fields, name, label) {
        var fieldSelectorDiv = document.createElement('div');
        fieldSelectorDiv.setAttribute('class', 'fieldSelectorDiv');

        var fieldSelectorLabel = document.createElement('label');
        fieldSelectorLabel.setAttribute('class', 'fieldSelectorLabel');
        fieldSelectorLabel.innerHTML = label;
        fieldSelectorDiv.appendChild(fieldSelectorLabel);

        var fieldSelectorSelect = document.createElement('select');
        fieldSelectorSelect.setAttribute('name', name);
        fieldSelectorSelect.setAttribute('class', 'fieldSelector');
        fieldSelectorLabel.appendChild(fieldSelectorSelect);

        var noneOption = document.createElement('option');
        noneOption.setAttribute('value', '');
        noneOption.setAttribute('selected', 'selected');
        noneOption.setAttribute('disabled', 'disabled');
        noneOption.innerHTML = this.module.tt('select_a_field');
        fieldSelectorSelect.appendChild(noneOption);

        for (var field in fields) {
            var fieldOption = document.createElement('option');
            fieldOption.setAttribute('value', field);
            fieldOption.innerHTML = fields[field];
            fieldSelectorSelect.appendChild(fieldOption);
        }

        return fieldSelectorDiv;

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
        var aggregationFunctionSelectorDiv = document.createElement('div');
        aggregationFunctionSelectorDiv.setAttribute('class', 'aggregationFunctionSelectorDiv');

        var aggregationFunctionSelectorLabel = document.createElement('label');
        aggregationFunctionSelectorLabel.setAttribute('class', 'aggregationFunctionSelectorLabel');
        aggregationFunctionSelectorLabel.innerHTML = label;
        aggregationFunctionSelectorDiv.appendChild(aggregationFunctionSelectorLabel);

        var aggregationFunctionSelectorSelect = document.createElement('select');
        aggregationFunctionSelectorSelect.setAttribute('name', name);
        aggregationFunctionSelectorLabel.appendChild(aggregationFunctionSelectorSelect);

        var noneOption = document.createElement('option');
        noneOption.setAttribute('value', '');
        noneOption.innerHTML = this.module.tt('select_aggregate_function');
        noneOption.setAttribute('selected', 'selected');
        noneOption.setAttribute('disabled', 'disabled');
        aggregationFunctionSelectorSelect.appendChild(noneOption);

        // Sum option
        var sumOption = document.createElement('option');
        sumOption.setAttribute('value', 'sum');
        sumOption.innerHTML = this.module.tt('sum');

        // Average option
        var averageOption = document.createElement('option');
        averageOption.setAttribute('value', 'average');
        averageOption.innerHTML = this.module.tt('average');

        // Min option
        var minOption = document.createElement('option');
        minOption.setAttribute('value', 'min');
        minOption.innerHTML = this.module.tt('min');

        // Max option
        var maxOption = document.createElement('option');
        maxOption.setAttribute('value', 'max');
        maxOption.innerHTML = this.module.tt('max');

        aggregationFunctionSelectorSelect.appendChild(sumOption);
        aggregationFunctionSelectorSelect.appendChild(averageOption);
        aggregationFunctionSelectorSelect.appendChild(minOption);
        aggregationFunctionSelectorSelect.appendChild(maxOption);

        return aggregationFunctionSelectorDiv;

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
