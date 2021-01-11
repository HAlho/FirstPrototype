{
	"targets":[
	{
	"target_name": "calculate",
	"include_dirs" : [
    "<!(node -e \"require('nan')\")"
	],
	"sources": ["calculate.cc"]
	}
	] 
}