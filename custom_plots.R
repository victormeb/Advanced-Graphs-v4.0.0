# --- Used for creating plots ---
# Used for many nice looking plots
library(ggplot2)
library(ggrepel) 

# Used for likert plots
library(likert)

# Used to get good color palettes
library(RColorBrewer)
getPalette = colorRampPalette(brewer.pal(8, "Set2"))
library(viridis)
library(viridisLite)
# Used for tables
library(kableExtra)
# Necessary for all percents in likert plot
library(plyr, include.only = c("ddply", "."))

# Used to create maps
library(leaflet)

# Used to create network graphs
library(igraph)

# Used to extract trailing numbers from checkboxes
library(stringr)

# Used to evaluate quosures in plotting functions
library(rlang)

# Used to create html images
library(htmltools)

# side_by_side
# Author: Joel Cohen
# Description:
#
#   Takes two objects and prints them side by side
#
#   Input:
#
#   plot1, plot2 - objects to be plotted side by side
#
#   title - the title of the side by side plots
side_by_side <- function(plot1, plot2, title = "") {
  cat("<center><h4>", title, "</h4></center>\n\n<div class=\"clearfix\">\n\n<div class=\"img-container\">\n\n")
    if (class(plot1)[1] == "list")
      for (item in plot1)
        if (class(item)[1] == "character")
          cat(item)
        else
          print(item)
    else
      print(plot1)
  cat("\n\n</div>\n\n")
  cat("\n\n<div class=\"img-container\">\n\n")
    if (class(plot2)[1] == "list")
      for (item in plot2)
        if (class(item)[1] == "character")
          cat(item)
        else
           print(item)
      else
        print(plot2)
  cat("\n\n</div></div>\n\n")
}

print_single <- function(plot, title = "") {
  cat("<h4>", title,"</h4><div class=\"clearfix\">")
  if (class(plot)[1] == "list")
    for (item in plot)
      if (class(item)[1] == "character")
        cat(item)
      else
        print(item)
  else
    print(plot)
  cat("\n\n</div>\n\n")
}


print_table <- function(table, title = "") {
  cat("<div class=\"tbl-container\">")
    cat("<h5>", title, "</h5>")
    print(table)
  cat("</div>")
}

crosstab_div <- function(table, title = "", ...) {
  paste0(
    "<div class=\"cross-tbl-container\">
    <h5>", title, "</h5>",
    table,
    "</div>"
  )
}

sumtab_div <- function(table, title = "", ...) {
  paste0(
    "<div class=\"sum-tbl-container\">
    <h5>", title, "</h5>",
    table,
    "</div>"
  )
}

print_other_table <- function(data, field_name, title = "") {
  cat("<div class=\"other-tbl-container\">")
  cat("<h5>", title, "</h5>")
  print(data %>% 
          group_by(across(all_of(field_name))) %>%
          summarise() %>%
          na.omit() %>%
          kable(col.names = c(names_to_labels[field_name]), align = "c"))
  cat("</div>")
} 

# n_spaced_indices
# Author: Joel Cohen
# Description:
#   
#   Takes m, the number of elements 
#   take from said vector "n" and returns the indexes
#   for an evenly spaced vector
#
#   Input:
#     
#     m - The number of elements to take a subset of
#
#     n - The number of evenly spaced elements to take from the vector
#
#   Output:
#     
#     The indexes for the evenly spaced elements
#
# Used in custom_bars and custom_stacked to remove labels
n_spaced_indices <- function(m, n) {
  if (n == 0 | m == 0)
    return(c())
  
  if (n > 1)
    unique(((0:(n-1))*(m-1))%/%(n-1) + 1)
  else
    max(1, m%/%2)
}

# n_levels
# Author: Joel Cohen
# Description:
#   
#   Merges the levels of a factor that are smaller than the n greatest
#   factor levels by weight into a single factor using the given grouping
#   function.
#
#   Input:
#     
#     data - A data frame
#
#     x - The column whose levels should be paired down to n (as a symbol)
#
#     weight - The column used to determine the rankings of the levels (as a symbol)
#     
#     n - The levels from the original data which should be left in x
#
#     kept_factors (optional) - Factor columns in the data frame which 
#     should be preservered
#     
#     combined_name (optional) - The name of the factor level of the combined
#     levels. (as symbols)
#     Default: "[Excluded]"
#
#     grouping_fn (optional) - The function used to summarize the dropped levels
#     Default: sum
#
#   Output:
#     
#     data with the x column paired to only n levels, only includes x, kept_factors and weight.
#
#   Warnings:
#   - There should be an equal amount of x records for each of the kept_factors
#     grouped level.
#     e.g. If target group "A" has 4 levels, and kept_factors "B" has 3 levels
#     each level in B should have a record for each of A's levels
#
#   Used for:
#     - Grouping together bars when there are too many (not currently in use)
n_levels <- function(data, x, weight, n, kept_factors = NULL, combined_name = "[Excluded]", grouping_fn = sum) {
  # Enquo the x and weight and kept_factors columns
  x <- enquo(x)
  weight <- enquo(weight)
  kept_factors <- enquos(kept_factors)
  
  # Get a count of the levels of x
  level_count <- eval_tidy(x, data) %>% unique() %>% length()
  
  # If x already has n or fewer levels return the data
  if (level_count <= n) return(data)
  
  # Otherwise, group the bottom (n-level_count) columns by weight
  # and return the them as a single level summarized by the 
  # grouping_fn function
  return(
    ## Logic for combining least significant bars
    data %>%
      # Ungroup the data in case it is already grouped
      ungroup() %>%
      # Add an id to each row to be used as keys later
      mutate(id = row_number()) %>%
      # Group by the group we want to pare down
      group_by(!!x) %>%
      # Add a column which shows the total count for each group
      mutate(x_total = sum(!!weight, na.rm = TRUE)) %>%
      # Group by the other group, this is used to
      # identify which groups in the paring group will be given the value true
      group_by(!!!kept_factors) %>%
      # Arrange by the total in descending order
      arrange(desc(x_total)) %>%
      # Add a variable indicating which rows will be kept and which will be trimmed
      mutate(keeping = c(rep(TRUE, times = n), rep(FALSE, times = level_count - n))) %>%
      # Rearrange the rows in their original order
      ungroup() %>%
      arrange(id) %>%
      # Change the factor to remove the levels of the group to be joined together
      # and add a level for the pared groups
      mutate(!!x := factor(as.character(!!x), levels = c(unique((as.character(!!x))[keeping]),combined_name))) %>%
      # Update the rows which aren't being kept to share the same factor level
      rows_update(y = (.) %>%
                    filter(!keeping) %>%
                    mutate(!!x := combined_name), by = "id") %>%
      # If there are still NAs in x after adding the combined levels add an NA level
      mutate(!!x := addNA(!!x, ifany = TRUE)) %>%
      # Get the totals for the groups that are being pared
      group_by(!!x, !!!kept_factors) %>%
      summarise(!!weight := grouping_fn(!!weight))
  )
}

# n_spaces_indices_zeros_first
# Author: Joel Cohen
# Description:
#   
#   Takes a numerical vector potentially containing zeros
#   and a maximum number of elements to take n from said vector
#   and returns the indexes of the vector where zeroes are removed
#   before removing evenly spaced values
#
#   Input:
#     
#     data - A vector potentialy containing zeros
#
#     n - The number of evenly spaced elements to take from the vector
#
#   Output:
#     
#     The indexes for the evenly spaced elements where zeroes were removed first.
#
# Used in custom_bars and custom_stacked to remove labels
n_spaces_indices_zeros_first <- function(data, n) {
  not_zeros <- which(data != 0)
  zeros <- which(data==0)
  
  if (length(not_zeros) >= n) 
    not_zeros[n_spaced_indices(length(not_zeros), n)] 
  else 
    c(not_zeros, zeros[n_spaced_indices(length(zeros), n-length(not_zeros))])
}

# custom_likert
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe containing factors and returns a likert plot
#
#   Input:
#     
#     A dataframe containing factors with the same levels
#
#   Output:
#     
#     A likert plot
custom_likert <- function(x, title="", wrap_label = FALSE, max_label_length = 30, label_text = 3, legend_text = 35, legend_rows = 1, ...) {
  wrap_label <- as.logical(unlist(wrap_label))
  max_label_length <- as.numeric(unlist(max_label_length))
  max_label_length <- as.numeric(unlist(max_label_length))
  legend_text <- as.numeric(unlist(legend_text))
  legend_rows <- as.numeric(unlist(legend_rows))
  label_text <- as.numeric(unlist(label_text))
  
  percent_data <- x %>% 
    pivot_longer(cols = everything(), names_to = "Item", values_to = "variable") %>%
    group_by(Item) %>%
    mutate(count = n()) %>%
    group_by(Item, variable) %>%
    summarise(percent = n()/first(count))

  p <- likert.bar.plot(likert(x),
                  as.percent = TRUE,
                  colors = if (!any(is.na(x))) colorRampPalette(c("forestgreen", "lightgoldenrod", "red3"))(length(levels(x[[1]]))) else c(colorRampPalette(c("forestgreen", "lightgoldenrod", "red3"))(length(levels(x[[1]])) - 1), "grey"),
                  # low.color="forestgreen",
                  # high.color = "red3",
                  # neutral.color = "lightgoldenrod",
                  horizontal=TRUE,
                  plot.percents = FALSE,
                  plot.percent.neutral = FALSE,
                  #xscale.components=xscale.components.top.HH,
                  #yscale.components=yscale.components.right.HH,
                  xlimEqualLeftRight=FALSE,
                  xTickLabelsPositive=TRUE,
                  reverse=FALSE,
                  xlab = "Percent",
                  ylab.right = "")
  
  if (wrap_label == TRUE && !is.null(max_label_length)) {
    x_lab_func <- function(x) str_wrap(x, width = max_label_length)
  } else if (is.numeric(max_label_length) && max_label_length >= 3) {
    x_lab_func <- function(x) str_trunc(x, width = max_label_length)
  } else {
    x_lab_func <- function(x) x
  }
  
  # Calculate positions for percent labels
  label_data <- inner_join(p$data, percent_data, by = c("Item", "variable")) %>%
    mutate(sign = sign(value)) %>%
    group_by(Item, sign) %>%
    arrange(variable) %>%
    mutate(position = c(value %*% (replace(matrix(1, n(), n()), if (all(sign > 0)) lower.tri(matrix(c(1), n(), n())) else upper.tri(matrix(c(1), n(), n())), 0) - diag(0.5, n(), n()))))%>%
    group_by(Item, variable) %>%
    summarize(across(.fns = mean))

    # Add percent labels and axis labels
    # suppressMessages stops ggplot from printing a message related to rewriting the axis labels
    # that were already set by likert.
    p <- suppressMessages(p + ggrepel::geom_text_repel(data = label_data, aes(label = scales::percent(percent, accuracy = 1), y = position, x = Item),
                  direction = "x",
                  size = 3,
                  max.overlaps = Inf,
                  show.legend = FALSE,
                  box.padding = 0,
                  force=1,
                  force_pull = 10,
                  max.iter = 4,
                  min.segment.length = 0,
                  max.time=1) +
      scale_x_discrete(labels = x_lab_func) +
      theme(
        axis.text.y = element_text(size=label_text),
        legend.justification = c(1, 0),
        legend.direction = "horizontal",
        #legend.margin = margin(5, 5, 5, 5),
        #legend.box.spacing = unit(1, "cm"),
        legend.title = element_blank(),
        legend.text = element_text(size = (dev.size("cm")[[1]]*legend_text)/(sum(nchar(levels(x[[1]])))))
      ) +
      guides(fill = guide_legend(nrow = legend_rows))
      
      )
    
    
    p

}

build_likert <- function(...) {
  args <- lapply(X = list(...), FUN = unlist)
  
  options <- parse_options(args[["options"]])
  
  print(options)
  
  fields <- args[["fields"]]
  
  print(fields)
    
  args[["x"]] <- report_data %>%
    data.frame() %>%
    # Select these fields from the data dictionary
    # Across changes the field_names to their corresponding field labels 
    transmute(
      across(all_of(fields), 
      .fns = ~factor(.x, levels = options[,1], labels = options[,2]), 
      .names = "{names_to_labels[.col]}")) %>%
    (function(data) {
      # If any of the fields contain an NA
      if (any(is.na(data))) {
        return(
          # Add an NA field to each factor
          transmute(data, across(.fns = addNA))
        )
      }
      # Otherwise return the data as is
      return(data)
    })
  
    # Pass this dataframe to the custom likert
    do.call(custom_likert, args) %>%
    # Create an html object from it.
    plotTag(unlist(args[["title"]]))
}

# custom_scatter
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe containing two numerical columns and field labels and returns a scatterplot
#
#   Input:
#     
#     A dataframe containing two numerical columns and a list of field labels
#
#   Output:
#     
#     A scatter plot
custom_scatter <- function(data, x, y, line = FALSE) {
  # Enquo the x and y columns
  x <- enquo(x)
  y <- enquo(y)
  
  # Pass the data to ggplot
  data %>%
    ggplot(aes(x = !!x, y = !!y)) +
      if (line == TRUE)
        # If line is true add a line
        geom_line(colour = "blue")
      else
        # Otherwise add points
        geom_point(colour = "blue", shape = 19)
}

build_scatter <- function(x, y, title="", line=FALSE, ...) {
  x <- unlist(x)
  y <- unlist(y)
  title <- unlist(title)
  line <- unlist(line)
  
  x_label <- names_to_labels[x]
  y_label <- names_to_labels[y]
  
  if (line)
    line <- TRUE
  # print(report_data)
  # Get date fields
  date_fields <- data_dictionary %>%
    # Select only fields in the report
    filter(field_name %in% c(x,y)
           # Select only fields that start with 'date'
           & substr(text_validation_type_or_show_slider_number, 1, 4) == "date") %>%
    # Select the field name
    transmute(field_name,
              try_format = case_when(text_validation_type_or_show_slider_number == "date_dmy" ~ "%%Y-%m-%d",
                                     text_validation_type_or_show_slider_number == "date_mdy"~ "%Y-%m-%d",
                                     text_validation_type_or_show_slider_number == "date_ymd"~ "%Y-%m-%d",
                                     text_validation_type_or_show_slider_number == "datetime_dmy"~ "%Y-%m-%d %H:%M",
                                     text_validation_type_or_show_slider_number == "datetime_mdy"~ "%Y-%m-%d %H:%M",
                                     text_validation_type_or_show_slider_number == "datetime_ymd"~ "%Y-%m-%d %H:%M",
                                     text_validation_type_or_show_slider_number == "datetime_seconds_dmy"~ "%Y-%m-%d %H:%M:%S",
                                     text_validation_type_or_show_slider_number == "datetime_seconds_mdy"~ "%Y-%m-%d %H:%M:%S",
                                     text_validation_type_or_show_slider_number == "datetime_seconds_ymd"~ "%Y-%m-%d %H:%M:%S"))
  report_data %>%
    mutate(
      # Select all the date fields
      across(all_of(date_fields$field_name), 
             # Convert them to date
             .fns = ~as.POSIXct(replace(.x, .x == "", NA), tryFormat = date_fields$try_format[date_fields$field_name == cur_column()], optional = TRUE), 
             # Try these formats,
             .names = "{.col}")
    ) %>%
    transmute(across(all_of(c(x, y)), .names = "{names_to_labels[.col]}")) %>%
    na.omit() %>%
    custom_scatter(!!sym(x_label), !!sym(y_label), line) %>%
    plotTag(unlist(title))
  }

# custom_bars
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe containing one factor column and one numerical column and creates a barplot
#
#   Input:
#     
#     data - A datframe containing a categorical and numerical column
#     
#     x - The categorical column in data, passed as a symbol
#
#     y - The numerical column in data, passed as a symbol
#
#     (OPTIONAL)
#
#     label2 - The symbol for a column in data to be used as second label for
#       the bars. e.g. y (label2). Default: NULL (No second label)
#
#     percent - Should percents be plotted? If True and label2 is NULL
#
#   Output:
#     
#     A bar plot
custom_bars <- function(data, x, y, label2 = NULL, percent = FALSE, max_bars = 30, wrap_label = FALSE, max_label_length = 20, digits = 2, ...) {
  # enquo the passed parameters to be used in aes
  x <- enquo(x)
  y <- enquo(y)
  label2 <- enquo(label2)
  digits <- as.numeric(digits)
  
  margin = 15
  angle_rotation = 45
  v_just = 0.5
  x_title_size = 8
  
  # Get list of categories
  categories <- eval_tidy(x, data = data %>% arrange(!!x))
  
  # Get the evenly spaced categories which will be included as labels
  bar_breaks <- categories[n_spaced_indices(length(categories), max_bars)]
  
  # Get the number of rows in the data
  n_bars <- nrow(data)
  
  # Set the size of the label text based on the number of bars
  label_size <- if (n_bars > 7) 3 else 5
  
  # If label2 isn't passed or there are more than max_bars
  if (rlang::quo_is_null(label2))
    # If percent is TRUE plot the labels as percents
    if (percent)
      bar_labels <- geom_text(aes(label = replace(scales::percent(!!y), (1:length(!!y))[-n_spaced_indices(length(!!y), max_bars)], "")),
                              vjust = -0.5,
                              size = label_size)
    # If percent is FALSE plot the labels as is
    else
      bar_labels <- geom_text(aes(label = replace(!!y, (1:length(!!y))[-n_spaced_indices(length(!!y), max_bars)], "")), vjust = -0.5, size = label_size)
  # If label2 is passed and there are fewer than max_bars
  else if (n_bars <= max_bars)
    # If percent is TRUE
    if (percent)
      # Print the y labels as is and plot the second labels as percent
      bar_labels <- geom_text(aes(
        label=paste0(
          replace(!!y, (1:length(!!y))[-n_spaced_indices(length(!!y), max_bars)], ""),
          " (",
          replace(scales::percent(!!label2), (1:length(!!label2))[-n_spaced_indices(length(!!label2), max_bars)], ""),
          ")")),
        vjust = -0.5,
        size = label_size)
    # If percent is FALSE plot both y and the second labels as is
    else
      bar_labels <- geom_text(aes(
        label = paste0(
                replace(!!y,
                        (1:length(!!y))[-n_spaced_indices(length(!!y), max_bars)],
                        "") ,
                " (",
                replace(!!label2, 
                        (1:length(!!label2))[-n_spaced_indices(length(!!label2), max_bars)],
                        ""),
                ")")),
        vjust = -0.5,
        size = label_size)
  # If label2 is passed but there are more than max_bars
  else 
    # Print the labels as if percent wasn't passed
    bar_labels <- geom_text(aes(
      label = replace(!!y,
                    (1:length(!!y))[-n_spaced_indices(length(!!y), max_bars)],
                    "")),
      vjust = -0.5,
      size = label_size)
  # If there are more than max_bars bars rotate the labels 90 degrees
  if (n_bars > max_bars) {
    angle_rotation <- 90
    v_just <- 0
  }
  
  if (wrap_label == TRUE && !is.null(max_label_length)) {
    x_lab_func <- function(x) str_wrap(x, width = max_label_length)
  } else if (is.numeric(max_label_length) && max_label_length >= 3) {
    x_lab_func <- function(x) str_trunc(x, width = max_label_length)
  } else {
    x_lab_func <- function(x) x
  }
  
  # Pass the data to ggplot
  p <- list(data %>%
    mutate(across(where(is.numeric), round, digits = digits)) %>%
    arrange(!!x) %>%
    # Use x and y as out x and y
    ggplot(aes(x=!!x, y = !!y, fill = !!x)) +
    # Create bars
    geom_bar(stat = "identity") +
    # Add viridis colors
    scale_fill_viridis(discrete = TRUE, option = "D", na.value = "grey", breaks = bar_breaks, labels = x_lab_func) + 
    scale_x_discrete(breaks = bar_breaks, labels = x_lab_func, expand = expansion(c(0.05,0.05))) +
    # Add a border
    theme(panel.border = element_rect(linetype = "blank", size= 0.9, fill = NA),
          # Adjust the position of the title to be centered
          plot.title = element_text(hjust = 0.5),
          # Set the margins to the margins parameter (default 15)
          plot.margin = margin(margin,margin,margin,margin),
          #axis.title.x = element_text(size=x_title_size),
          axis.text.x = element_text(#size=label_size,
            # Set the angle of the category labels based on bar count
            angle = angle_rotation,
            vjust = v_just,
            # Set the colour of the text to black
            colour = "black"
          ),
          # Set the parameters for the y title
          axis.title.y = element_text(
            size=10,
            colour = "black"
          ),
          # Add a legend ant set its position
         legend.position = "bottom",
         legend.box = "horizontal",
         legend.title = element_blank()
    )  +
    # Increase the top of the y-axis so labels don't spill off the plot
    scale_y_continuous(expand = expansion(c(0,0.2))) +
    # Add the previously created x axis labels
    bar_labels)
  
  if (n_bars > max_bars)
    p <- p %>% append("<figcaption><b>Warning: too many bars were plotted so some bar labels have been removed</b></figcaption>")
  
  return(p)  
}

# custom_pie
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe containing one factor column and one numerical column and creates a barplot
#
#   Input:
#     
#     data - A datframe containing a categorical and numerical column
#     
#     x - The categorical column in data, passed as a symbol
#
#     y - The numerical column in data, passed as a symbol
#
#     (OPTIONAL)
#
#     title - The title for the plot (defaults to nothing)
#     
#     max_labels - The maximum number of labels to display.
#       default: 15
#
#   Output:
#     
#     A pie chart
custom_pie <- function(data, x, y, title = "", wrap_label = FALSE, max_labels = 15, max_label_length = 20, digits = 2, ...) {
  # Enquo the x and y variables
  x <- enquo(x)
  y <- enquo(y)
  digits <- as.numeric(digits)
  
  # Get the levels for the bars
  categories <- eval_tidy(x, data %>% arrange(!!x))
  
  # Compute the label colours
  label_color <- if (any(is.na(categories))) c(viridis(length(categories)-1), "grey") else viridis(length(categories))
  
  # Compute whether text should be dark or light based off colours
  text_color <- if_else(farver::decode_colour(label_color, "rgb", "hcl")[,"l"] > 50, "black", "white")
  
  categories_kept <- categories[n_spaces_indices_zeros_first(eval_tidy(y, data %>% arrange(!!x)), max_labels)]
  
  # Logic for determining label shortening
  # If wrap_label is TRUE and max_label_length is set
  if (wrap_label == TRUE && !is.null(max_label_length)) {
    # Use str_wrap as the shortening function
    x_lab_func <- function(x) str_wrap(x, width = max_label_length)
  } else if (is.numeric(max_label_length) && max_label_length >= 3) {
    # Otherwise use str_trunc as the shortening function
    x_lab_func <- function(x) str_trunc(x, width = max_label_length)
  } else {
    # Otherwise leave as is
    x_lab_func <- function(x) x
  }
  
  # Compute the label positions
  label_pos <- data %>% 
    arrange(!!x) %>%
    mutate(text_color = text_color, 
           label = x_lab_func(replace_na(as.character(!!x), "NA")),      
           csum = rev(cumsum(rev(!!y))),
           pos = !!y/2 + lead(csum, 1),
           pos = if_else(is.na(pos), !!y/2, pos)) %>%
    # Remove the locations that aren't in the kept categories 
    # and those that won't show up as a slice
    filter(!!x %in% categories_kept & !!y != 0)
  
  category_labels <- if (nrow(label_pos) > 0)
    ggrepel::geom_label_repel(data = label_pos, aes(label = label, y = pos),
                              nudge_x = 1,
                              color = label_pos$text_color,
                              max.overlaps = Inf,
                              show.legend = FALSE,
                              force=1000,
                              max.time=1)
    else
      geom_blank()
  
  p <- list(data %>%
    arrange(!!x) %>%
    ggplot(aes(x="", y=!!y, fill=!!x)) +
    # Add "Bars"
    geom_bar(width = 1, color = "white", stat='identity') +
    # Convert to pie
    coord_polar(theta = "y", clip = "off") +
    # Add "Turbo" viridis colours
    scale_fill_viridis(discrete = TRUE, option = "D", na.value = "grey", breaks = categories_kept, labels = x_lab_func) +
    # Add labels to slices (amounts)
    
    geom_text(aes(label = replace(round(!!y, digits), !!y == 0, "")),
              position = position_stack(vjust = 0.5),
              color = text_color) +
    guides(fill=guide_legend(title='')) +
    # Add labels to slices
    #scale_y_continuous(breaks = label_pos$pos, labels = label_pos$label)+
    category_labels + 
    # Add title
    #ggtitle(title) +
    theme(
      # Remove ticks
      axis.ticks = element_blank(),
      # Set label size
      axis.text.y = element_text(size = 15),
      axis.text.x = element_blank(),
      axis.title.y = element_blank(),
      #legend.key.size = unit(0.5, "cm"),
      #legend.text = element_blank(),
      #legend.title =element_blank(),
      legend.position = "bottom",
      legend.box = "horizontal",
      # Set title size and position
      plot.title = element_text(hjust = 0.5, size=5)
    )) #+
    #guides(fill = guide_legend(title.position="top", title.hjust = 0.5)))
           
  if (length(categories) > max_labels)
    p <- p %>% append("<figcaption><b>Warning: too many categories were plotted so some labels have been removed</b></figcaption>")
  
  return(p)
}
# custom_stacked
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe with three columns and produces a stacked bar plot
#
#   Input:
#     
#     data - a dataframe with two categorical columns and one numeric
#
#     x - the categories which will be bars along the x axis
#
#     y - the categories which will be stacked on top of the bars
#
#     fill - the values used to determine the height of each piece of the stack
#
#     (Optional)
#     
#     title - The title for the plot
#     Default: ""
#
#     position - "stack" (default) for stacked bar plot
#                "dodge" for grouped bar plot
#
#     max_bars - The maximum number of bars (stacked) or group of bars (grouped)
#     Default: 20
#
#     max_colors - The maximum number of stacks/colours (stacked) or
#     bars per group (grouped).
#     Default: 20
#
#   Output:
#     
#     A stacked bar plot
custom_stacked <- function(data, x, y, fill, title = "", position = "stack", max_bars = 20, max_colors = 20, wrap_labels = FALSE, max_label_length = Inf, digits = 2, sumfunc = "sum", ...) {
  # Enquo our passed parameters so they can be used in aes
  x <- enquo(x)
  y <- enquo(y)
  fill <- enquo(fill)
  digits <- as.numeric(digits)
  
  # Returns max_bars evenly spaced bar labels
  bar_names <- eval_tidy(x, data = data) %>% unique()
  bar_breaks <- bar_names[n_spaced_indices(length(bar_names), max_bars)]
  
  # Returns evenly spaced vector for the bar colours
  color_names <- eval_tidy(y, data = data) %>% unique()
  color_breaks <- color_names[n_spaced_indices(length(color_names), max_colors)]
  
  # Count the number of bars
  x_bars = data %>% select(!!x) %>% distinct() %>% nrow()
  
  # Count the number of stacks
  y_bars = data %>% select(!!y) %>% distinct() %>% nrow()
  
  # Set parameters for when there 34 or fewer bars or stacks
  angle_rotation = 45
  v_just = 0.5
  x_size = 8
  legend_size = 7
  
  print(wrap_labels)
  
  label_func <- if (wrap_labels) str_wrap else str_trunc
  
  max_label_length <- as.numeric(max_label_length)
  
  # If they are grouped bar plots
  if (position == "dodge") {
    # Set the size of the bar text based on the number of bars
    bar_text <-  max(1, 8 -7*x_bars*y_bars/(50))
    # Create a geom for the bar labels
    bar_labels <- geom_text(aes(x = !!x, y = !!fill, label = replace(round(!!fill, digits), !!fill == 0, "")),
                            position = (position_dodge(width = 0.9)), size = bar_text, vjust = -0.2)
    # Make the stack_labels blank
    stack_labels <- geom_blank()
  # Otherwise if they are stacked bar plots
  } else {
    # Set the size of the bar text based on the number of bars
    bar_text <- max(1, 8 - 7*x_bars/(50))
    # Create a geom for the bar labels
    bar_labels <- geom_text(aes(x = !!x, y = !!fill, fill = NULL, label = replace(round(label, digits), label == 0, "")),
              data = data %>%
                group_by(!!x) %>%
                summarize(
                  label = if (n() == 0 || all(is.na(!!fill))) 0 else match.fun(sumfunc)(!!fill, na.rm = TRUE),
                  !!fill := sum(!!fill)
                ) %>%
                mutate(label = ifelse(is.na(label) | is.infinite(label), 0, label)),
                size = bar_text, vjust = -0.2)
    
    # Stack text colors
    stack_colors <- if (any(is.na(color_names))) c(turbo(length(color_names) - 1), "grey") else turbo(length(color_names))
    stack_colors <- data %>%
      group_by(!!x) %>%
      mutate(stack_colors = if (any(is.na(!!y))) c(turbo(length(!!y) - 1), "grey") else turbo(length(!!y)),
             stack_text_colors = if_else(farver::decode_colour(stack_colors, "rgb", "hsl")[, "l"] > 50, "black", "white")
      )
    # Add stack labels
      # Get the sizes for the individual stacks
    stack_size <- eval_tidy(fill, data = data)
      # Set the size for the text based off the bar size
    stack_text <- 1 + (bar_text-1)*stack_size/max(stack_size)
      # Create a geom of labels
    stack_labels <- geom_text(aes(x = !!x, y = !!fill, label = replace(round(!!fill, digits), !!fill == 0, "")),
              position = (position_stack(vjust = 0.5)), color = stack_colors[["stack_text_colors"]], size = stack_text)
  }
  
  # If there are more than max_bars bars (or groups)
  if (x_bars > max_bars) {
    # Rotate the x labels to 90 degrees an set vjust to 0
    angle_rotation = 90
    v_just = 0
  }

  # If there are more than max_colors stacks (or bars per group)
  if (y_bars > max_colors) {
    # Decrease the size of the label text
    x_size = 7
    # And decrease the legend size
    legend_size = 5
  }
  
  # Pass the data to ggplot
  p <- list(data %>% 
    ggplot(aes(x=!!x, fill = !!y, y = !!fill)) +
    # Add bars, don't add blue outline for stacked bars
    (if (position == "dodge")
      geom_bar(position = position, stat = "identity", width = 0.9)
    else 
      geom_bar(position = position, color="darkblue", stat = "identity")) +
    # Use a viridis colour scaling
    scale_fill_viridis(discrete = T, option = "H", 
                       na.value = "grey",
                       # Only include max_colour colours in the legend
                       breaks = color_breaks, 
                       labels = function(x) suppressWarnings(label_func(x, width = max_label_length))) +
    # Only include labels for max_bars bars
    scale_x_discrete(breaks = replace(as.character(bar_names), !(bar_names %in% bar_breaks), ""), labels = function(x) suppressWarnings(label_func(x, width = max_label_length))) +
    scale_y_continuous(expand = expansion(c(0, 0.25))) +
    # Add a title to the plot
    ggtitle(title) +
    # Remove the title from the guide
    guides(fill=guide_legend(title='')) +
    theme(
      # Add a border
      panel.border = element_rect(linetype = "blank", size= 0.9, fill = NA),
      # Adjust the location of the title
      plot.title = element_text(hjust = 0.5),
      # Specify the margin
      plot.margin = margin(0.15,0.15,0.15,0.15),
      # Set the size of the x title
      axis.title.x = element_text(size=x_size),
      # Set the size, rotation and position of the x labels
      axis.text.x = element_text(size=x_size,
                                 angle = angle_rotation,
                                 vjust = v_just),
      # Set the size of the y title
      axis.title.y = element_text(size=10),
      # Add a legend
      legend.text = element_text(size=legend_size),
      # Position the legend at the bottom
      legend.position = "bottom",
      # Set the legend to display horizontally
      legend.box = "horizontal"
    ) +
    # Add bar labels
    bar_labels +
    # Add stack labels
    stack_labels
  )
  
  # If there were too many bars
  if (x_bars > max_bars) 
    # Add a warning under the plot
    p <- p %>%
      append("<figcaption><b>Warning: too many groups were plotted so some bar lables have been removed</b></figcaption>")
  
  # If there were too many groups
  if (y_bars > max_colors)
    # Add a warning under the plot
    p <- p %>%
      append("<figcaption><b>Warning: too many groups were plotted so some colours have been removed from the legend</b></figcaption>")
  
  return(p)
}

# custom_crosstab
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe with the x, y, and total quosures and produces 
#   an html contingency table.
#
#   Input:
#     
#     data - A data frame containing 2 categorical columns and a total column
#
#     x - The categorical column that will have a row for each level
#     passed as a symbol
#
#     y - The categorical column that will have a column for each level
#     passed as a symbol
#   
#     total - The column idendifying the total for each pair of levels
#
#     (Optional)
#     column_spanner - The text to be used for the y columns of the table
#     Default: NULL (used the label for the y column)
#
#   Output:
#     
#     A contingency table
custom_crosstab <- function(data, x, y, fill, title = "", table_percents = FALSE, percent_margin = NULL, margin = NULL, ...) {
  x <- as_label(enquo(x))
  y <- as_label(enquo(y))
  fill <- as_label(enquo(fill))
  
  margin <- as.numeric(margin)
  percent_margin <- as.numeric(percent_margin)
  table_percents <- as.logical(table_percents)
  

  table <- xtabs(paste0("\`", fill, "\`~\`", x,"\`+\`",y, "\`"), data = data)
  
  out <- add_totals(table)
  
  if (percent_margin == 3 && table_percents)
    out <- add_totals(prop.table(table)) %>%
      apply(c(1,2), scales::percent)
  
  if (percent_margin %in% c(1, 2) && table_percents)
    out <- add_totals(prop.table(add_totals(table, percent_margin %% 2 + 1), percent_margin), percent_margin) %>%
      apply(c(1,2), scales::percent)
  
  # The text to show over the columns of the y field
  y_spanner <- setNames(c(1, ncol(table), 1), c(" ", y, " "))

  if (!(1 %in% margin))
    out <- out[1:nrow(table), ]
  
  if (!(2 %in% margin)) {
    out <- out[, 1:ncol(table)]
    y_spanner <- y_spanner[1:2]
  }
    
  span_length <- ncol(out)+1
  
  by <- "total"
  
  if (all(percent_margin == 1))
   by <- "row"
  
  if (all(percent_margin == 2))
    by <- "column"
    
    # return(table_to_kable(out, x, y, margin)) #%>%
             #add_header_above(setNames(c(span_length), paste0("Percent of ", fill, " by ", by))))
    print("test")
    
    output_data <- table_to_dataframe(out)
    align = c("l", rep("c", times = ncol(out)))
      #
    kbl(output_data, format = "html", align = align, table.attr = paste0("class=\"", paste0(c("total-row", "total-column")[margin], collapse = " "), "\"")) %>% 
      #add_header_above(y_spanner) %>%
      htmltools::HTML() %>%
      crosstab_div()
}
 

table_to_dataframe <- function(table) {
  out <- table
  # Add applicable total row/column to the table
  # Create a column from the rownames to be used as the first column
  # This allows kable to use the column in its output

  first_col <- setNames(data.frame(rownames(out)), names(dimnames(table))[[1]])

  # Let the output be the first column on the left with the other columns on the right
  out <- cbind(first_col, out)
  
  # Unset the rownames
  rownames(out) <- NULL
  
  return(out)
  # # Add a spanner describing the columns
  # spanner <- setNames(c(1, ncol(table)), c(" ", y_label))
  # 
  # 
  # if (2 %in% margin)
  #   spanner <- setNames(c(1, ncol(table)-1, 1), c(" ", y_label, " "))
  # 
  # # Create a vector describing the alignment
  # align = c("l", rep("c", times = ncol(out)-1))
  # 
  # # Return the table
  # out %>% 
  #   kbl(format = "html", align = align, table.attr = paste0("class=\"", paste0(c("total-row", "total-column")[margin], collapse = " "), "\"")) %>% 
  #     add_header_above(spanner) %>%
  #     htmltools::HTML() %>%
  #     crosstab_div()
  # 
  # 
  
}

    


add_totals <- function(table, margin = c(1, 2)) {
  saved_names <- dimnames(table)

  if (1 %in% margin) {
    table <- cbind(table, apply(table, 1, sum, na.rm = TRUE))
    saved_names[[2]] <- append(saved_names[[2]], "Total")
  }
    
  
  if (2 %in% margin) {
    table <- rbind(table, apply(table, 2, sum, na.rm = TRUE))
    saved_names[[1]] <- append(saved_names[[1]], "Total")
  }
  
 
  dimnames(table) <- saved_names

  return(table)
}

custom_sumtab <- function(data, x, y, digits = 0, table_percents = FALSE, ...) {
  # Enquo, x, y, and total columns
  x <- enquo(x)
  y <- enquo(y)
  
  digits <- as.numeric(digits)
  
  if (table_percents) {
    return(data %>%
      group_by(!!x) %>%
        summarise(across(.fns = sum)) %>%
        ungroup() %>%
        mutate(across(-!!x, .fns = ~ scales::percent(.x / sum(.x, na.rm = TRUE)))) %>%
        transmute(!!x := !!x, !!sym(paste0("Percent of ", as_label(y))) := !!y) %>%
        kable() %>%
        # Output as html
        htmltools::HTML() )
  }
  
  data %>%
    mutate(!!x := as.character(!!x), across(where(is.numeric), .fns = round, digits = digits)) %>%
    rows_append(
      (.) %>%
        mutate(!!x := "Total") %>%
        group_by(!!x)%>%
        summarize(across(.fns = sum))) %>%
    kable() %>%
    # Output as html
    htmltools::HTML() 
}

build_barplot <- function(...) {
  args <- lapply(X = list(...), FUN = unlist)
  if (!exists("x", args))
    return("<h1>Must provide and x field</h1>")
  
  x <- args[['x']]
  x_label <- names_to_labels[x]
  args[['x']] <- sym(x_label)
  
  grouping_fnc <- . %>%
    mutate(across(all_of(x), function(col) addNA(factor(col, options[[cur_column()]][['options_code']], options[[cur_column()]][['options_label']]), ifany = TRUE), .names = "{names_to_labels[.col]}")) %>%
    group_by(!!sym(x_label), .drop = FALSE)
  
  summarised_fnc <- . %>%
    summarize(Count = n()) %>%
    ungroup()
  
  height_name <- "Count"
  
  # If count isn't passed
  if (!exists("count", args)) {
    # height field and summary function must  be passed
    if (!exists("height", args) || !exists("sumfunc", args))
      return("<h1>If not using count height and summary function must be provided</h1>")
    
    sumfunc <- args[["sumfunc"]]
    height <- args[["height"]]
    
    # Set height name to be "Func of field_label"
    height_name <- paste0(title_caps(sumfunc), " of ", names_to_labels[height])
    
    # Set the summmary function to take the sumfunc of height_field
    summarised_fnc <- . %>%
      summarize(!!sym(height_name) := if (n() == 0 || all(is.na(!!sym(height)))) 0 else match.fun(sumfunc)(!!sym(height), na.rm = TRUE)) %>%
      mutate(!!sym(height_name) := if_else(is.na(!!sym(height_name)) | is.infinite(!!sym(height_name)), 0, !!sym(height_name))) %>%
      ungroup()
  }
  
  graph_fnc <- custom_bars
  
  if (exists("pie", args)  && args[["pie"]] == "true")
    graph_fnc <- custom_pie
  
  if (exists("crosstab", args)) {
    if (!exists("y", args))
      return("<h1>Must provide y field for crosstab</h1>")
    
    y <- args[['y']]
    y_label <- names_to_labels[y]
    args[['y']] <- sym(y_label)
    
    args[['fill']] <- sym(height_name)
    
    args[['position']] <- if (exists("grouped", args) && args[["grouped"]] == "true") "dodge" else "stack"
    
    grouping_fnc <- . %>%
      mutate(across(all_of(c(x, y)), function(col) addNA(factor(col, options[[cur_column()]][['options_code']], options[[cur_column()]][['options_label']]), ifany = TRUE), .names = "{names_to_labels[.col]}")) %>%
      group_by(!!sym(x_label), !!sym(y_label), .drop = FALSE)
    
    graph_fnc <- custom_stacked
  } else {
    args[['y']] <- sym(height_name)
  }
  
  
  
  args[['data']] <- report_data %>%
    grouping_fnc %>%
    summarised_fnc
  
  p <- do.call(graph_fnc, args)
  
  if (is.list(plot))
    p <- paste0(plotTag(p[[1]], ""), plot[[2]])
  else
    p <- plotTag(p, "")
  
  # If the table argument is present
  if (exists("table", args)) {
    
    if (exists("crosstab", args)) {
      args[["table"]] <- do.call(custom_crosstab, args)
      cross_table <- do.call(crosstab_div, args)
    } else {
      args[["table"]] <- do.call(custom_sumtab, args)
      cross_table <- do.call(sumtab_div, args)
    }

    p <- paste0(p, cross_table)
  }
  
  return(p)
  
}

# custom_map
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe with the latidutes, and longitudes
#   an html contingency table.
#
#   Input:
#     
#     data - A data frame containing a latitude and longitude column
#
#     lat - The latitude column as a string
#
#     lng - The longitude column as a string
#
#     (Optional)
#     count - A column giving the counts for each location
#     Default: NULL
#
#   Output:
#     
#     A map
custom_map <- function(data, lat, lng, type = NULL, weight = NULL, title = "", dot_size = 5, ...) {
  color = "#03F"
  dot_size = as.numeric(dot_size)
  label = NULL
  labelOptions = NULL
  
  if (!is.null(type)) {
    pal = colorFactor(turbo(length(unique(data[[type]]))), domain = unique(data[[type]]))
    color = pal(data[[type]])
  }
  
  if (!is.null(weight)) {
    dot_size = dot_size*data[[weight]]/mean(data[[weight]])
    label = data[[weight]]
    labelOptions = labelOptions(
      # Always show labels
      noHide = T, 
      # Only sho text
      textOnly = T, 
      # Set the color of the text to be white
      style = list(color = "white"), 
      # Place labels at center of circle
      direction = "center"
    )
  }
    
  
  data %>%
    leaflet(width = 800, height = 800) %>%
    addTiles() %>%
    addCircleMarkers(
      # Use the given longitude and latitude columns
      lng = data[[lng]],
      lat = data[[lat]],
      # Use the location factor to create colors
      color = color,
      # Make the size of the circles appropriate to the count column
      weight = dot_size,
      # Add labels to each circle
      label = label,
      labelOptions = labelOptions,
      # Make cirlce opaque
      opacity = 1,
      stroke = TRUE,
      fillOpacity = 1,
      fill = TRUE,
      # Cluster nearby circles together
      clusterOptions = markerClusterOptions(maxClusterRadius = 50, spiderfyOnMaxZoom = FALSE) # , spiderfyOnMaxZoom = TRUE, spiderLegPolylineOptions = list(weight = 1.5, color = "#FF0000", opacity = 1)
    ) %>%
    (
      function(map) {
        if (!is.null(type))
          addLegend(map, "bottomright", pal = pal, opacity = 1, values = data[[type]], title = type)
        else
          map
      }
    ) %>%
    # Add a title
    addControl(title, position = "bottomleft")
}

build_map <- function(cluster_by, ...) {
  args <- lapply(list(...), unlist)
  
  cluster_by <- unlist(cluster_by)
  
  grouping_fn <- . %>%
    mutate()
  
  type_fn <- . %>%
    mutate()

  
  summary_fn <- . %>%
    summarise(Count = n()) %>%
    ungroup()
  
  
  if (args[['weight']] != '')
    if (exists('sumfunc', args))
      summary_fn <- . %>%
    summarise(across(all_of(args[['weight']]), .fns = function(col) (if (all(is.na(col))) 0 else match.fun(args[['sumfunc']])(col, na.rm = TRUE)))) %>%
    ungroup()
  else
    return("<h2 style=\"color: red;\">sumfunc must be set when count is numeric</h2>")
  else
    args[["weight"]] <- "Count"

  
  if (exists("type", args) && args[["type"]] == '')
    args[["type"]] <- NULL
  else if (exists("type", args)) {
    options <- parse_options(data_dictionary[data_dictionary$field_name == args[["type"]], "select_choices_or_calculations"])
    
    original_name <- args[["type"]]
    
    type_fn <- . %>%
      mutate(across(all_of(original_name), function(col) addNA(factor(col, options[,1], options[,2]), ifany = T), .names = "{names_to_labels[.col]}"))
  
    args[["type"]] <- names_to_labels[[args[["type"]]]]
    
    print(args[["type"]])
  }
  
  if (cluster_by == "location")
    grouping_fn <- . %>%
    group_by(across(any_of(c(args[["lat"]], args[["lng"]], args[["type"]]))))
  else {
    summary_fn <- . %>% mutate()
    args[["weight"]] <- NULL
    args[["type"]] <- NULL
  }
  
  args[['data']] <- report_data %>%
    type_fn %>%
    grouping_fn %>%
    summary_fn
  
  print(args[['data']])
  
  # args[['type']] <- NULL
  
  m <- do.call(custom_map, args)
  paste0(as.character(htmltools::tagList(m)), "<script>window.HTMLWidgets.staticRender();</script>")
  # htmltools::tagList(m)
  
}

custom_network <- function(data, x, y, directed = FALSE, 
                           title = paste0(as_label(x), " -> " , as_label(y)), 
                           title_size = 100,
                           arrow_width = 0.5,
                           arrow_size = 0.5,
                           vertex_size = 5,
                           vertex_label_size = .4,
                           vertex_color = "cadetblue3",
                           ...) {
  x <- enquo(x)
  y <- enquo(y)
  
  directed <- as.logical(directed)
  title_size <- as.numeric(title_size)
  arrow_width <- as.numeric(arrow_width)
  arrow_size <- as.numeric(arrow_size)
  vertex_size <- as.numeric(vertex_size)
  vertex_label_size <- as.numeric(vertex_label_size)
  
  data %>%
    select(!!x, !!y) %>%
  # Create a graph from the data
    graph_from_data_frame(directed = directed) %>%
    # Plot it
    plot.igraph(edge.width = 1,
         main = title,
         cex.main = title_size,
         sub = "",
         edge.arrow.width = arrow_width,
         vertex.size = vertex_size,
         edge.arrow.size = 0.5,
         edge.color = "black",
         # vertex.size2 = 3,
         vertex.label.cex = vertex_label_size,
         vertex.color = vertex_color,
         asp = 0)
  return(list())
}

build_network <- function(...) {
  args <- lapply(list(...), unlist)
  
  x_field <- args[['x']]
  y_field <- args[['y']]
  
  args[['x']] <- names_to_labels[[x_field]]
  args[['y']] <- names_to_labels[[y_field]]
  
  if (args[['title']] == "")
    args <- args[names(args) != 'title']
  
  args[['data']] <- report_data %>%
    transmute(across(all_of(c(x_field, y_field)), .names = "{names_to_labels[.col]}"))
  
  suppressWarnings(do.call(custom_network, args)) %>%
    plotTag("", width = 800, height = 800)
}

advanced_graph_div <- function(plot, title, description) {
  paste0(
    "<div class=\"plot-div\"><h1>",
    title,
    "</h1>",
    plot,
    "<p>",
    description,
    "</p>",
    "</div>"
  )
}