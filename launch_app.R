library(shiny)
library(RCurl)

folder_address = "C:/inetpub/wwwroot/redcap/modules/advanced_graphs_v4.0.0"

x <- system("ipconfig", intern=TRUE)
z <- x[grep("IPv4", x)]
ip <- gsub(".*? ([[:digit:]])", "\\1", z)

for (i in 1:20) {
  port = sample(3000:8000, 1)
  while (TRUE)
    if (!port %in% c(3659, 4045, 5060, 5061, 6000, 6566, 6665:6669, 6697))
        break
  
  tmp <- try(startServer(ip, port, list()), silent = TRUE)
  
  if (!inherits(tmp, "try-error")) {
    stopServer(tmp)
    break
  }
}

port = 1234

list_string <- function (lst) {
  lst_names <- names(lst)
  paste0("list(", paste(lapply(seq_along(lst), function(i) 
    paste(lst_names[[i]], 
           if (class(lst[[i]]) == "list") 
             list_string(lst[[i]])
           else
             paste0("c(", paste0("\'", lst[[i]], "\'", collapse = ","), ")")
          , sep = "="
    )), collapse = ", "),
    ")"
  )
}

if (!exists("params"))
  params <-  list(pid=c('426'), reportId=c('1085'), token=c('A2024789279DCD1FAD17230994CAFD17'), server_url=c('http://10.124.163.238/redcap/api/'), dynamic_filter1=c('diagnosis1'), dynamic_filter2=c(''), dynamic_filter3=c(''), lf1=c(''), lf2=c(''), lf3=c(''))

params <- list_string(params)

if (Sys.info()["sysname"] == "Windows") {
  shell(
    paste0(
      paste0(file.path(R.home(), "bin/Rscript.exe"), " -e \""),
      "library(shiny); ",
      paste0("params <- ", params,"; "),
      paste0("source(\'", folder_address, "/app.R\');"),
      "server_env <- environment(server); ",
      "server_env$param <- params; ",
      "app <- shiny::shinyApp(ui, server); ",
      paste0("shiny::runApp(app, launch.browser=FALSE, host = \'", ip, "\', port = ", port, ")"),
      "\""
    ),
    wait = FALSE
  )
}

start_time = Sys.time()
while (!url.exists(paste0("http://", ip, ":", port))) {
  Sys.sleep(0.5)
  print(Sys.time() - start_time)
  if (Sys.time() - start_time > 10) {
    break
  }
}

if (url.exists(paste0("http://", ip, ":", port))) cat("The ip follows\nhttp://", ip, ":", port, "\n", sep = "") else cat("The ip follows\nNo ip found\n")