{
	"targets":[
	{
	"target_name": "indexc",
	"include_dirs" : [
    "<!(node -e \"require('nan')\")"
	],
	"sources": ["index.cc"]
	},
	{
	"target_name": "check",
	"include_dirs" : [
    "<!(node -e \"require('nan')\")"
	],
	"sources": ["check.cc"]
	}
	] 
} 