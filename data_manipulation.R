# Used for connections
library(RCurl)

# Used for manipulating data
library(dplyr)
library(tidyr)
options(dplyr.summarise.inform = FALSE)

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
import_data <- function(parameters, data_dictionary, live_filters, flatten = TRUE) {
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
  ), header = TRUE, sep = ",", stringsAsFactors = FALSE)%>%
    mutate(across(any_of(c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")), ~replace(.x, .x == "", NA)))

  all_records <- NULL
  
  if (nrow(live_filters) > 0) {
  # Retrieve all records from the project
      all_records <- read.csv(text = postForm(
        uri=parameters$server_url,
        token=parameters$token,
        content='record',
        format='csv',
        rawOrLabel='raw',
        rawOrLabelHeaders='raw',
        exportCheckboxLabel='false',
        returnFormat='csv',
        .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
      ), header = TRUE, sep = ",", stringsAsFactors = FALSE)%>%
        mutate(across(any_of(c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")), ~replace(.x, .x == "", NA)))
  
      report_data <- apply_live_filters(report_data, all_records, live_filters)
  }
  
  # if (flatten) {
  #   # A list containing the flattened report data as the first entry
  #   # and the flattened records as the second entry
  #   id_fields <- c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")
  #   report_data <- flattened_redcap_report(report_data, data_dictionary, id_fields)
  # 
  # }
  
  return(report_data)
}

check_records_distinct <- function(data, id_fields) {
  return(
    data %>%
      # Select unique events
      group_by(across(any_of(id_fields))) %>%
      # If any of the events have two or more non-na entries
      summarise(across(.fns = ~(n() - sum(is.na(.x)) > 1)), .groups = "drop") %>%
      # Select only non-grouping rows
      select(-any_of(id_fields)) %>%
      any()
  )
}

post_repeated_forms <- function(parameters) {
  try(
    return(read.csv(text = postForm(
      uri=parameters$server_url,
      token=parameters$token,
      content='repeatingFormsEvents',
      format='csv',
      .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
    ))),
    silent = TRUE
  )
  
  return(data.frame(form_name = character(0)))
}

post_instruments <- function(parameters) {
  try(
    return(read.csv(text = postForm(
      uri=parameters$server_url,
      token=parameters$token,
      content='instrument',
      format='csv',
      .opts = RCurl::curlOptions(ssl.verifypeer = FALSE, ssl.verifyhost = FALSE, verbose=FALSE)
    ))),
    silent = TRUE
  )
  
  return(data.frame(form_name = character(0)))
}

apply_live_filters <- function(report_data, all_records, live_filters, id_fields = c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")) {
  return(
    inner_join(
      report_data%>%
        group_by(across()) %>%
        summarise(adv_graph_internal_duplicates_id = row_number()) %>%
        ungroup()
      ,
      all_records %>%
        pivot_wider(names_from = all_of("redcap_repeat_instrument")) %>%
        group_by(across(any_of(c(names(all_records)[1], id_fields)))) %>%
        filter(eval(rlang::parse_expr(paste0(live_filters$filter_string, collapse = "&")))) %>%
        group_by(across(all_of(names(report_data)))) %>%
        summarise(adv_graph_internal_duplicates_id = row_number()) %>%
        ungroup()
      ,
      by = c(names(report_data), "adv_graph_internal_duplicates_id")
    ) %>% 
      select(-adv_graph_internal_duplicates_id)
  )
}

flattened_redcap_report <- function(data, data_dictionary, id_fields = c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")) {
  # If the data is null return null
  if (is.null(data)) return(data)
  
  # If the record ID column is not in the data return the original
  # Report with a warning
  if (!(data_dictionary[1, "field_name"] %in% names(data))) {
    cat("<h5><b>Note: for data flattening, record id field must be in report (no flattening)</b></h5>\n\n")
    return(data)
  }
  
  # If the data has no duplicate record IDs return the original data
  if (
    !(data %>%
      select(any_of(c(data_dictionary[1, "field_name"], 
                      id_fields
                      )
                    )
             ) %>%
    duplicated() %>%
    any())
  ) {
    cat("<h5><b>Note: No duplicate record IDs were found (no flattening required)</b></h5>\n\n")
    return(data)
  }
  
  # If there is duplicate record information for any fields within the same record ID set
  # return the original report data.
  if (check_records_distinct(data, c(data_dictionary[1, "field_name"], id_fields))) {
    cat("<h5><b>Attention: more than one non-na entry found for at least one event. (no flattening)</b></h5>\n\n")
    return(data)
  }
  
  return(
    data %>%
      group_by(across(
        any_of(c(data_dictionary[1, "field_name"], 
                 id_fields
               ))
      )) %>%
      summarise(across(.fns = function(column) first(sort(na.omit(column), decreasing = TRUE))), .groups = "drop")
  )
  
  # # From all the records, take the rows that are in report_data, include the ID column
  # report_data_flattened <- inner_join(
  #   all_records %>%
  #     mutate(across(any_of(c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name")), ~replace(.x, .x == "", NA))) %>%
  #     select(1, all_of(names(report_data))) %>%
  #     group_by(across(all_of(names(report_data)))) %>%
  #     # Add row number for each identical row the records (only counting fields in the report)
  #     mutate(adv_graph_internal_duplicates_id = row_number())
  #   ,
  #   report_data %>%
  #     group_by(across(everything())) %>%
  #     # Add a row number for each identical row in the report data
  #     mutate(adv_graph_internal_duplicates_id = row_number())
  #   ,
  #   by = c(names(report_data), "adv_graph_internal_duplicates_id")
  # ) %>%
  #   # Flatten the each event into a single row
  #  group_by(across(c(1, any_of(c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name"))))) %>%
  #  summarise(across(.fns = function(column) first(sort(na.omit(column), decreasing = TRUE)))) %>%
  #  ungroup() %>%
  #  select(names(report_data))
  # 
  # 
  # if (nrow(report_data) > nrow(report_data_flattened))
  #   cat("<h5><b>Note: events have been flattened into a single record</b></h5>")
  # 
  # return(report_data_flattened)
  
  # # Otherwise
  # 
  # # Flatten all the records, so there is one row per ID
  # records_flattened_filtered <- all_records %>%
  #   group_by(across(c(1, any_of(c("redcap_repeat_instrument", "redcap_repeat_instance", "redcap_event_name"))))) %>%
  #   summarise(across(.fns = function(column) first(sort(na.omit(column), decreasing = TRUE)))) %>%
  #   ungroup() %>%
  #   # Filter the flattened records by the live filters
  #   filter(eval(rlang::parse_expr(paste0(live_filters$filter_string, collapse = "&"))))
  #   
  # # Join the flattened report_data with the flattened filtered records
  # report_data <- inner_join(
  #   report_data_flattened %>%
  #     select(all_of(names(report_data))) %>%
  #     group_by(across(all_of(names(report_data)))) %>%
  #     mutate(adv_graph_internal_duplicates_id = row_number())
  #   ,
  #   records_flattened_filtered %>%
  #     select(all_of(names(report_data))) %>%
  #     group_by(across(all_of(names(report_data)))) %>%
  #     mutate(adv_graph_internal_duplicates_id = row_number())
  #   ,
  #   by = c(names(report_data), "adv_graph_internal_duplicates_id")
  # ) %>% 
  #   # remove the duplicate_id column
  #   select(all_of(names(report_data)))  %>% 
  #   # Store it as a dataframe
  #   as.data.frame()
  # 
  # return(report_data)
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

parse_options <- function(options) {
  # Split options over | character
  str_split(options, "[|]", simplify = TRUE) %>% 
    # Split option codes from option labels over ,
    str_split(",", 2, simplify = TRUE) %>% 
    # Remove leading and trailing whitespace
    gsub(pattern = "^\\s+|\\s+^", replacement = "")
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
  # Create a dataframe containing the live_filter information
  data.frame(
    field_name = c(parameters$dynamic_filter1, parameters$dynamic_filter2, parameters$dynamic_filter3),
    options_code = c(parameters$lf1, parameters$lf2, parameters$lf3)
    ) %>%
    # Only include filters whose option codes aren't empty
    filter(options_code != "") %>%
    (function(data) {
      if (nrow(data) > 0)
        data %>%
          rowwise() %>%
          mutate(
            # If the field name ends in "_complete", make it a capitalized field name - the complete
            field_label = (
              if (substr(field_name, nchar(field_name)-8, nchar(field_name)) == "_complete") 
                title_caps(gsub("_", " ", substr(field_name, 0, nchar(field_name)-9)))
              else 
                # Otherwise use the corresponding category name
                categories[[field_name]]$field_label
            ),
            # If the field name ends in "_complete", use the corresponding label for the options code
            options_label = (
              if (substr(field_name, nchar(field_name)-8, nchar(field_name)) == "_complete") 
                live_filter_status[options_code] 
              else
                # Otherwise use the corresponding options label from categories
                categories[[field_name]]$options_label[options_code]
            ),
            # Create a filtering string for each filter
            filter_string = (if (options_code == "[NULL]") paste0("is.na(", field_name, ")") else paste0(field_name, "==",options_code))
          )
      else
        data
    })
}