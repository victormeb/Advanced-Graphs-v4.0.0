# --- Used for creating plots ---
# Used for many nice looking plots
library(ggplot2)

# Used for likert plots
library(likert)

# Used to get good color palettes
library(RColorBrewer)
getPalette = colorRampPalette(brewer.pal(8, "Set2"))
library(viridis)
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
                  low.color="forestgreen",
                  high.color = "red3",
                  neutral.color = "lightgoldenrod",
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
custom_scatter <- function(data, field_labels = NULL, date_fields = c()) {
  # If any number of columns other than two is provided, stop
  if (ncol(data) != 2) stop(paste0("custom_scatter takes a dataframe with two columns, (",ncol(data),") provided."))
  
  # If field_labels is NULL use the names of the passed dataframes
  if (is.null(field_labels)) {
    field_labels <- names(data)
  } else if (length(field_labels) != 2 || typeof(field_labels) != "character") {
    stop("field_labels must be a character vector or character list of length 2")
  }
  
  data %>%
    mutate(across(all_of(date_fields), as.Date, tryFormats = c("%m/%d/%Y", "%Y-%m-%d", "%Y/%m/%d"))) %>%
    na.omit() %>%
    (function(fixed_data) {
      if (nrow(fixed_data) != 0) {
        plot(
          fixed_data,
          main = paste0(field_labels, collapse = " vs "),
          xlab = field_labels[1],
          ylab = field_labels[2],
          type = "p",
          xaxt = "n",
          yaxt = "n",
          # TODO: Make point sizes increase for repeated (y?) values
          #cex= points_to_plot[,3]
          pch=19, 
          col="blue"
        )
        if (length(date_fields) == 0) {
          axis(side = 1, labels = TRUE, las = 1)
          axis(side = 2, labels = TRUE, las = 1)
        } else if (length(date_fields) == 1) {
          axis.Date(side = which(names(fixed_data) == date_fields), fixed_data[[date_fields]], labels = TRUE, las = 1)
          axis(side = which(names(fixed_data) != date_fields), labels = TRUE, las = 1)
        } else {
          axis.Date(side = 1, fixed_data[[date_fields[1]]], labels = TRUE, las = 1)
          axis.Date(side = 2, fixed_data[[date_fields[2]]], labels = TRUE, las = 1)
        }
      }
    })
}

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
custom_bars <- function(data, x, y, label2 = NULL, percent = FALSE, margin = 15, angle_rotation = 45, v_just = 0.5, x_title_size = 8, legend_size = 7) {
  # enquo the passed parameters to be used in aes
  x <- enquo(x)
  y <- enquo(y)
  label2 <- enquo(label2)
  
  # Get the number of rows in the data
  n_bars <- nrow(data)
  
  # Set the size of the label text based on the number of bars
  label_size <- if (n_bars > 7) 3 else 5
  
  # If there are more than 25 bars rotate the labels 90 degrees
  if (n_bars > 25) {
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
    # Use x and y as out x and y
    ggplot(aes(x=!!x, y = !!y)) +
    # Create bars
    geom_bar(stat = "identity", color="black", fill= getPalette(n_bars)) +
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
custom_stacked <- function(data, x, y, fill, title = "") {
  # Enquo our passed parameters so they can be used in aes
  x <- enquo(x)
  y <- enquo(y)
  fill <- enquo(fill)
  
  # Count the number of bars
  n_bars = data %>% select(!!x) %>% distinct() %>% nrow()
  
  # Count the number of stacks
  n_stacks = data %>% select(!!y) %>% distinct() %>% nrow()
  
  # Set parameters for when there 34 or fewer bars or stacks
  angle_rotation = 45
  v_just = 0.5
  x_size = 8
  legend_size = 7
  
  # If there are more than 34 bars
  if (n_bars > 34) {
    # Rotate the x labels to 90 degrees
    angle_rotation = 90
    v_just = 0
  }
  
  # If there are more than 34 stacks
  if (n_stacks > 34) {
    # Decrease the size of the label text
    x_size = 7
    # And decrease the legend size
    legend_size = 5
  }
  
  # Pass the data to ggplot
  data %>%
    # Use the passed parameters
    # TODO: Swap fill and y?
    ggplot(aes(x=!!x, fill = !!y, y = !!fill)) +
    # Add bars
    geom_bar(position = "stack", color="darkblue", stat = "identity") +
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
#   Takes a dataframe in the style of a contingency table and a label for the 
#   columns and produces a kable table of that style.
#
#   Input:
#     
#     A dataframe in the style of a contingency table and a label for the 
#     columns.
#
#   Output:
#     
#     A contingency table
custom_crosstab <- function(data, column_spanner = "Columns") {
  spanner <- c(1, ncol(data)-1)
  names(spanner) <- c(" ", column_spanner)
  
  data %>%
    kable() %>%
    add_header_above(spanner)
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