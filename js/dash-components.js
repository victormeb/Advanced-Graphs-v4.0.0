AdvancedGraphsInteractiveComponents = {};

AdvancedGraphsInteractiveComponents.css = {};

AdvancedGraphsInteractiveComponents.language = {};

AdvancedGraphsInteractiveComponents.language.tt_type = "Graph Type";

AdvancedGraphsInteractiveComponents.css.add_button = 
`left: 50%`;

AdvancedGraphsInteractiveComponents.css.graph_form = 
``;

AdvancedGraphsInteractiveComponents.css.graph_selector = 
``;
function generateGraphTypeSelect(dataframe) {
        const graphTypeSelect = document.createElement('select');
        graphTypeSelect.name = 'graph-type';
        graphTypeSelect.className = 'graph-type-select';
        
        // Add options based on the columns in the dataframe
        if (dataframe.columns.includes('x') && dataframe.columns.includes('y')) {
            const barChartOption = document.createElement('option');
            barChartOption.value = 'bar-chart';
            barChartOption.textContent = 'Bar chart';
            graphTypeSelect.appendChild(barChartOption);
            
            const lineChartOption = document.createElement('option');
            lineChartOption.value = 'line-chart';
            lineChartOption.textContent = 'Line chart';
            graphTypeSelect.appendChild(lineChartOption);
        }
        
        if (dataframe.columns.includes('value') && dataframe.columns.includes('label')) {
            const pieChartOption = document.createElement('option');
            pieChartOption.value = 'pie-chart';
            pieChartOption.textContent = 'Pie chart';
            graphTypeSelect.appendChild(pieChartOption);
        }
        
        // Add additional conditions for new graph types here
        
        return graphTypeSelect;
    }

AdvancedGraphsInteractiveComponents.main_page = function(title = "Advanced Graphs Interactive") {
    let main_page = document.createElement("div");

    main_page.id = "advanced_graphs_interactive";

    // Add a title if the parameter is a string
    if (typeof title === 'string' || title instanceof String) {
        let header = document.createElement("h1");
        header.innerHTML(title);
        new_type.append(header);
    }

    // Create a new button that can add graphs
    let add_button = document.createElement("button");
    add_button.innerHTML("+");
    add_button.setAttribute("style", AdvancedGraphsInteractiveComponents.css.add_button);

    // Add a function to our button.
    add_button.onclick = function() {
        // Create a new graph before this button.
        main_page.insertBefore(this.newGraph(), add_button);
    }



    main_page.append(add_button);
}

AdvancedGraphsInteractiveComponents.createGraphSelector = function () {
    let graph_type_selector = document.createElement("div");
    graph_type_selector.setAttribute("style", AdvancedGraphsInteractiveComponents.css.graph_selector);

    let saved_graphs = {};
    let graph_types = this.graph_types;

    for (const graph_type of this.graph_types) {
        let option = document.createElement("option");
        option.value = graph_type.type;
        option.text = graph_type.name;
        saved_graphs[graph_type.type] = {};
    }

    type_dropdown.onfocus = function() {
        if (this.value)
        this.oldValue = this.value;
    }
}

AdvancedGraphsInteractiveComponents.newGraph = function() {
    // ----------------------
    // type dropdown   instrument dropdown     /\  <- graph_type_selector
    // ----------------------                      
    // graph options                               <- graph_options
    // ----------------------
    // preview       delete                    \/  <- buttons
    
    // Create the container for the new graph
    let new_graph = document.createElement("div");
    new_graph.setAttribute("style", AdvancedGraphsInteractiveComponents.css.graph_form);

    // Create the container for the graph and instrument selector
    let graph_type_selector = this.createGraphSelector();

    // Create an empty div that will hold the graph options
    let graph_options = document.createElement("div");

    // Create a 
    let preview_buttons = this.createPreviewButtons();

    // Append each of these elements to the new_graph container
    new_graph.append([dropdown_container, graph_options, preview_buttons]);




    type_dropdown.onchange = function() {
        if (this.oldValue)
            savedGraphs[this.oldValue] = new FormData(new_graph.querySelector('.graph-options'));
    
        let new_graph_options = {};

        if (this.value in savedGraphs) {
            new_graph_options = graph_types[this.value].build(savedGraphs[this.value]);
            return;
        }


    }

    let changeFunction = function() {
        for (const graph_type of this.graph_types) {
            if (this.value == graph_type.type) {
                graph_type.fnc(new_graph, savedGraphs[graph_type.type]);
            }

        }
    }



}

AdvancedGraphsInteractiveComponents.dropdown = function(name = null, title = "", required = false) {
    // Create a label for the dropdown
    let dropdown_label = document.createElement("label");
    dropdown_label.text = title;

    // Set the name for the dropdown if name is set
    let dropdown = document.createElement("select");
    if (typeof name === 'string' || name instanceof String)
        dropdown.name = name;
}



AdvancedGraphsInteractiveComponents.graph_type = function(id = null, title = null, explanation_text = null) {
    // Create an empty div
    let new_type = document.createElement("div");

    // Set the custom css
    new_type.setAttribute("style", "display: block;border: 2px solid #777;gap: 16px;");

    // Add an id if the id is a string
    if (typeof id === 'string' || id instanceof String)
        new_type.id = id;

    // Add a title if the parameter is a string
    if (typeof title === 'string' || title instanceof String) {
        let header = document.createElement("div");
        header.innerHTML(title);
        new_type.append(header);
    }


}