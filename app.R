source("C:/inetpub/wwwroot/redcap/modules/advanced_graphs_v4.0.0/data_manipulation.R")
source("C:/inetpub/wwwroot/redcap/modules/advanced_graphs_v4.0.0/custom_plots.R")

# Get report metadata
project_info <- post_project_info(params)
data_dictionary <- post_data_dictionary(params)

# Retrieve the live filters
live_filters <- parse_live_filters(params, categories, data_dictionary)

# Retrieve report data
report_data <- import_data(params, data_dictionary$field_name[1], live_filters)

categorical_types <- c("radio", "dropdown", "yesno", "truefalse")

categories <- data_dictionary %>%
  filter(field_name %in% names(report_data) & field_type %in% categorical_types)

categories <- setNames(categories$field_name, categories$field_label)

checkbox_fields <- data_dictionary %>%
  filter(field_type == "checkbox") %>%
  filter(any(grepl(paste0(field_name, "___[0-9]+\\b", collapse = "|"), names(report_data))))

checkbox_fields <- setNames(checkbox_fields$field_name, checkbox_fields$field_label)

field_names <- list(categories = categories, checkbox = checkbox_fields)
  
  #setNames(data_dictionary[data_dictionary$field_name %in% names(report_data), "field_label"], names(report_data))

#print(field_names)

#field_names <- list(A = "a", B = "b")

# Define UI for app that draws a histogram ----
ui <- fluidPage(
  
  # App title ----
  titlePanel("Hello Shiny!"),
  
  # Sidebar layout with input and output definitions ----
  sidebarLayout(
    
    # Sidebar panel for inputs ----
    sidebarPanel(
      
      # Input: Slider for the number of bins ----
      selectInput("field_1", label = "Field 1", choices = field_names)
      
    ),
    
    # Main panel for displaying outputs ----
    mainPanel(
      
      # Output: Histogram ----
      #plotOutput(outputId = "distPlot"),
      dataTableOutput('report_data')
      
    )
  )
)

# Define server logic required to draw a histogram ----
server <- function(input, output, session) {
  
  # Histogram of the Old Faithful Geyser Data ----
  # with requested number of bins
  # This expression that generates a histogram is wrapped in a call
  # to renderPlot to indicate that:
  #
  # 1. It is "reactive" and therefore should be automatically
  #    re-executed when inputs (input$bins) change
  # 2. Its output type is a plot
  # output$distPlot <- renderPlot({
  #   
  #   x    <- faithful$waiting
  #   bins <- seq(min(x), max(x), length.out = input$bins + 1)
  #   
  #   hist(x, breaks = bins, col = "#75AADB", border = "white",
  #        xlab = "Waiting time to next eruption (in mins)",
  #        main = "Histogram of waiting times")
  #   
  # })
  # 
  session$onSessionEnded(function() {
    stopApp()
  })
  
  
  output$report_data <- renderDataTable(report_data)
  #output$params <- renderText({toString(params)})
  
}
# shinyApp(ui = ui, server = server)