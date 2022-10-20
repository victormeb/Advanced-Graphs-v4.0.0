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
  cat("<center><h4>", title, "</h4></center><div class=\"clearfix\"><div class=\"img-container\">")
    if (class(plot1)[1] == "list")
      for (item in plot1)
        if (class(item)[1] == "character")
          cat(item)
        else
          print(item)
    else
      print(plot1)
  cat("</div>")
  cat("<div class=\"img-container\">")
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
  unique(((0:(n-1))*(m-1))%/%(n-1) + 1)
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
  
  if (length(not_zeros) > n) 
    not_zeros[n_spaced_indices(length(not_zeros), n)] 
  else 
    c(not_zeros, zeros[n_spaced_indices(length(zeros), n-length(zeros))])
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
custom_bars <- function(data, x, y, label2 = NULL, percent = FALSE, max_bars = 15) {
  # enquo the passed parameters to be used in aes
  x <- enquo(x)
  y <- enquo(y)
  label2 <- enquo(label2)
  
  margin = 15
  angle_rotation = 45
  v_just = 0.5
  x_title_size = 8
  
  # Get list of categories
  categories <- eval_tidy(x, data = data)
  
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
  
  # Pass the data to ggplot
  p <- list(data %>%
    # Use x and y as out x and y
    ggplot(aes(x=!!x, y = !!y, fill = !!x)) +
    # Create bars
    geom_bar(stat = "identity") +
    # Add viridis colors
    scale_fill_viridis(discrete = TRUE, option = "D", na.value = "grey", breaks = bar_breaks) + 
    scale_x_discrete(breaks = bar_breaks, expand = expansion(c(0.05,0.05))) +
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
custom_pie <- function(data, x, y, title = "", max_labels = 15) {
  # Enquo the x and y variables
  x <- enquo(x)
  y <- enquo(y)
  
  # Get the levels for the bars
  categories <- levels(eval_tidy(x, data))
  
  # Compute the label colours
  label_color <- if (any(is.na(categories))) c(viridis(length(categories)-1), "grey") else viridis(length(categories))
  
  # Compute whether text should be dark or light based off colours
  text_color <- if_else(farver::decode_colour(label_color, "rgb", "hcl")[,"l"] > 50, "black", "white")
  
  categories_kept <- categories[n_spaces_indices_zeros_first(eval_tidy(y, data), max_labels)]
  
  # Compute the label positions
  label_pos <- data %>% 
    mutate(text_color = text_color) %>%
    filter(!!x %in% categories_kept) %>%
    mutate(
      label = !!x,
      csum = rev(cumsum(rev(!!y))), 
      pos = !!y/2 + lead(csum, 1),
      pos = if_else(is.na(pos), !!y/2, pos)
    )
  
  #options(ggrepel.max.overlaps = Inf)
  
  p <- list(data %>%
    ggplot(aes(x="", y=!!y, fill=!!x)) +
    # Add "Bars"
    geom_bar(width = 1, color = "white", stat='identity') +
    # Convert to pie
    coord_polar(theta = "y", clip = "off") +
    # Add "Turbo" viridis colours
    scale_fill_viridis(discrete = TRUE, option = "D", na.value = "grey", breaks = label_pos$label) +
    # Add labels to slices (amounts)
    
    geom_text(aes(label = replace(!!y, !!y == 0, "")),
              position = position_stack(vjust = 0.5),
              color = text_color) +
    # Add labels to slices
    scale_y_continuous(breaks = NULL)+
    ggrepel::geom_label_repel(data = label_pos, aes(label = label, y = pos), nudge_x = 1, color = label_pos$text_color, max.overlaps = Inf)+
      guides(fill = guide_legend(override.aes = aes(label = "")))+
    # scale_color_manual(values = text_color) +
    # Add title
    #ggtitle(title) +
    theme(
      # Remove ticks
      axis.ticks = element_blank(),
      # Set label size
      axis.text = element_text(size = 15),
      axis.title.y = element_blank(),
      # Set title size and position
      plot.title = element_text(hjust = 0.5, size=5)
    ))
  
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
custom_stacked <- function(data, x, y, fill, title = "", position = "stack", max_bars = 20, max_colors = 20) {
  # Enquo our passed parameters so they can be used in aes
  x <- enquo(x)
  y <- enquo(y)
  fill <- enquo(fill)
  
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
  
  # If they are grouped bar plots
  if (position == "dodge") {
    # Set the size of the bar text based on the number of bars
    bar_text <-  max(1, 8 -7*x_bars*y_bars/(50))
    # Create a geom for the bar labels
    bar_labels <- geom_text(aes(x = !!x, y = !!fill, label = replace(!!fill, !!fill == 0, "")),
                            position = (position_dodge(width = 0.9)), size = bar_text, vjust = -0.2)
    # Make the stack_labels blank
    stack_labels <- geom_blank()
  # Otherwise if they are stacked bar plots
  } else {
    # Set the size of the bar text based on the number of bars
    bar_text <- max(1, 8 - 7*x_bars/(50))
    # Create a geom for the bar labels
    bar_labels <- geom_text(aes(x = !!x, y = !!fill, fill = NULL, label = replace(!!fill, !!fill == 0, "")),
              data = data %>%
                group_by(!!x) %>%
                summarise(!!fill := sum(!!fill)), size = bar_text, vjust = -0.2)
    
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
    stack_labels <- geom_text(aes(x = !!x, y = !!fill, label = replace(!!fill, !!fill == 0, "")),
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
                       breaks = color_breaks) +
    # Only include labels for max_bars bars
    scale_x_discrete(labels = replace(as.character(bar_names), !(bar_names %in% bar_breaks), "")) +
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
custom_crosstab <- function(data, x, y, total, column_spanner = NULL, percent = FALSE) {
  # Enquo, x, y, and total columns
  x <- enquo(x)
  y <- enquo(y)
  total <- enquo(total)
  
  column_spanner <- if (is.null(column_spanner)) as_label(y) else column_spanner
  
  # Get the levels of the y variable to be used as column names
  y_levels <- levels(data[[rlang::as_label(y)]]) %>% replace_na("NA")
  
  # Create a vector for the spanner where the middle value is the number
  # of columns in y
  spanner <- c(1, length(y_levels), 1)
  
  # Don't name the outide spanners but name the 
  # middle spanner the name of y
  names(spanner) <- c(" ", column_spanner, " ")
  

  data %>%
    # Convert x and y to character vectors
    transmute(!!x := as.character(!!x), !!y := as.character(!!y), !!total := !!total) %>%
    # Transform the table so the y levels are columns
    pivot_wider(names_from = !!y, values_from = !!total) %>%
    # Add a row of totals by...
    rows_insert(
      # Taking the colSums of the data
      colSums(.[,1:length(y_levels)+1]) %>% 
        # Transmute the data
        t() %>% 
        # Convert it to data.frame
        data.frame() %>%
        # Set the column names to y_levels
        setNames(y_levels) %>% 
        # Add a column named the same as x with the values having "Total"
        mutate(!!sym(rlang::as_label(x)) := "Total"), 
      # Use "Total" as the name for this row insertion
      by = rlang::as_label(x)) %>%
    # Add a column of row sums
    mutate(Total = rowSums(.[,1:length(y_levels)+1])) %>%
    mutate(across(-c(1), (if (percent) scales::percent else ~.x))) %>%
    # Create a kable table
    kbl(format = "html", align = c("l", rep("c", times = length(y_levels)+1))) %>%
    # Add the spanner
    add_header_above(spanner) %>%
    # Output as html
    htmltools::HTML()

    
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
custom_map <- function(data, lat, lng, type = NULL, count = NULL) {
  color = "#03F"
  weight = 5
  label = NULL
  labelOptions = NULL
  
  if (!is.null(type)) {
    pal = colorFactor(turbo(length(unique(data[[type]]))), domain = unique(data[[type]]))
    color = pal(data[[type]])
  }
  
  if (!is.null(count)) {
    weight = 1 + 20*data[[count]]/max(data[[count]])
    label = data[[count]]
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
    leaflet(height = 800,) %>%
    addTiles() %>%
    addCircleMarkers(
      # Use the given longitude and latitude columns
      lng = data[[lng]],
      lat = data[[lat]],
      # Use the location factor to create colors
      color = color,
      # Make the size of the circles appropriate to the count column
      weight = weight,
      # Add labels to each circle
      label = label,
      labelOptions = labelOptions,
      # Make cirlce opaque
      opacity = 1,
      stroke = TRUE,
      fillOpacity = 1,
      fill = TRUE,
      # Cluster nearby circles together
      clusterOptions = markerClusterOptions( spiderfyOnMaxZoom = TRUE, spiderLegPolylineOptions = list(weight = 1.5, color = "#FF0000", opacity = 1))
    ) %>%
    (
      function(map) {
        if (!is.null(type))
          addLegend(map, "bottomright", pal = pal, values = data[[type]], title = type)
        else
          map
      }
    ) %>%
    # Add a title
    addControl(paste0(lng, " vs ", lat), position = "bottomleft")
}

custom_network <- function(data, x, y) {
  x <- enquo(x)
  y <- enquo(y)
  
  data %>%
    select(!!x, !!y) %>%
  # Create a graph from the data
    graph_from_data_frame(directed = TRUE) %>%
    # Plot it
    plot.igraph(edge.width = 1,
         main = paste0(as_label(x), " -> " , as_label(y)),
         cex.main = 100,
         sub = "",
         edge.arrow.width = 0.5,
         vertex.size = 5,
         edge.arrow.size = 0.5,
         edge.color = "black",
         vertex.size2 = 3,
         vertex.label.cex = .40,
         vertex.color = "cadetblue3",
         asp = 0)
  return(list())
}