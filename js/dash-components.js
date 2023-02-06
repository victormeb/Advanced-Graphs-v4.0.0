AdvancedGraphsInteractiveComponents = {};

AdvancedGraphsInteractiveComponents.css = {};

AdvancedGraphsInteractiveComponents.language = {};

AdvancedGraphsInteractiveComponents.language.tt_type = "Graph Type";

AdvancedGraphsInteractiveComponents.css.add_button = 
`left: 50%`;

AdvancedGraphsInteractiveComponents.css.graph_form = 
``;

AdvancedGraphsInteractiveComponents.css.dropdown_container = 
``;


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
        main_page.insertBefore(this.new_graph(), add_button);
    }



    main_page.append(add_button);
}

AdvancedGraphsInteractiveComponents.new_graph() = function() {
    // ----------------------
    // type dropdown   instrument dropdown     /\  <- dropdown_container
    // ----------------------                      
    // graph options                               <- graph_options
    // ----------------------
    // preview       delete                    \/  <- buttons
    let new_graph = document.createElement("div");
    new_graph.setAttribute("style", AdvancedGraphsInteractiveComponents.css.graph_form);

    let dropdown_container = document.createElement("div");
    new_graph.setAttribute("style", AdvancedGraphsInteractiveComponents.css.dropdown_container);

    let graph_options = document.createElement("div");

    // let buttons = 

    let type_dropdown = this.dropdown("type", this.language.tt_type, true);
    type_dropdown.name = "type";

    let savedGraphs = {};
    let graph_types = this.graph_types;

    for (const graph_type of this.graph_types) {
        let option = document.createElement("option");
        option.value = graph_type.type;
        option.text = graph_type.name;
        savedGraphs[graph_type.type] = {};
    }

    type_dropdown.onfocus = function() {
        this.oldValue = this.value;
    }

    type_dropdown.onchange = function() {
        if (this.oldValue)
            savedGraphs[this.oldValue] = new FormData(new_graph.querySelector('.graph-options'));
    
        if (this.value in savedGraphs) {
            let graph_options = graph_types[this.value].build(savedGraphs[this.value]);
            
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