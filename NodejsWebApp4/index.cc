#include <node.h>
#include <iostream>
#include <nan.h>
#include <cmath>
#include <cstdio>
#include <queue>
#include <string.h>

#define SINGLE 0;

using namespace v8;
using namespace std;


//change sizes
const int MPSIZE = 50;
const int PROVIDERS = 50;
const int CONSUMERS = 50;
const int CARS = 50;

const int MaxNumOfIter = 50; //MaxNumOfIter


//classes
class MP {
public:
	long latitude;
	long longitude;
};

class consumer {
public:
	int uid;
	int carId;

	long latitude;
	long longitude;

	double maxDistance;
	double neededEnergy;

	int pref[MPSIZE][PROVIDERS];
};

class provider {
public:
	int uid;
	int carId;

	int pref[MPSIZE][CONSUMERS];
};

class cars {
public:
	int id;
	//?
};


class pairs {
public:
	int cost;
	int profit;
};


//global variables (variables passed from the js files)
MP MPSet[MPSIZE];
consumer consumerSet[CONSUMERS];
provider providerSet[PROVIDERS];
cars carSet[CARS];
pairs pairSet[MPSIZE][CONSUMERS][PROVIDERS];

int cList[MPSIZE][CONSUMERS][PROVIDERS];
int pList[MPSIZE][PROVIDERS][CONSUMERS];
int consumerCurrentMatch[MPSIZE][CONSUMERS];
int providerCurrentMatch[MPSIZE][PROVIDERS];
int consumerNextProposal[MPSIZE][CONSUMERS];

double findCost(int i, int j) {
	double cost;
	double unitPrice;
	double neededEnergy = consumerSet[i].neededEnergy;
	double powerTransEff;
	double CR;
	double dPToMP;
	double dCToMP;
	double vP;
	double vC;
	double batteryRepCost;
	double batteryDegradationCoefficient;
	double pUnitPrice;
	double Y;
	double consumptionRateC;
	double consumptionRateP;


	double travelCT = dCToMP / vC;
	double travelPT = dPToMP / vP;
	double chargingT = neededEnergy / (powerTransEff * CR);
	double waitingT = abs(travelCT - travelPT);
	double totalCT = (travelCT + chargingT + waitingT) * Y;
	double totalPT = (travelPT + chargingT + waitingT) * Y;
	double energyCost = pUnitPrice * neededEnergy;
	double batteryDegradationCost = batteryRepCost * batteryDegradationCoefficient * neededEnergy;
	double travelCostPToMP = unitPrice * dPToMP * consumptionRateP;
	double operationalCost = totalPT + batteryDegradationCost + travelCostPToMP;
	double paymentCToP = energyCost + operationalCost;
	double travelCostCToMP = unitPrice * dCToMP * consumptionRateC;

	cost = travelCostCToMP + totalCT + paymentCToP;

	return cost;
}

double findProfit(int i, int j) {
	double profit;
	double unitPrice;
	double neededEnergy;
	double powerTransEff;
	double CR;
	double dPToMP;
	double dCToMP;
	double vP;
	double vC;
	double batteryRepCost;
	double batteryDegradationCoefficient;
	double pUnitPrice;
	double Y;
	double consumptionRateC;
	double consumptionRateP;

	double originalCostCToP = (unitPrice * neededEnergy) / (powerTransEff);
	double travelCT = dCToMP / vC;
	double travelPT = dPToMP / vP;
	double chargingT = neededEnergy / (powerTransEff * CR);
	double waitingT = abs(travelCT - travelPT);
	double totalCT = (travelCT + chargingT + waitingT) * Y;
	double totalPT = (travelPT + chargingT + waitingT) * Y;
	double batteryDegradationCost = batteryRepCost * batteryDegradationCoefficient * neededEnergy;
	double travelCostPToMP = unitPrice * dPToMP * consumptionRateP;
	double operationalCost = totalPT + batteryDegradationCost + travelCostPToMP;
	double energyCost = pUnitPrice * neededEnergy;
	double paymentCToP = energyCost + operationalCost;

	profit = paymentCToP - originalCostCToP - operationalCost;
	return profit;
}


void galeShapely() {

	bool freeConsumerAvailable = true;
	int c = 1;
	int iteration = 1;

	while (iteration < CONSUMERS && freeConsumerAvailable) {
		for (int k = 0;k < MPSIZE;k++) {

			freeConsumerAvailable = false;
			int p = cList[k][c][consumerNextProposal[k][c]++];  // the provider consumer proposes
			if (providerCurrentMatch[k][p] == 0) {
				//w is currently free, engage (m and w)...
				providerCurrentMatch[k][p] = c;
				consumerCurrentMatch[k][c] = p;
			}
			else {
				//p is engaged...
				bool itsABetterProposal = false;     // check if it's a better proposal
				//check her preference list
				for (int y = 0; y < CONSUMERS; y++) {
					if (pList[k][p][y] == providerCurrentMatch[k][p]) {
						itsABetterProposal = false; break;
					}
					if (pList[k][p][y] == c) {
						itsABetterProposal = true; break;
					}
				}
				if (itsABetterProposal) {
					// if a better proposal, then engage (c and p), and set p's previous partner as free...
					consumerCurrentMatch[k][providerCurrentMatch[k][p]] = SINGLE;
					providerCurrentMatch[k][p] = c;
					consumerCurrentMatch[k][c] = p;
				}
			}

			//finding a new free consumer...
			for (int x = 0; x < CONSUMERS; x++) {
				if (consumerCurrentMatch[k][x] == 0) {
					c = x;
					freeConsumerAvailable = true;
					break;
				}
			}
		}



	}
}

// algorithm
void calculate(MP* MPSet, consumer* consumerSet, provider* providerSet, cars* carSet) {

	//for each meeting point MP
	for (int k = 0; k < MPSIZE; k++) { //sizeof(MPSet) = MPSIZE

		//for each consumer
		for (int i = 0; i < CONSUMERS; i++) { //sizeof(consumerSet) = CONSUMERS
			consumerCurrentMatch[k][i] = SINGLE;
			consumerNextProposal[k][i] = 0;
			double distance;
			//get distance between consumer and MP given the latitudes/longitudes 

			if (distance < consumerSet[i].maxDistance) { //maxDistance is calculated in profile.js client side

				bool max = true;
				bool min = true;
				//for each provider
				for (int j = 0; j < PROVIDERS; j++) { //sozeof(providerSet) = PROVIDERS
					providerCurrentMatch[k][j] = SINGLE;
					//calculate cost and profit
					double cost = findCost(i, j);
					pairSet[k][i][j].cost = cost;


					if (j == 0) cList[k][i][j] = 0;
					else {
						for (int pos = 0; pos < j; pos++) {
							if (cost < pairSet[k][i][cList[k][i][pos]].cost) {
								for (int b = j; b > pos; b--) {
									cList[k][i][b] = cList[k][i][b - 1];
								}
								cList[k][i][pos] = j;
								max = false;
							}
						}
						if (max == true) cList[k][i][j] = j;
						else max = true;
					}

					double profit = findProfit(i, j);
					pairSet[k][i][j].profit = profit;
					if (i == 0) pList[k][j][i] = 0;
					else {

						for (int pos = 0; pos < i; pos++) {
							if (profit > pairSet[k][j][pList[k][j][pos]].profit) {
								for (int b = i; b > pos; b--) {
									pList[k][j][b] = pList[k][j][b - 1];
								}
								pList[k][j][pos] = i;
								min = false;
							}
						}
						if (min == true) pList[k][j][i] = i;
						else min = true;

					}

				}
			}

			//sort consumerpref

		}

		//sort providerpref

	}

	galeShapely();
}



namespace calcMain {

	using v8::FunctionCallbackInfo;
	using v8::Isolate;
	using v8::Local;
	using v8::Object;
	using v8::Number;
	using v8::Value;

	int factorial(int num) {
		if (num == 1)
			return 1;
		else
			return num * factorial(num - 1);
	}

	int test(int n) {
		int num = 0;
		for (int a = 0; a < n;a++)
			for (int b = 0;b < n;b++)
				for (int c = 0;c < n;c++)
					for (int d = 0;d < n;d++)
						for (int e = 0;e < n;e++)
							for (int f = 0;f < n;f++)
								for (int g = 0;g < n;g++)
									for (int h = 0; h < n;h++)
										for (int i = 0;i < n;i++)
											for (int j = 0;j < n;j++)
												num++;
		cout << "from c++: result: " << num << endl;
		return num;
	}

	void Method(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		//int n = args[0]->IntegerValue(Nan::GetCurrentContext()).FromJust();//the function IntegerValue() is deprecated so this is a workaround to use it

		/*int i;
		double x = 100.468364, y = 200.4793749;
		for (i = 0; i < 100000000; i++) {
			x += y;
		}*/

		int test = args[0]->IntegerValue(Nan::GetCurrentContext()).FromJust();
		long lat = args[1]->NumberValue(Nan::GetCurrentContext()).FromJust();
		MP a;
		a.latitude = test;
		a.longitude = lat;
		cout << "from c++ " << a.latitude << " then " << a.longitude << endl;


		//auto total = Number::New(isolate, test(n));
		auto total = 1111;
		args.GetReturnValue().Set(total);

	}



	void Initialize(Local<Object> exports) {
		NODE_SET_METHOD(exports, "calc", Method);
	}

	NODE_MODULE(indexc, Initialize);
}