var AdvancedGraphsModule = function (dashboard, data_dictionary, report, report_fields) {
    this.version = '1.0';
    this.authors = 'Victor Esposita, Joel Cohen, David Cherry, and others';
    this.email = '';

    this.dashboard = dashboard;
    this.data_dictionary = data_dictionary;
    this.report = report;
    this.report_fields = report_fields;

    this.loadDashboardEditor = function () {
        // Add a button to the dashboard editor that will add a row to the dashboard with a graph selector
        var addGraphSelectorRowButton = document.createElement('button');
        addGraphSelectorRowButton.setAttribute('class', 'addGraphSelectorRowButton');
        addGraphSelectorRowButton.innerHTML = 'Add Graph Selector Row';
        var dashboardEditor = document.getElementById('dashboard_editor');
        dashboardEditor.appendChild(addGraphSelectorRowButton);

        // When the button is clicked, add a row with a graph selector
        addGraphSelectorRowButton.addEventListener('click', function (event) {
            var row = document.createElement('tr');
            var cell = document.createElement('td');
            cell.setAttribute('colspan', '3');
            row.appendChild(cell);
            var dashboardTable = document.getElementById('dashboard_table');
            dashboardTable.appendChild(row);
            this.addGraphSelectorRow(row);
        }.bind(this));

    };

    // A function to add a row with a single graph selector cell. On either side of each cell in this row, there will be a cell with a button to add a graph to the left or right of the selected graph.
    this.addGraphSelectorRow = function (row) {
        var graphSelectorRow = document.createElement('tr');
        var graphSelectorCell = document.createElement('td');
        graphSelectorCell.setAttribute('colspan', '3');
        graphSelectorCell.setAttribute('class', 'graphSelectorCell');
        graphSelectorRow.appendChild(graphSelectorCell);
        row.parentNode.insertBefore(graphSelectorRow, row.nextSibling);
        var graphSelector = new this.GraphSelector(graphSelectorCell);

        // Append this row to the advanced_graphs_dashboard div
        var advancedGraphsDashboard = document.getElementById('advanced_graphs_dashboard');
        advancedGraphsDashboard.appendChild(graphSelectorRow);


    };

    this.GraphSelector = function (cell) {
        this.cell = cell;

        // Create a div that will contain the graph selector and a div that will contain the graph form
        var graphSelectorDiv = document.createElement('div');
        graphSelectorDiv.setAttribute('class', 'graphSelectorDiv');
        var graphFormDiv = document.createElement('div');
        graphFormDiv.setAttribute('class', 'graphFormDiv');

        // Add the graph selector and the graph form to the cell
        this.cell.appendChild(graphSelectorDiv);
        this.cell.appendChild(graphFormDiv);

        // Create a button to add a graph to the left of the selected graph
        var addGraphLeftButton = document.createElement('button');
        addGraphLeftButton.setAttribute('class', 'addGraphLeftButton');
        addGraphLeftButton.innerHTML = 'Add Graph to Left';
        graphSelectorDiv.appendChild(addGraphLeftButton);

        // Create a button to add a graph to the right of the selected graph
        var addGraphRightButton = document.createElement('button');
        addGraphRightButton.setAttribute('class', 'addGraphRightButton');
        addGraphRightButton.innerHTML = 'Add Graph to Right';
        graphSelectorDiv.appendChild(addGraphRightButton);

        // Create a button to remove the selected graph
        var removeGraphButton = document.createElement('button');
        removeGraphButton.setAttribute('class', 'removeGraphButton');
        removeGraphButton.innerHTML = 'Remove Graph';
        graphSelectorDiv.appendChild(removeGraphButton);


        
        
        // Create a new graph selector
        this.graphSelector = document.createElement('select');
        this.graphSelector.setAttribute('class', 'graphSelector');
        graphSelectorDiv.appendChild(this.graphSelector);

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
        var aggregationFunctionSelector = null;
        if (this.numerical_fields.length > 0) {
            aggregationFunctionSelector = this.createAggregationFunctionSelector('aggregationFunctionSelector', 'Aggregation Function');
        }

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

    this.getBargraphFormParameters() = function() {
        return null;
    };

    this.getCrossBargraphFormParameters() = function() {
        return null;
    };

    this.getLikertFormParameters() = function() {
        return null;
    };

    this.getMapFormParameters() = function() {
        return null;
    };

    this.getNetworkFormParameters() = function() {
        return null;
    };

    this.getTableFormParameters() = function() {
        return null;
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
