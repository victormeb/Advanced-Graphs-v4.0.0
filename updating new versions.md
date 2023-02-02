# Updating advanced graphs

## To get the latest version of advanced graphs interactive for the first time:

- First, install git https://git-scm.com/  
- Then open the command line and navigate to the modules directory:  
	- `cd <your web root>/redcap/modules`  
- Then enter the following command:  
	- `git clone https://github.com/joelrussellcohen/advanced_graphs_interactive_v1.0.0.git`

## Update to a newer version
To update to a newer version of advanced graphs:
- Navigate to the advanced graphs version: 
	- `cd <your web root>/redcap/modules/advanced_graphs_interactive_vx.x.x`
	- `git pull`

## Changing the remote repository  
The remote repository may change. When this happens the new repository link will be shared at https://github.com/joelrussellcohen/advanced_graphs_interactive_v1.0.0

To change the remote repository.
- Open the command line
- Navigate to the advanced graphs version: 
	- `cd <your web root>/redcap/modules/advanced_graphs_interactive_vx.x.x `
- Get the latest version from the repository  
	- `git remote set-url origin <new.git.url/here>`  
	- `git pull`

<new.git.url/here> can be found on the github page of the remote repository.
