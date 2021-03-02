//#include <node.h>
//#include <nan.h>
//#include <iostream>
//#include <fstream>
//#include <stdio.h>

#include <node.h>
#include <iostream>
#include <nan.h>
#include <cmath>
#include <cstdio>
#include <queue>
#include <string>
#include <fstream>
#include <sstream>

using namespace v8;
using namespace std;



using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::Number;
using v8::Value;


const int MPSIZE = 2; //Max number of meeting points
const int CONSUMERS = 8; //Max number of consumers

//store all information regarding available consumers
class consumer {
public:
	int uid; //user id
	double latitude; //user latitude
	double longitude; //user longitude
	int carId; //user's car id
	double consumptionRate; //the car's consumption rate
	double maxDistance; //max distance the user can reach
	double neededEnergy; //the amount of needed energy
	double distanceToMP[MPSIZE];
	double timeToMP[MPSIZE];
};

consumer consumerSet[CONSUMERS]; //array of consumers

//read file written by the server regarding all the available consumers
void readCFromFile(int pid) {
	string filec = "./IOs/c" + to_string(pid) + ".txt";
	ifstream CFile(filec);
	string temp;
	int i = 0;
	while (getline(CFile, temp)) {
		// Output the text from the file
		istringstream my_stream(temp);

		my_stream >> consumerSet[i].uid;
		my_stream >> consumerSet[i].latitude;
		my_stream >> consumerSet[i].longitude;
		my_stream >> consumerSet[i].neededEnergy;
		my_stream >> consumerSet[i].maxDistance;
		my_stream >> consumerSet[i].consumptionRate;
		for (int k = 0; k < MPSIZE; k++) {
			my_stream >> consumerSet[i].distanceToMP[k];
			my_stream >> consumerSet[i].timeToMP[k];
		}
		i++;
	}
}


/** MAIN FUNCTION **/

void findMPs(int pid) {
	readCFromFile(pid); //read information regarding all the available consumers
	string filec = "./IOs/MP" + to_string(pid) + ".txt";
	ofstream fout(filec); //file to store meeting point IDs

	//find the meeting points where at least 1 consumer can reach
	for (int k = 0; k < MPSIZE; k++) {
		for (int i = 0; i < CONSUMERS; i++) {
			if(consumerSet[i].distanceToMP[k] <= consumerSet[i].maxDistance) {//no conversion from double to double[2]
				fout << k << endl;
				break;
			}
		}
	}
	fout.close();
}




	

void Method(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = args.GetIsolate();

	cout << "from c++: hello" << endl;
	int pid = args[0]->IntegerValue(Nan::GetCurrentContext()).FromJust();

	findMPs(pid);

	//auto total = Number::New(isolate, test(n));
	auto total = 1111;
	args.GetReturnValue().Set(total);

}



void Initialize(Local<Object> exports) {
	NODE_SET_METHOD(exports, "check", Method);
}

NODE_MODULE(check, Initialize);
