# Used for connections
library(RCurl)

# Used for manipulating data
library(dplyr)
library(tidyr)
options(dplyr.summarise.inform = FALSE)

# Used for data manipulation
# Faster thand dplyr
#library(data.table)

# title_caps
# Author: Joel Cohen (Based on previously existing work)
# Description:
#
# Takes a character array or vector of character arrays of and transforms
# capitalizes the first letter of each word.
#
# e.g.
# Input:
#
# c("lorem ipsum dolor sit amet", "the quick brown dog jumped")
#
# Returns:
#
# c("Lorem Ipsum Dolor Sit Amet", "The Quick Brown Dog Jumped")
title_caps <- function (string_vec) {
  string_vec <- if (typeof(string_vec) == "character") c(string_vec) else string_vec
  vapply(strsplit(string_vec, " "), FUN = function(x) {paste(toupper(substr(x, 1, 1)), substr(x, 2, nchar(x)), collapse = " ", sep = "")}, FUN.VALUE = "")
}


# import_data
# Author: Joel Cohen (Based on previously existing work)
# Description:
# 
# Retrieves a REDCap report's data frame with live filters applied
# If no parameters are supplied, it uses local files for the data frames.
#
# Input:
#   params:
#     pid: 0
#     reportId: 0
#     server_url: ""
#     token: ""
#     dynamic_filter1: ""
#     dynamic_filter2: ""
#     dynamic_filter3: ""
#     lf1: ""
#     lf2: ""
#     lf3: ""
#
#   live_filters:
#     field_name <chr>    option_code <chr>     option_name <chr> field_title <chr>
#     ...........................................................................
#     field1  	                  1	              option2	           Field 1
#     field2  	                  3	              option1  	         Field 2
#     instrument_one_complete     2	              Complete	       Instrument One
#     ...........................................................................
#
# Returns:
# 
# A dataframe containing the report fields with any applicable live filter.
#
# NOTE: entry ID MUST be a field in the report for this to work!
import_data <- function(parameters, record_id, live_filters) {
  #### REDCap Report ####
  report_data <- read.csv(text = postForm(
    uri=parameters$server_url,
    token=parameters$token,
    content='report',
    format='csv',
    report_id=parameters$reportId,
    rawOrLabel='raw',
    rawOrLabelHeaders='raw',
    exportCheckboxLabel='false',
    returnFormat='csv',
    .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
  ), header = TRUE, sep = ",", stringsAsFactors = FALSE)
  
  # If there are no live_filters active, submit the report_data
  if (nrow(live_filters) == 0) return(report_data)
  
  # Create filter condition to send request to redcap.
  filter_condition <- paste("[", live_filters$field_name, "] = \"", live_filters$option_code, "\"" ,sep = "", collapse = " AND ")
  
  
  # Create the array of field names to be returned from redcap
  report_fields <- toString(names(report_data))
  
  # All records matching live filter
  live_filtered_records <- read.csv(text = postForm(
    uri=parameters$server_url,
    token=parameters$token,
    content='record',
    fields= report_fields,
    format='csv',
    filterLogic = filter_condition,
    rawOrLabel='raw',
    rawOrLabelHeaders='raw',
    exportCheckboxLabel='false',
    returnFormat='csv',
    .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
  ), header = TRUE, sep = ",", stringsAsFactors = FALSE)

  return(
    report_data %>%
      group_by_all() %>%
      # Add a row number for each identical row in the report data
      mutate(adv_graph_internal_duplicates_id = row_number()) %>%
      # Join the report_data and the filtered records keeping only
      # rows in the report data that have a match in the filtered data
      inner_join(live_filtered_records %>%
                   select(names(report_data)) %>%
                   group_by_all() %>%
                   # Add row number for each identical row in filtered data
                   mutate(adv_graph_internal_duplicates_id = row_number())
      ) %>%
      # Remove the duplicates id column
      select(-adv_graph_internal_duplicates_id)
  )
}

# post_project_info
# Author: Joel Cohen
# Description:
# 
# Uses the relevant parameters to request the project info from REDCap
# 
# Input: 
#   params:
#     pid: 0
#     reportId: 0
#     server_url: ""
#     token: ""
#     dynamic_filter1: ""
#     dynamic_filter2: ""
#     dynamic_filter3: ""
#     lf1: ""
#     lf2: ""
#     lf3: ""
#
# Returns:
#
#   REDCap project info
post_project_info <- function (parameters) {
  #### Project Dataframe ####
  read.csv(text = postForm(
    uri= parameters$server_url,
    token= parameters$token,
    content='project',
    format='csv',
    returnFormat='csv',
    .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
  ), header = TRUE, sep = ",", stringsAsFactors = FALSE)
}

# post_data_dictionary
# Author: Joel Cohen
# Description:
# 
# Uses the relevant parameters to 
# 
# Input: 
#   params:
#     pid: 0
#     reportId: 0
#     server_url: ""
#     token: ""
#     dynamic_filter1: ""
#     dynamic_filter2: ""
#     dynamic_filter3: ""
#     lf1: ""
#     lf2: ""
#     lf3: ""
#
# Returns:
#
#   A REDCap data dictionary
post_data_dictionary <- function (parameters) {
  #### Data Dictionary ####
  # Reads a very large string for all dd from REDCap
  read.csv(text = postForm(
    uri=parameters$server_url,
    token= parameters$token,
    content='metadata',
    format='csv',
    returnFormat='csv',
    .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
  ), header = TRUE, sep = ",", stringsAsFactors = FALSE)
  # Sets the dataframe to a data table

}

# parse_categories
# Author: Joel Cohen
# Description:
# 
# Takes filtered fields from a REDCap Data Dictionary and 
# extracts the options for each categorical variable.
# 
# Input:
#
#   required: A REDCap Data Dictionary containing relevant field names
# 
#
# Returns:
#
#   A Nested list of the form:
#
#   $field_name1
#     $field_name1$field_name
#     [1] "field_name1"
#
#     $field_name1$field_label
#     [1] "Field Name One"
#
#     $field_name1$options_code
#     [1] "1", "2", "3"
#
#     $field_name1$options_label
#     [1] "option 1", "option 2", "option 3"
#
#   $field_name2
##     $field_name2field_name
#     [1] "field_name2"
#
#     $field_name2$field_label
#     [1] "Field Name Two"
#     
#     $field_name2$options_code
#     [1] "A", "B", "C"
#
#     $field_name2$options_label
#     [1] "option A", "option B", "option C"
parse_categories <- function(data) {
  # Create a list of categories
  mapply(
    function(field_name, field_label, options) {
      # For each category include
      list(
        # The field name
        field_name = field_name,
        # field label
        field_label = field_label,
        # option codes
        options_code = options[,1],
        # option labels
        # Name this by the options_code and fix duplicate names
        options_label = mapply(function(x,y) y, options[,1], vctrs::vec_as_names(options[,2], repair = "unique", quiet = TRUE))
      )
    },
    data$field_name, 
    data$field_label, 
    # split the categories into separate options
    str_split(data$select_choices_or_calculations, "[|]") %>%
      # then split each option into its code and label and remove whitespace
      lapply(function(x) gsub("^\\s+|\\s+^", "", str_split(x, pattern = ",", n=2, simplify = TRUE))),
    SIMPLIFY = FALSE
  )
}

# parse_live_filters
# Author: Joel Cohen
# Description:
# 
# Creates a dataframe of the filter field, field_tile, option_code and option_label given 
# A categories list and parameters
#
# Input: 
#   parameters  - params:
#                   pid: 0
#                   reportId: 0
#                   server_url: ""
#                   token: ""
#                   dynamic_filter1: ""
#                   dynamic_filter2: ""
#                   dynamic_filter3: ""
#                   lf1: ""
#                   lf2: ""
#                   lf3: ""
#
#   categories  - A nested list of categorical fields and their options.
#
#   live_filter_status (Optional) - A named list mapping instrument filter codes to 
#                                   Incomplete, Unverified and Complete
# 
# Returns:
#
# A dataframe of the form:
#
#
# field_name <chr>    option_code <chr>     option_name <chr> field_title <chr>
# ...........................................................................
# field1  	                  1	              option2	           Field 1	
# field2  	                  3	              option1  	         Field 2	
# instrument_one_complete     2	              Complete	       Instrument One
# ...........................................................................
parse_live_filters <- function (parameters, categories, data_dictionary,live_filter_status = c("0" = "Incomplete","1"="Unverified","2" = "Complete")) {
  data.frame(
    field_name = c(params$dynamic_filter1, params$dynamic_filter2, params$dynamic_filter3),
    option_code = c(params$lf1, params$lf2, params$lf3)) %>%
    # Remove empty filters
    filter(option_code != "") %>%
    mutate(
      # Match the option_name to match to option_code from the instrument or categories list
      option_name = if_else( # Match titles for filters
        # If the field name ends in _complete
        substr(field_name, nchar(field_name)-8, nchar(field_name)) == "_complete",
        # Let the label equal the corresponding status
        live_filter_status[option_code],
        # Otherwise...
        if_else(
          # ... If the options code is equal to [NULL]
          option_code == "[NULL]",
          # Change it to an empty string (this is for the filter condition to send to REDCap)
          "",
          # In all other cases
          unlist(mapply(
            # Attempt to map the option_name to the corresponding field_name, option_code in the categories list
            function(filter_name, code, options) {
              # If the code is in the corresponding field_name's options
              if (code %in% options[[filter_name]][["code"]])
                # Use the options label corresponding to that code
                options[[filter_name]][["label"]][which(code == options[[filter_name]][["code"]])]
              # Otherwise, let it be empty
              else NA
            },
            field_name, option_code, MoreArgs = list(options = categories)
          ))
        )
      ),
      # Add a pretty field title
      field_title = if_else(
        # If the field_name ends in _complete
        substr(field_name, nchar(field_name)-8, nchar(field_name)) == "_complete",
        # Remove _complete, split it over underscores, and capitalize the first letter of each word\
        # e.g. Example_instrument_complete => Example Instrument
        gsub("_", " ", substr(field_name, 0, nchar(field_name)-9)) %>% title_caps(),
        # Otherwise try to match it with field label from the data_dictionary
        right_join(data_dictionary, data.frame(field_name = field_name), by = "field_name")[["field_label"]]
      )
    )
}