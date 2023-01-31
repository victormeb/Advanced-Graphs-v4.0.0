options(warn = -1)

library(jsonlite) # TODO: add dependency
library(XML) # TODO: add dependency

# Get information for which graphs to build, 
# where to get data and where to store the files from input file
if (!exists("input_data_path")) {
  cat(toJSON(FALSE))
  quit("no", 0, FALSE)
}

type_to_method = list("likert" = "build_likert", "scatter" = "build_scatter", "barplot" = "build_barplot", "map" = "build_map", "network" = "build_network")

# source("./data_manipulation.R")
# source("./custom_plots.R")

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

# Remove HTML if there is any  
html_labels <- data_dictionary[data_dictionary$field_name %in% names(report_data), "field_label"] %>%
  lapply(function(x) htmlParse(x,  asText = TRUE) %>% xpathApply("//body//text()[not(ancestor::script)][not(ancestor::style)][not(ancestor::noscript)]", xmlValue) %>% paste0(collapse = "")) %>% unlist()

# # Remove any entries created which hold only whitespace
# html_labels <- html_labels[which(nchar(trimws(html_labels, whitespace = "[ \t\r\n\xA0\f]")) != 0)]

# Fix duplicate label names
data_dictionary[data_dictionary$field_name %in% names(report_data), "field_label"] <- vctrs::vec_as_names(html_labels, repair = "unique", quiet = TRUE)

# Create a list of options to map factors
options <- parse_categories(data_dictionary)

# Create list of labels
# This is used to extract the text labels from the field names
names_to_labels <- data_dictionary$field_label
names(names_to_labels) <- data_dictionary$field_name

for (graph in input_data$graphs) {
  
  if (!as.logical(graph$enabled))
    next

  method <- unlist(type_to_method[graph$type])

  title <- ""
  description = ""
  
  if (exists('title', graph$params))
    title <- unlist(graph$params$title)
  
  if (exists('description', graph$params))
    description <- unlist(graph$params$description)
  
  # Create graph with parameters
  html_plot <- do.call(method, graph$params)
  
  html_div <- advanced_graph_div(html_plot, title, description)
  
  # Open the temporary file created for this graph by php
  temp_file <- file(graph$output_file)
  
  stored <- readLines(temp_file)
  writeLines(paste0(as.character(html_div), stored, sep="\n"), temp_file)
  
  close(temp_file)
}

cat("SUCCESS")
