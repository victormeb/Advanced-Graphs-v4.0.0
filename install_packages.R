# This command will attempt to install all the packages which are required and are not already installed
install.packages(
  setdiff(
    c("RCurl", "plyr", "stringr", "dplyr", "tidyr", "rlang", "htmltools", "htmlwidgets", "ggplot2", "ggrepel", "leaflet", "likert", "igraph", "viridis", "viridisLite", "kableExtra", "scales", "vctrs", "shiny", "XML"),
    rownames(installed.packages())
  )
)