# Install R >= v4.0.1

[R project](https://www.r-project.org/)

Make note of the directory in which you install it. We will use the path to configure Advanced Graphs later.

Also make note of the library path. This can be be found within r using ```.libPaths()```

# Install pandoc for R

If you downloaded Rstudio there should be a version that's been bundled with that. To find it you can use:
```rmarkdown::find_pandoc()```
Otherwise, installing pandoc will be different depending on your OS.

# Clone this repo into redcap

Clone this repo into \<redcap-root\>/modules.  
```git clone https://github.com/victormeb/Advanced-Graphs-v4.0.0.git```  
To install the dependencies, run the following command from within the repo:  
```r install_packages.r```

# Enable this project in **Control Center > External Modules**
  
When configuring this module use the R path, Pandoc path and R libraries path that we have made note of.

# Enabling your first project.

  1. Create an API key for the project.
  2. Navigate to **Control Center > External Modules**
  3. Configure Advanced Graphs.
  4. Click '+' Next to Projects API tokens.
  5. Select the project from the dropdown.
  6. Paste the API token in the Token field.
  7. Navigate to **'First Project' > External Modules**
  8. Enable Advanced Graphs
