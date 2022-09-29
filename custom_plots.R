# --- Used for creating plots ---
# Used for many nice looking plots
library(ggplot2)

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



side_by_side <- function(plot1, plot2, title = "") {
  cat("<center><h4>", title, "</h4></center><div class=\"clearfix\"><div class=\"img-container\">")
    print(plot1)
  cat("</div>")
  cat("<div class=\"img-container\">")
    print(plot2)
  cat("</div></div>\n\n")
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
custom_likert <- function(x) {
  likert.bar.plot(likert(x),
                  as.percent = TRUE,
                  colors = turbo(length(levels(x[[1]]))),
                  # low.color="forestgreen",
                  # high.color = "red3",
                  # neutral.color = "lightgoldenrod",
                  horizontal=TRUE,
                  plot.percents = TRUE,
                  xscale.components=xscale.components.top.HH,
                  yscale.components=yscale.components.right.HH,
                  xlimEqualLeftRight=FALSE,
                  xTickLabelsPositive=TRUE,
                  reverse=FALSE,
                  xlab = "Percent",
                  ylab.right = "")
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
  x <- enquo(x)
  y <- enquo(y)
  
  data %>%
    ggplot(aes(x = !!x, y = !!y)) +
      if (line == TRUE)
        geom_line(colour = "blue")
      else
        geom_point(colour = "blue", shape = 19)
}

# custom_scatter <- function(data, field_labels = NULL, date_fields = c()) {
#   # If any number of columns other than two is provided, stop
#   if (ncol(data) != 2) stop(paste0("custom_scatter takes a dataframe with two columns, (",ncol(data),") provided."))
#   
#   # If field_labels is NULL use the names of the passed dataframes
#   if (is.null(field_labels)) {
#     field_labels <- names(data)
#   } else if (length(field_labels) != 2 || typeof(field_labels) != "character") {
#     stop("field_labels must be a character vector or character list of length 2")
#   }
#   
#   data %>%
#     mutate(across(all_of(date_fields), as.Date, tryFormats = c("%m/%d/%Y", "%Y-%m-%d", "%Y/%m/%d"))) %>%
#     na.omit() %>%
#     (function(fixed_data) {
#       if (nrow(fixed_data) != 0) {
#         plot(
#           fixed_data,
#           main = paste0(field_labels, collapse = " vs "),
#           xlab = field_labels[1],
#           ylab = field_labels[2],
#           type = "p",
#           xaxt = "n",
#           yaxt = "n",
#           # TODO: Make point sizes increase for repeated (y?) values
#           #cex= points_to_plot[,3]
#           pch=19, 
#           col="blue"
#         )
#         if (length(date_fields) == 0) {
#           axis(side = 1, labels = TRUE, las = 1)
#           axis(side = 2, labels = TRUE, las = 1)
#         } else if (length(date_fields) == 1) {
#           axis.Date(side = which(names(fixed_data) == date_fields), fixed_data[[date_fields]], labels = TRUE, las = 1)
#           axis(side = which(names(fixed_data) != date_fields), labels = TRUE, las = 1)
#         } else {
#           axis.Date(side = 1, fixed_data[[date_fields[1]]], labels = TRUE, las = 1)
#           axis.Date(side = 2, fixed_data[[date_fields[2]]], labels = TRUE, las = 1)
#         }
#       }
#     })
# }

# # custom_scatter_date
# # Author: Joel Cohen
# # Description:
# #   
# #   Takes a dataframe containing a date column as x and a numerical column as y and field labels and returns a scatterplot
# #
# #   Input:
# #     
# #     A dataframe containing a date column as the first field, a numerical column as the second field and a (optional) list of field labels
# #
# #   Output:
# #     
# #     A date scatter plot
# custom_scatter_date <- function(data, field_labels = NULL) {
#   # If any number of columns other than two is provided, stop
#   if (ncol(data) != 2) stop(paste0("custom_scatter_date takes a dataframe with two columns, (",ncol(data),") provided."))
#   
#   # If field_labels is NULL use the names of the passed dataframes
#   if (is.null(field_labels)) {
#     field_labels <- names(data)
#   } else if (length(field_labels) != 2 || typeof(field_labels) != "character") {
#     stop("field_labels must be a character vector or character list of length 2")
#   }
#   
#   data %>%
#     na.omit() %>%
#     (function(data) {
#       if (nrow(data) != 0) {
#         plot(
#           data,
#           main = paste0(field_labels, collapse = " vs "),
#           xlab = field_labels[1],
#           ylab = field_labels[2],
#           type = "p",
#           xaxt = "n",
#           yaxt = "n",
#           # TODO: Make point sizes increase for repeated (y?) values
#           #cex= points_to_plot[,3]
#           pch=19, 
#           col="blue"
#         )
#       }
#     })
# }

# custom_bars
# Author: Joel Cohen
# Description:
#   
#   Takes a dataframe containing one factor column and one numerical column and creates a  barplot
#
#   Input:
#     
#     A dataframe containing one factor column as x and one numeric column as y
#
#   Output:
#     
#     A bar plot
custom_bars <- function(data, x, y, label2 = NULL, percent = FALSE, margin = 15, angle_rotation = 45, v_just = 0.5, x_title_size = 8, legend_size = 7, max_bars = 25, combined_name = "[Excluded]") {
  # enquo the passed parameters to be used in aes
  x <- enquo(x)
  y <- enquo(y)
  label2 <- enquo(label2)
  
  # Get the number of rows in the data
  n_bars <- nrow(data)
  
  # Set the size of the label text based on the number of bars
  label_size <- if (n_bars > 7) 3 else 5
  
  group_bars <- . %>% mutate()
  
  # If there are more than 25 bars rotate the labels 90 degrees
  if (n_bars > max_bars) {
    group_bars <- . %>%
      # Add an id to each row to be used as keys later
      mutate(id = row_number()) %>%
      # Arrange the bars in decending order
      arrange(desc(!!y)) %>%
      mutate(
        # Add a column indicating which will be left and which will be kept
        keeping = c(rep(TRUE, times = max_bars), rep(FALSE, times = n_bars - max_bars)),
        # Remove dropped factors from x
        !!x := factor(as.character(!!x), levels = c(unique(as.character(!!x)[keeping]), combined_name))
        ) %>%
      # Update combined rows to have the same level
      rows_update(y = (.) %>% 
                    filter(!keeping) %>%
                    mutate(!!x := combined_name), by = "id") %>%
      # Get the sum of the new group
      group_by(!!x) %>%
      summarise(!!y := sum(!!y))
      
    angle_rotation <- 90
    v_just <- 0
  }
  
  # If label2 isn't passed or there are more than 25 bars
  if (rlang::quo_is_null(label2))
    # If percent is TRUE plot the labels as percents
    if (percent)
      bar_labels <- geom_text(aes(label = scales::percent(!!y)), vjust = -0.5, size = label_size)
  # If percent is FALSE plot the labels as is
  else
    bar_labels <- geom_text(aes(label = !!y), vjust = -0.5, size = label_size)
  # If label2 is passed and there are fewer than 26 bars
  else if (n_bars < 26)
    # If percent is TRUE
    if (percent)
      # Print the y labels as is and plot the second labels as percent
      bar_labels <- geom_text(aes(label=paste0(!!y ," (",scales::percent(!!label2),")")), vjust = -0.5, size = label_size)
  else
    # If percent is FALSE plot both y and the second labels as is
    bar_labels <- geom_text(aes(label = paste0(!!y ," (",!!label2,")")), vjust = -0.5, size = label_size)
  # If label2 is passed but there are more than 25 bars
  else 
    # Print the labels as if percent wasn't passed
    bar_labels <- geom_text(aes(label = !!y), vjust = -0.5, size = label_size)
  
  # Pass the data to ggplot
  data %>%
    # If there are too many bars make them one group
    group_bars %>%
    # Use x and y as out x and y
    ggplot(aes(x=!!x, y = !!y, fill = !!x)) +
    # Create bars
    geom_bar(stat = "identity") +
    # Add viridis colors
    scale_fill_viridis(discrete = TRUE, option = "D", na.value = "grey") + 
    # Add a border
    theme(panel.border = element_rect(linetype = "blank", size= 0.9, fill = NA),
          # Adjust the position of the title
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
          legend.box = "horizontal"
    )  +
    # Increase the top of the y-axis so labels don't spill off the plot
    scale_y_continuous(expand = expansion(mult = c(0, 0.2))) +
    # Add the previously created x axis labels
    bar_labels
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
#   Output:
#     
#     A stacked bar plot
custom_stacked <- function(data, x, y, fill, title = "", position = "stack", maxgroups = 34, maxcolors = 34, combined_name = "[Excluded]") {
  # Enquo our passed parameters so they can be used in aes
  x <- enquo(x)
  y <- enquo(y)
  fill <- enquo(fill)
  
  # Count the number of bars
  x_bars = data %>% select(!!x) %>% distinct() %>% nrow()
  
  # Count the number of stacks
  y_bars = data %>% select(!!y) %>% distinct() %>% nrow()
  
  # Set parameters for when there 34 or fewer bars or stacks
  angle_rotation = 45
  v_just = 0.5
  x_size = 8
  legend_size = 7
  
  x_combine <- . %>% mutate()
  y_combine <- . %>% mutate()
  
  # If there are more than 34 bars
  if (x_bars > maxgroups) {
    x_combine <- . %>%
      # Add an id to each row to be used as keys later
      mutate(id = row_number()) %>%
      # Group by the group we want to pare down
      group_by(!!x) %>%
      # Add a column which shows the total count for each group
      mutate(x_total = sum(!!fill, na.rm = TRUE)) %>%
      # Group by the other (colors group), this is used to
      # identify which groups in the paring group will be given the value true
      group_by(!!y) %>%
      # Arrange by the total in descending order
      arrange(desc(x_total)) %>%
      # Add a variable indicating which rows will be kept and which will be trimmed
      mutate(keeping = c(rep(TRUE, times = maxgroups), rep(FALSE, times = x_bars - maxgroups))) %>%
      # Rearrange the rows in their original order
      arrange(id) %>%
      # Change the factor to remove the levels of the group to be joined together
      # and add a level for the pared groups
      mutate(!!x := factor(as.character(!!x), levels = c(unique((as.character(!!x))[keeping]),combined_name))) %>%
      # Update the rows which aren't being kept to share the same factor level
      rows_update(y = (.) %>% 
                    filter(!keeping) %>%
                    mutate(!!x := combined_name), by = "id") %>%
      # If there are still NAs in x after adding the combined levels add an NA level
      mutate(!!y := addNA(!!y, ifany = TRUE)) %>%
      # Get the totals for the groups that are being pared
      group_by(!!x, !!y) %>%
      summarise(!!fill := sum(!!fill))

    # Rotate the x labels to 90 degrees
    angle_rotation = 90
    v_just = 0
  }

  # If there are more than 34 stacks
  if (y_bars > maxcolors) {
    # y_combine uses the same logic as x_combine but swaps x and y
    y_combine <- . %>%
      mutate(id = row_number()) %>%
      group_by(!!y) %>%
      mutate(x_total = sum(!!fill, na.rm = TRUE)) %>%
      group_by(!!x) %>%
      arrange(desc(x_total)) %>%
      mutate(keeping = c(rep(TRUE, times = maxcolors), rep(FALSE, times = y_bars - maxcolors))) %>%
      arrange(id) %>%
      mutate(!!y := factor(as.character(!!y), levels = c(unique((as.character(!!y))[keeping]), combined_name))) %>%
      rows_update(y = (.) %>% filter(!keeping) %>% mutate(!!y := combined_name), by = "id") %>%
      mutate(!!y := addNA(!!y, ifany = TRUE)) %>%
      group_by(!!y, !!x) %>%
      summarise(!!fill := sum(!!fill))
    
    # Decrease the size of the label text
    x_size = 7
    # And decrease the legend size
    legend_size = 5
  }
  
  
  # Pass the data to ggplot
  data %>% 
    # Combine x group if there are too many
    x_combine %>%
    # Combine y group if there are too many
    y_combine %>%
    # Use the passed parameters
    # TODO: Swap fill and y?
    ggplot(aes(x=!!x, fill = !!y, y = !!fill)) +
    # Add bars
    geom_bar(position = position, color="darkblue", stat = "identity") +
    # Use a viridis colour scaling
    scale_fill_viridis(discrete = T, option = "H") +
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
    )
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
#     A dataframe with the x
#
#   Output:
#     
#     A contingency table
custom_crosstab <- function(data, x, y, total, column_spanner = "Columns") {
  x <- enquo(x)
  y <- enquo(y)
  total <- enquo(total)
  
  y_levels <- levels(data[[rlang::as_label(y)]]) %>% replace_na("NA")
  spanner <- c(1, length(y_levels), 1)
  names(spanner) <- c(" ", column_spanner, " ")
  

  data %>%
    mutate(!!x := as.character(!!x), !!y := as.character(!!y)) %>%
    pivot_wider(names_from = !!y, values_from = !!total) %>%
    rows_insert(
      colSums(.[,1:length(y_levels)+1]) %>% 
        t() %>% 
        data.frame() %>%
        setNames(y_levels) %>% 
        mutate(!!sym(rlang::as_label(x)) := "Total"), 
      by = rlang::as_label(x)) %>%
    mutate(Total = rowSums(.[,1:length(y_levels)+1])) %>%
    kbl(format = "html", align = c("l", rep("c", times = length(y_levels)+1))) %>%
    add_header_above(spanner) %>%
    htmltools::HTML()

    
}

custom_map <- function(data, title = "") {
  data %>%
    leaflet() %>%
    addTiles() %>%
    addCircleMarkers(
      radius =3,
      opacity = 1,
      fillOpacity = 1,
      fill = TRUE,
      fillColor = "#FF0000",
      clusterOptions = markerClusterOptions( spiderfyOnMaxZoom = TRUE, spiderLegPolylineOptions = list(weight = 1.5, color = "#FF0000", opacity = 1))
    ) %>%
    addControl(title, position = "bottomleft")
}