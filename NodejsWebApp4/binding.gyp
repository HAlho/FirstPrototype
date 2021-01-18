{
	"targets":[
	{
	"target_name": "indexc",
	"include_dirs" : [
    "<!(node -e \"require('nan')\")"
	],
	"sources": ["index.cc"]
	}
	] 
} 