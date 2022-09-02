# Used in network graphs
library(igraph)

#########################
# Network graphs
#########################


# Initial values
skip_loop <- 0
count_network <- 0
title_len <- 50
x_title_len <- 100
y_title_len <- 30
full_line <- 15

# If report has record id or it's not using filters, it can produce the plots
if(field_name_dd[1]%in% names(data_report_matrix) || filter_condition == "") {
  #} else {
  
  # Loops over all columns in report to create networks
  for(k in 1:report_cols_len) {
    first_field_report <- 0
    first_field_dd <- 0
    second_field_report <- 0
    second_field_dd <- 0
    # Skip some loops to prevent printing the same graph several times
    start_loop <- max(k, skip_loop)
    
    # Loops over all columns in report, starting from next column to review if it's going to be plotted
    for(i in start_loop:report_cols_len) {
      # Loops over all fields in dd to see if they are the correct type and compare field names
      for(j in 1:dd_len) {
        # Checks if fields are the plottable type
        if(field_type_dd[j] == 'text' && is.na(text_val_dd[j]) == FALSE && text_val_dd[j] != "") {
          # Do nothing
        }
        else 
          if(field_type_dd[j] == 'text' ) {
            # Checks if there are columns in the report
            if(( i > 0 )) {
              # Checks if field name in column and dd are the same
              if(col_names_report[i] == field_name_dd[j]) {
                # Assigns second field number if first one has been
                if(first_field_report > 0 && second_field_report == 0) {
                  second_field_report <- i
                  second_field_dd <- j
                  
                }
                # Assigns first field number if it hasn't been
                if(first_field_report == 0) {
                  first_field_report <- i
                  first_field_dd <- j
                }
                # Plots network if two fields have been selected
                if(first_field_report > 0 && second_field_report > 0) {
                  count_network <- count_network + 1
                  cross <- table(data_report_matrix[,first_field_report],
                                 data_report_matrix[,second_field_report])
                  
                  ########################
                  ## Align category codes
                  row_labels <- character( length = length(rownames(cross)) )
                  row_found <- 1
                  # for(i_row in rownames(cross)) {
                  #   for(i_find in 1:length(options_value[first_field_dd,])) {
                  #     # First if is to deal with not having selected any option
                  #     if(i_row == "NA") {
                  #       row_labels[row_found] <- "N/A"
                  #       row_found <- row_found + 1
                  #       break
                  #     }
                  #     # If to assign correct label to each selected option in the table
                  #     else if(is.na(options_value[first_field_dd,i_find]) == FALSE
                  #         && is.na(i_row) == FALSE
                  #         && str_trim(options_value[first_field_dd,i_find]) == i_row) {
                  #           #  print (c("options_label[first_field_dd,i_find]",
                  #           # options_label[first_field_dd,i_find]))
                  #           row_labels[row_found] <- options_label[first_field_dd,i_find]
                  #           row_found <- row_found + 1
                  #           break
                  #     }
                  #   }
                  # }
                  # rownames(cross) <- row_labels
                  # 
                  # col_labels <- character( length = length(colnames(cross)) )
                  # col_found <- 1
                  # for(i_col in colnames(cross)) {
                  #   for(i_find in 1:length(options_value[second_field_dd,])) {
                  #     # First if to deal with not selected any option
                  #     if(i_col == "NA") {
                  #       col_labels[col_found] <- "N/A"
                  #       col_found <- col_found + 1
                  #       break
                  #     }
                  #     # If to assign correct label to each selected option in the table
                  #     #else if(as.numeric(options_value[second_field_dd,i_find]) == as.numeric(i_col)) {
                  #     else if(is.na(options_value[second_field_dd,i_find]) == FALSE  && is.na(i_col) == FALSE
                  #     && str_trim(options_value[second_field_dd,i_find]) == i_col) {
                  #       col_labels[col_found] <- options_label[second_field_dd,i_find]
                  #       col_found <- col_found + 1
                  #       break
                  #     }
                  #   }
                  # }
                  # colnames(cross) <- col_labels
                  # 
                  #               ########################
                  #               ########################
                  #               # Important instruction!
                  #               # It keeps factors and formatting for the table
                  #               cross.df <- as.data.frame.matrix(cross)
                  #               ########################
                  #               ### Network graph
                  #               ########################
                  
                  # Factor names to include in graphs and maps
                  first_factor = factor(data_report_matrix[,second_field_report])
                  second_factor = factor(data_report_matrix[,first_field_report])
                  cross.table.df <- data.frame(first_factor, second_factor)
                  
                  # max_label_size <- 50
                  # # If there is a positive number of options
                  # if(!isTRUE(options_number[second_field_dd] == "") ) {
                  # 
                  #   # Auxilliary vector to reduce label size
                  #   # Copies labels into auxilliary vector
                  #   options_label_short[second_field_dd, ] <- options_label[second_field_dd, ]
                  #   # For each label
                  #   for(t in 1:options_number[second_field_dd] ) {
                  #     # Takes original label size
                  #     # If label is longer than max allowed it truncates it and adds ... at the end
                  #     if(  nchar( options_label[second_field_dd, t])  >   max_label_size  ) {
                  #       options_label_short[second_field_dd, t] <- paste(  
                  #         substr(  options_label[second_field_dd, t], 1, max_label_size), '...')
                  #     }
                  #   }
                  # 
                  #   # Replaces values in options by their label
                  #   first_factor <- mapvalues(first_factor,
                  #                             from = str_trim(options_value[second_field_dd,
                  #                                    1:options_number[second_field_dd] ]),
                  #                             to = options_label_short[second_field_dd,
                  #                                    1:options_number[second_field_dd] ]
                  #   )
                  # }
                  # 
                  #               # Condition to check that there are options for first field
                  #               # (it was throwing a NA/NaN error)
                  #               if(isTRUE(options_number[first_field_dd] == "") ) {
                  #                 # Do nothing, field has no options
                  #               }
                  #               # If there is a positive number of options
                  #               if(!isTRUE(options_number[first_field_dd] == "") ) {
                  # 
                  #                 # Auxilliary vector to reduce label size
                  #                 # Copies labels into auxilliary vector
                  #                 options_label_short[first_field_dd, ] <- options_label[first_field_dd, ]
                  #                 # For each label
                  #                 for(t in 1:options_number[first_field_dd] ) {
                  #                   # Takes original label size
                  #                   # If label is longer than max allowed it truncates it and adds ... at the end
                  #                   if(  nchar( options_label[first_field_dd, t] ) >   max_label_size  ) {
                  #                     options_label_short[first_field_dd, t] <- paste(  substr( 
                  #                       options_label[first_field_dd, t], 1, max_label_size), '...')
                  #                   }
                  #                 }
                  # 
                  #                 # Replaces values in options by their label
                  #                 second_factor <- mapvalues(second_factor,
                  #                                            from = str_trim(options_value[first_field_dd,
                  #                                                   1:options_number[first_field_dd] ]),
                  #                                            to = options_label_short[first_field_dd,
                  #                                                   1:options_number[first_field_dd] ]
                  #                 )
                  #                }
                  
                  ## Network graph
                  data_network <- data.frame(first_factor, second_factor)
                  # Selects list of unique values existing in the report for that first field
                  points_unique <- unique(data_report_matrix[,first_field_report])
                  
                  graph_title <- paste(field_label_dd[second_field_dd], "vs.",
                                       field_label_dd[first_field_dd], sep = " ")
                  graph_title <- remove_html(graph_title)
                  
                  # if(length(unique(second_factor)) > 25 ) graph_title <-
                  #   break_by_words(graph_title , title_len/2)
                  # else  graph_title <- break_by_words(graph_title , title_len)
                  # 
                  # x_label <- break_by_words(field_label_dd[second_field_dd], x_title_len)
                  # y_label <- break_by_words(field_label_dd[first_field_dd], y_title_len)
                  # too_many_cat_x <- ''
                  # too_many_cat_y <- ''
                  # # Adding warning message if there are too many categories 
                  # # in graph that cause overlapping labels or crowded graphs
                  # if(length(unique(second_factor)) > 34 ) too_many_cat_y <- 
                  #   'Too many categories! try to reduce'
                  # if(length(unique(first_factor)) > 34 ) too_many_cat_x <- 
                  #   '(Too many categories! try to reduce)'
                  
                  # legend(x=-1.5, y=-1.1, graph_title, pch=21, col="#777777", pt.bg=colrs, pt.cex=2, cex=.8, bty="n", ncol=1)
                  
                  network <- graph_from_data_frame(data_network, directed = TRUE)
                  plot_network <- plot(network, edge.width = 2,
                                       main = graph_title,
                                       cex.main = 25,
                                       sub = "",
                                       edge.arrow.width = 0.3,
                                       vertex.size = 5,
                                       edge.arrow.size = 0.5,
                                       vertex.size2 = 13,
                                       vertex.label.cex = 1.5,
                                       asp = 0.95,
                                       margin = -0.1)
                  
                  # # Workaround to be able to print the table outside the loop
                  # if(count_network==1) plot_network_1_1 <- plot_network
                  # if(count_network==2) plot_network_1_2 <- plot_network
                  # if(count_network==3) plot_network_1_3 <- plot_network
                  # if(count_network==4) plot_network_1_4 <- plot_network
                  # if(count_network==5) plot_network_1_5 <- plot_network
                  # if(count_network==6) plot_network_1_6 <- plot_network
                  # if(count_network==7) plot_network_1_7 <- plot_network
                  # if(count_network==8) plot_network_1_8 <- plot_network
                  # if(count_network==9) plot_network_1_9 <- plot_network
                  # if(count_network==10) plot_network_1_10 <- plot_network
                  # if(count_network==11) plot_network_1_11 <- plot_network
                  # if(count_network==12) plot_network_1_12 <- plot_network
                  # if(count_network==13) plot_network_1_13 <- plot_network
                  # if(count_network==14) plot_network_1_14 <- plot_network
                  # if(count_network==15) plot_network_1_15 <- plot_network
                  # if(count_network==16) plot_network_1_16 <- plot_network
                  # if(count_network==17) plot_network_1_17 <- plot_network
                  # if(count_network==18) plot_network_1_18 <- plot_network
                  # if(count_network==19) plot_network_1_19 <- plot_network
                  # if(count_network==20) plot_network_1_20 <- plot_network
                  # ###############
                  
                  
                  ######################
                  ######################
                  
                  printed_graphs <- TRUE
                  second_field_report <- 0
                  skip_loop <- first_field_report + 1
                }
              }
            }
          }
      }
    }
  } # k loop
} # record id in the report or no filter applied

