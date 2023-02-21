<?php
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;

// include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
// $module->renderDashEditor();
// require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';
$pid = $_GET['pid'];
$dash_id = $_GET['dash_id'];

$url = $_SERVER["HTTP_REFERER"];
$parts = parse_url($url, PHP_URL_QUERY);
parse_str($parts, $query);

$live_filters = $query;

// $pid = $query['pid'];
$report_id = $query['report_id'];

$dash_title = "New Dashboard";

$dashboard_body = [];
$is_public = "false";

if ($dash_id != '0') {
	$dashboard = $module->getDashboards($pid, $dash_id);
	$dashboard_body = $dashboard['body'];
	$report_id = $dashboard['report_id'];
	$live_filters = $dashboard['live_filters'];
	$is_public = $dashboard['is_public'];
	$dash_title = $module->getDashboardName($pid, $dash_id);
}

if ($report_id == 0)
	$report_id = "ALL";

// Header
include APP_PATH_DOCROOT . 'ProjectGeneral/header.php';
$module->loadJS("dash-builder.js");
$module->loadJS("htmlwidgets.js", "mapdependencies/htmlwidgets-1.5.4");
$module->loadCSS("leaflet.css", "mapdependencies/leaflet-1.3.1");
$module->loadJS("leaflet.js", "mapdependencies/leaflet-1.3.1");
$module->loadCSS("leafletfix.css", "mapdependencies/leafletfix-1.0.0");
$module->loadJS("proj4.min.js", "mapdependencies/proj4-2.6.2");
$module->loadJS("proj4leaflet.js", "mapdependencies/Proj4Leaflet-1.0.1");
$module->loadCSS("rstudio_leaflet.css", "mapdependencies/rstudio_leaflet-1.3.1");
$module->loadJS("leaflet.js", "mapdependencies/leaflet-binding-2.1.1");
$module->loadCSS("MarkerCluster.css", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadCSS("MarkerCluster.Default.css", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.freezable.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadJS("leaflet.markercluster.layersupport.js", "mapdependencies/leaflet-markercluster-1.0.5");
$module->loadCSS("advanced-graphs.css");

$title = $report_id ? "<h1>Advanced Graphs</h1>" : "<h1>New Advanced Graphs Dashboards must be run from the context of a report</h1>";
echo "<div id=\"advanced_graphs\">$title</div>";
?>
<!-- HTML for the form -->
<div id="graph-container">
    <div class="graph-selector">
        <form>
            <label for="graph-type-1">Select a graph type:</label>
            <select name="graph-type" id="graph-type-1">
                <!-- Options for the available graph types based on the data structure -->
            </select>
            
            <div class="parameter-container"></div>
            
            <button type="button" class="preview-button">Preview</button>
        </form>
        
        <div class="graph-selector-buttons">
            <button type="button" class="add-graph-selector">Add Graph</button>
            <button type="button" class="remove-graph-selector">Remove Graph</button>
            <button type="button" class="move-up-graph-selector">Move Up</button>
            <button type="button" class="move-down-graph-selector">Move Down</button>
        </div>
    </div>
    
    <button type="button" id="save-button">Save</button>
</div>

<!-- JavaScript code to handle the form -->
<script>
    (function($, window, document) {
        // Define the available graph types based on the data structure
        const dataStructure = {}/* insert your data structure here */;
        
        const graphTypes = [
            {
                name: 'Bar chart',
                options: [
                    { label: 'X-axis variable', types: ['categorical', 'numerical'] },
                    { label: 'Y-axis variable', types: ['numerical'] },
                    { label: 'Grouping variable', types: ['categorical'] },
                    { label: 'Aggregation function', types: ['function'] }
                ],
                preview: (params) => {
                    // Function to generate a preview of the bar chart
                }
            },
            {
                name: 'Line chart',
                options: [
                    { label: 'X-axis variable', types: ['temporal'] },
                    { label: 'Y-axis variable', types: ['numerical'] },
                    { label: 'Grouping variable', types: ['categorical'] },
                    { label: 'Aggregation function', types: ['function'] }
                ],
                preview: (params) => {
                    // Function to generate a preview of the line chart
                }
            },
            {
                name: 'Scatter plot',
                options: [
                    { label: 'X-axis variable', types: ['numerical'] },
                    { label: 'Y-axis variable', types: ['numerical'] },
                    { label: 'Grouping variable', types: ['categorical'] },
                    { label: 'Color variable', types: ['categorical'] }
                ],
                preview: (params) => {
                    // Function to generate a preview of the scatter plot
                }
            }
            // Add additional graph types based on the data structure
        ];

        // Define a function to generate the parameters for a selected graph type
    function generateGraphTypeParams(graphType, parameterContainer, params) {
        // Remove any existing parameters from the container
        parameterContainer.innerHTML = '';
        
        // Generate a parameter input field for each option of the selected graph type
        for (let i = 0; i < graphType.options.length; i++) {
            const option = graphType.options[i];
            const input = document.createElement('input');
            input.name = option.label;
            input.type = 'text';
            input.placeholder = option.label;
            if (params && params[option.label]) {
                input.value = params[option.label];
            }
            parameterContainer.appendChild(input);
        }
        
        const previewButton = parameterContainer.parentElement.querySelector('.preview-button');
        previewButton.addEventListener('click', () => {
            const graphParams = {};
            for (let i = 0; i < graphType.options.length; i++) {
                const option = graphType.options[i];
                const input = parameterContainer.querySelector(`[name="${option.label}"]`);
                if (input.type === 'checkbox') {
                    graphParams[option.label] = input.checked;
                } else {
                    graphParams[option.label] = input.value;
                }
            }
            graphType.preview(graphParams);
        });
    }

    // Define a function to add a new graph selector to the form
    function addGraphSelector(params) {
            const graphContainer = document.getElementById('graph-container');
            const graphSelectorCount = document.querySelectorAll('.graph-selector').length;
            
            const newGraphSelector = document.createElement('div');
            newGraphSelector.className = 'graph-selector';
            
            const newForm = document.createElement('form');
            newForm.innerHTML = `
                <label for="graph-type-${graphSelectorCount + 1}">Select a graph type:</label>
                <select name="graph-type" id="graph-type-${graphSelectorCount + 1}" class="graph-type-select"></select>
                
                <div class="parameter-container"></div>
                
                <button type="button" class="preview-button">Preview</button>
            `;
            newGraphSelector.appendChild(newForm);
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'graph-selector-buttons';
            buttonsDiv.innerHTML = `
                <button type="button" class="add-graph-selector">Add Graph</button>
                <button type="button" class="remove-graph-selector">Remove Graph</button>
                <button type="button" class="move-up-graph-selector">Move Up</button>
                <button type="button" class="move-down-graph-selector">Move Down</button>
            `;
            newGraphSelector.appendChild(buttonsDiv);
            
            generateGraphTypeSelect(newForm.querySelector('.graph-type-select'), graphTypes);
            if (params && params.type && params.params) {
                newForm.querySelector('.graph-type-select').value = graphTypes.findIndex(gt => gt.name === params.type);
                generateGraphTypeParams(graphTypes[newForm.querySelector('.graph-type-select').value], newForm.querySelector('.parameter-container'), params.params);
            } else {
                generateGraphTypeParams(graphTypes[0], newForm.querySelector('.parameter-container'));
            }
            
            // Add event listeners to the graph type select to generate the parameters based on the selected graph type
            newForm.querySelector('.graph-type-select').addEventListener('change', (event) => {
                const graphType = graphTypes[event.target.value];
                generateGraphTypeParams(graphType, event.target.parentElement.querySelector('.parameter-container'));
            });
            
            // Add event listener to preview button to generate a preview of the graph based on the selected parameters
            const previewButton = newGraphSelector.querySelector('.preview-button');
            previewButton.addEventListener('click', () => {
                const graphTypeSelect = newGraphSelector.querySelector('.graph-type-select');
                const graphType = graphTypes[graphTypeSelect.value];
                const graphParams = {};
                for (let j = 0; j < graphType.options.length; j++) {
                    const option = graphType.options[j];
                    const input = newGraphSelector.querySelector(`[name="${option.label}"]`);
                    if (input.type === 'checkbox') {
                        graphParams[option.label] = input.checked;
                    } else {
                        graphParams[option.label] = input.value;
                    }
                }
                const serializedGraphSelector = { type: graphType.name, params: graphParams };
                console.log(serializedGraphSelector);
            });
            
            // Add event listener to add-graph-selector button to add a new graph selector
            buttonsDiv.querySelector('.add-graph-selector').addEventListener('click', () => {
                addGraphSelector();
            });
            
            // Add event listener to remove-graph-selector button to remove the graph selector
            buttonsDiv.querySelector('.remove-graph-selector').addEventListener('click', () => {
                newGraphSelector.remove();
            });
            
            // Add event listener to move-up-graph-selector button to move the graph selector up
            buttonsDiv.querySelector('.move-up-graph-selector').addEventListener('click', () => {
                const previousSibling = newGraphSelector.previousElementSibling;
                if (previousSibling) {
                    graphContainer.insertBefore(newGraphSelector, previousSibling);
                }
            });
            
            // Add event listener to move-down-graph-selector button to move the graph selector down
            buttonsDiv.querySelector('.move-down-graph-selector').addEventListener('click', () => {
                const nextSibling = newGraphSelector.nextElementSibling;
                if (nextSibling) {
                    graphContainer.insertBefore(nextSibling, newGraphSelector);
                }
            });
            
            graphContainer.appendChild(newGraphSelector);
        }
        
        // Define a function to serialize the form as an object
        function serializeForm() {
            const graphSelectors = document.querySelectorAll('.graph-selector');
            const serializedGraphSelectors = [];
            for (let i = 0; i < graphSelectors.length; i++) {
                const graphSelector = graphSelectors[i];
                const graphTypeSelect = graphSelector.querySelector('.graph-type-select');
                const parameterContainer = graphSelector.querySelector('.parameter-container');
                
                const graphType = graphTypes[graphTypeSelect.value];
                const graphParams = {};
                for (let j = 0; j < graphType.options.length; j++) {
                    const option = graphType.options[j];
                    const input = parameterContainer.querySelector(`[name="${option.label}"]`);
                    if (input.type === 'checkbox') {
                        graphParams[option.label] = input.checked;
                    } else {
                        graphParams[option.label] = input.value;
                    }
                }
                
                serializedGraphSelectors.push({ type: graphType.name, params: graphParams });
            }
            
            return JSON.stringify(serializedGraphSelectors);
        }
        
        // Define a function to deserialize the form from an object
        function deserializeForm(serializedForm) {
            const savedGraphSelectors = JSON.parse(serializedForm);
            for (let i = 0; i < savedGraphSelectors.length; i++) {
                const savedGraphSelector = savedGraphSelectors[i];
                addGraphSelector({ type: savedGraphSelector.type, params: savedGraphSelector.params });
            }
        }

        // Define the save dashboard function
        function saveDashboard() {
            const dashboardName = document.getElementById('dashboard-name').value;
            const serializedForm = serializeForm();
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/save_dashboard');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const dashboardSavedSuccessDialog = document.getElementById('dashboard_saved_success_dialog');
                    dashboardSavedSuccessDialog.style.display = 'block';
                } else {
                    const dashboardSavedFailureDialog = document.getElementById('dashboard_saved_failure_dialog');
                    dashboardSavedFailureDialog.style.display = 'block';
                }
            };
            xhr.send(JSON.stringify({ name: dashboardName, form: serializedForm }));
        }

        // Define the initialize function
        function initialize() {
            const graphContainer = document.getElementById('graph-container');
            
            // Add an event listener to the "Add Graph" button
            const addGraphButton = document.querySelector('.add-graph-selector');
            addGraphButton.addEventListener('click', () => {
                addGraphSelector();
            });
            
            // Add event listeners to the "Remove Graph" buttons
            const removeGraphButtons = document.querySelectorAll('.remove-graph-selector');
            for (let i = 0; i < removeGraphButtons.length; i++) {
                const removeGraphButton = removeGraphButtons[i];
                removeGraphButton.addEventListener('click', () => {
                    removeGraphSelector(removeGraphButton);
                });
            }
            
            // Add event listeners to the "Move Up" buttons
            const moveUpButtons = document.querySelectorAll('.move-up-graph-selector');
            for (let i = 0; i < moveUpButtons.length; i++) {
                const moveUpButton = moveUpButtons[i];
                moveUpButton.addEventListener('click', () => {
                    moveGraphSelectorUp(moveUpButton);
                });
            }
            
            // Add event listeners to the "Move Down" buttons
            const moveDownButtons = document.querySelectorAll('.move-down-graph-selector');
            for (let i = 0; i < moveDownButtons.length; i++) {
                const moveDownButton = moveDownButtons[i];
                moveDownButton.addEventListener('click', () => {
                    moveGraphSelectorDown(moveDownButton);
                });
            }
            
            // Add event listeners to the "Preview" buttons
            const previewButtons = document.querySelectorAll('.preview-button');
            for (let i = 0; i < previewButtons.length; i++) {
                const previewButton = previewButtons[i];
                previewButton.addEventListener('click', () => {
                    const graphSelector = previewButton.closest('.graph-selector');
                    const graphTypeSelect = graphSelector.querySelector('.graph-type-select');
                    const parameterContainer = graphSelector.querySelector('.parameter-container');
                    
                    const graphType = graphTypes[graphTypeSelect.value];
                    const graphParams = {};
                    for (let j = 0; j < graphType.options.length; j++) {
                        const option = graphType.options[j];
                        const input = parameterContainer.querySelector(`[name="${option.label}"]`);
                        if (input.type === 'checkbox') {
                            graphParams[option.label] = input.checked;
                        } else {
                            graphParams[option.label] = input.value;
                        }
                    }
                    
                    graphType.preview(graphParams);
                });
            }

            // add an event listener to the save dashboard button
            const saveDashboardButton = document.getElementById('save-dashboard-button');
            saveDashboardButton.addEventListener('click', () => {
                saveDashboard();
            });

        }

        // Initialize the page
        initialize();
    }(window.jQuery, window, document));
</script>
<div id="dashboard_saved_success_dialog" class="simpleDialog" style=""><div style="font-size:14px;">The dashboard named "<span style="font-weight:bold;">Example dashboard</span>" has been successfully saved.</div>
</div>