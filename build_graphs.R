library(jsonlite) # TODO: add dependency

# Get information for which graphs to build, 
# where to get data and where to store the files from input file
if (!exists("input_data_path")) {
  cat(toJSON(FALSE))
  quit("no", 0, FALSE)
}

type_to_method = list("likert" = "build_likert")

source("./data_manipulation.R")
source("./custom_plots.R")

# Example input file
'{
  "inputs": {
    "report_data": "temp_1",
    "data_dictionary": "temp_2",
    "repeat_instruments": "temp_3"
  },
  "graphs": [
    {
      "type": "build_likert",
      "output_file": "temp_4",
      "params": {
        "fields": ["field_1", "field_2"],
        "title": "Likert Title"
      }
    {
      "type": "build_likert",
      "output_file": "temp_5",
      "params": {
        "fields": ["field_1", "field_2"],
        "title": "Likert Title",
        "per_instance": true
      }
    },
    {
      "type": "build_scatter",
      "params": {
        "fields": ["field_1", "field_2"],
        "title": "Scatter Title",
        "line": true
      }
    }
  ],
  "outputs": "output_file_path"
}'
# Get metadata for reading and writing files
input_data <- read_json(input_data_path)

# Save the paths in local variables
report_data_path <- input_data$inputs$report_data
data_dictionary_path <- input_data$inputs$data_dictionary
repeat_instruments_path <- input_data$inputs$repeat_instruments

# Load the data into dataframes
report_data <- read.csv(report_data_path, header = TRUE, sep = ",", stringsAsFactors = FALSE)
data_dictionary <- read.csv(data_dictionary_path, header = TRUE, sep = ",", stringsAsFactors = FALSE)
repeat_instruments <- read.csv(repeat_instruments_path, header = TRUE, sep = ",", stringsAsFactors = FALSE)

output_paths <- list()

for (graph in input_data$graphs) {
  # Create graph with parameters
  html_plot <- do.call(type_to_method[graph$type], graph$params)
  
  # Open the temporary file created for this graph by php
  temp_file <- file(graph$output_file)
  
  writeLines(as.character(html_plot), temp_file)
  
  close(temp_file)
}

cat(toJSON(TRUE))
