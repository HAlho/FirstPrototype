#include <node.h>
#include <iostream>
#include <nan.h>
#include <cmath>
#include <cstdio>
#include <queue>
#include <string>
#include <fstream>
#include <sstream>
#include <time.h>

#define FREE -1
#define CANTREACH -10
#define PAIRED -100

using namespace v8;
using namespace std;

/** GLOBAL VARIABLES **/

const int MPSIZE = 4; //Max number of meeting points
const int PROVIDERS = 25; //Max number of providers
const int CONSUMERS = 25; //Max number of consumers
const int MaxNumOfIter = 50; //Max number of iterations

/** CLASSES **/

class MP {
public:
	int MPid; //meeting point id
	long double latitude; //meeting point latitude
	long double longitude; //meeting point longitude

};

class consumer {
public:
	string uid; //user id
	double latitude; //user latitude
	double longitude; //user longitude
	int carId; //user's car id
	double consumptionRate; //the car's consumption rate
	double maxDistance; //max distance the user can reach
	double neededEnergy;
	double distanceToMP[MPSIZE];
	double timeToMP[MPSIZE];

};

class provider {
public:
	string uid; //user id
	double latitude; //user latitude
	double longitude; //user longitude
	int carId; //user's car id
	double consumptionRate; //the car's consumption rate
	double pUnitPrice; //unit price set by the provider
	double distanceToMP[MPSIZE];
	double timeToMP[MPSIZE];

};

class pairs {
public:
	double cost;
	double profit;
};

class output { //final pairs (M)
public:
	int k;
	int j;
	bool matched;
};

//store info passed from the server
MP MPSet[MPSIZE]; //array of meeting points, class MP
consumer consumerSet[CONSUMERS]; //array of consumers
provider providerSet[PROVIDERS]; //array of providers

//store consumer-provider pairs and their preference lists
pairs pairSet[MPSIZE][CONSUMERS][PROVIDERS]; //array of all possible sets
int cList[MPSIZE][CONSUMERS][PROVIDERS]; //consumer preference list, lowest to highest cost
int pList[MPSIZE][PROVIDERS][CONSUMERS]; //provider preference list, highest to lowest profit

//store current matchings, used in the gale shapely algorithm
int consumerCurrentMatch[MPSIZE][CONSUMERS]; //consumer current match (called 'H' in the provided algorithm)
int providerCurrentMatch[MPSIZE][PROVIDERS]; //provider current match
int consumerNextProposal[MPSIZE][CONSUMERS];

//store final matchings
output M[CONSUMERS];
int Matching = 0;

/** READ FILES WRITTEN BY THE SERVER **/

int countC = 0;
int countP = 0;
int cReach = 0;
//read information regarding all the available MPs
void readMPFromFile() {
	ifstream MPFile("./IOs/MPFile.txt");
	string temp;
	int k = 0;
	while (getline(MPFile, temp)) {
		// Output the text from the file
		istringstream my_stream(temp);
		my_stream >> MPSet[k].MPid;
		my_stream >> MPSet[k].latitude;
		my_stream >> MPSet[k].longitude;
		cout << "MPfile: " << MPSet[k].MPid << " " << MPSet[k].latitude << " " << MPSet[k].longitude << endl;
		k++;
		//my_stream >> MPSet[k++].loc;
	}
	MPFile.close();
}

//read information regarding all the available providers
void readPFromFile(int pid) {
	string filep = "./IOs/p" + to_string(pid) + ".txt";
	cout << filep << endl;
	//ifstream PFile("./IOs/p13040.txt");
	ifstream PFile(filep);

	string temp;
	int j = 0;

	if (!PFile.is_open()) cout << "PFile is not open" << endl;


	while (getline(PFile, temp)) {
		// Output the text from the file
		istringstream my_stream(temp);

		my_stream >> providerSet[j].uid;
		my_stream >> providerSet[j].latitude;
		my_stream >> providerSet[j].longitude;
		my_stream >> providerSet[j].pUnitPrice;
		my_stream >> providerSet[j].consumptionRate;
		for (int k = 0; k < MPSIZE; k++) {
			my_stream >> providerSet[j].distanceToMP[k];
			providerSet[j].distanceToMP[k] = providerSet[j].distanceToMP[k] / 1000;
			my_stream >> providerSet[j].timeToMP[k];
			providerSet[j].timeToMP[k] = providerSet[j].timeToMP[k] / 3600;
		}
		//cout << "consumer: " << consumerSet[i].uid << " " << consumerSet[i].latitude << " " << consumerSet[i].longitude << " " << consumerSet[i].neededEnergy << " " << consumerSet[i].maxDistance << " " << consumerSet[i].consumptionRate << endl;

		j++;
		countP++;
		cout << "provider num " << countP << endl;
	}
	PFile.close();
}

//read information regarding all the available consumers
void readCFromFile(int pid) {
	string filec = "./IOs/c" + to_string(pid) + ".txt";
	cout << filec << endl;
	//ifstream CFile("./IOs/c13040.txt");
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
			consumerSet[i].distanceToMP[k] = consumerSet[i].distanceToMP[k] / 1000;
			my_stream >> consumerSet[i].timeToMP[k];
			consumerSet[i].timeToMP[k] = consumerSet[i].timeToMP[k] / 3600;
		}
		//cout << "consumer: " << consumerSet[i].uid << " " << consumerSet[i].latitude << " " << consumerSet[i].longitude << " " << consumerSet[i].neededEnergy << " " << consumerSet[i].maxDistance << " " << consumerSet[i].consumptionRate << endl;


		for (int k = 0; k < MPSIZE; k++) {
			if (consumerSet[i].distanceToMP[k] < consumerSet[i].maxDistance) {
				cReach++;
				break;
			}
		}
		i++;
		countC++;
		cout << "consumer num " << countC << endl;
	}
	CFile.close();
}


/** CALCULATE COSTS AND PROFITS **/

//constants used to calculate the cost and profit, provided by Mohammed Shurrab
const double unitPrice = 8;
const double Y = 10;
const double powerTransEff = 95;
const double CR = 40;
const double batteryRepCost = 150;
const double batteryDegradationCoefficient = 0.27;

//cost calculations, given the i (consumer), j (provider) and k (meeting point)
double findCost(int i, int j, int k) {
	//initialize variables
	double neededEnergy = consumerSet[i].neededEnergy;
	double dCToMP = consumerSet[i].distanceToMP[k];
	double dPToMP = providerSet[j].distanceToMP[k];
	double travelCT = consumerSet[i].timeToMP[k];
	double travelPT = providerSet[j].timeToMP[k];
	double pUnitPrice = providerSet[j].pUnitPrice;
	double consumptionRateC = consumerSet[i].consumptionRate;
	double consumptionRateP = providerSet[j].consumptionRate;

	//travel cost calculations
	double chargingT = neededEnergy / (powerTransEff * CR);
	double waitingT = abs(travelCT - travelPT);
	double totalCT, totalPT;
	if (travelPT > travelCT) { //consumer reaches MP first
		totalCT = (travelCT + chargingT + waitingT) * Y;
		totalPT = (travelPT + chargingT) * Y;
	}
	else { //provider reaches MP first
		totalCT = (travelCT + chargingT) * Y;
		totalPT = (travelPT + chargingT + waitingT) * Y;
	}
	double travelCostCToMP = unitPrice * dCToMP * consumptionRateC;
	double travelCostPToMP = pUnitPrice * dPToMP * consumptionRateP;

	//payment cost calculations
	double energyCost = pUnitPrice * neededEnergy;
	double batteryDegradationCost = batteryRepCost * batteryDegradationCoefficient * neededEnergy;
	double operationalCost = totalPT + batteryDegradationCost + travelCostPToMP;
	double paymentCToP = energyCost + operationalCost;

	return travelCostCToMP + totalCT + paymentCToP; //return cost
}

//profit calculations, given the i (consumer) and j (provider)
double findProfit(int i, int j) {
	//initialize variables
	double neededEnergy = consumerSet[i].neededEnergy;
	double pUnitPrice = providerSet[j].pUnitPrice;

	//calculations
	return neededEnergy * (pUnitPrice - unitPrice / powerTransEff); //return profit
}

//calculate the cost and profit for each pair in pairSet. sort cList and pList.
void calculate() {
	for (int k = 0; k < MPSIZE; k++) { 	//for each meeting point MP
		double minP[PROVIDERS]; //store min profit for each provider. used when sorting the pList array
		for (int i = 0; i < countC; i++) { //for each consumer
			double distance = consumerSet[i].distanceToMP[k];
			//calculate the distance between consumer and MP given the latitudes/longitudes 
			cout << "Distance at " << k << " " << distance << " Max distance: " << consumerSet[i].maxDistance << endl;
			if (distance < consumerSet[i].maxDistance) { //maxDistance is calculated in profile.js client side
				double maxC; //store max costs for current consumer. used when sorting the cList array

				for (int j = 0; j < countP; j++) { //for each provider

					//calculate and store the cost
					double cost = findCost(i, j, k);
					pairSet[k][i][j].cost = cost;

					//add new cost to sorted list
					if (j == 0) { //if it's the first provider
						cList[k][i][j] = 0;
						maxC = cost;
					}
					else if (cost >= maxC) { //if cost > max cost, add it to the end
						cList[k][i][j] = j;
						maxC = cost;
					}
					else { //if the new cost is somewhere in the list, find the new position then add it
						int pos;
						for (pos = 0; pos < j; pos++) {
							if (cost <= pairSet[k][i][cList[k][i][pos]].cost)
								break;
						}
						//shift everything after pos to the right
						int b = j;
						while (b > pos) { cList[k][i][b] = cList[k][i][b - 1]; b--; }
						//add the new provider
						cList[k][i][pos] = j;
					}


					//calculate and store the profit
					double profit = findProfit(i, j);
					pairSet[k][i][j].profit = profit;

					//add new profit to sorted list
					if (i == 0) { //if it's the first consumer
						pList[k][j][i] = 0;
						minP[j] = profit;
					}
					else if (profit <= minP[j]) { //if the profit < min profit, add it to the end
						pList[k][j][i] = i;
						minP[j] = profit;
					}
					else { //if the new profit is somewhere in the list, find the new position then add it
						int pos;
						for (pos = 0; pos < i; pos++) {
							if (profit >= pairSet[k][pList[k][j][pos]][j].profit) break;
						}
						//shift everything after pos to the right
						int b = i;
						while (b > pos) { pList[k][j][b] = pList[k][j][b - 1]; b--; }
						//add the new provider
						pList[k][j][pos] = i;
					}
				}
			}
			else {
				for (int j = 0; j < countP; j++) {
					//pairSet[k][i][j].cost = 0;
					cList[k][i][j] = CANTREACH;
					//pairSet[k][i][j].profit = 0;
					pList[k][j][i] = CANTREACH;
				}
				consumerCurrentMatch[k][i] = CANTREACH;
			}
		}
	}
}



/** MATCHING ALGORITHM **/

void galeShapely() {
	for (int k = 0; k < MPSIZE; k++) {
		//clear variables
		for (int j = 0; j < countP; j++) {
			if (providerCurrentMatch[k][j] != PAIRED)
				providerCurrentMatch[k][j] = FREE;
		}

		for (int i = 0; i < countC; i++) {
			if (consumerCurrentMatch[k][i] != PAIRED && consumerCurrentMatch[k][i] != CANTREACH) {
				consumerCurrentMatch[k][i] = FREE;
				consumerNextProposal[k][i] = 0;
			}
		}

		//start the gale shapely algorithm with the first nonpaired consumer
		int i = 0;
		for (i; i < countC; i++)
			if (consumerCurrentMatch[k][i] != PAIRED && consumerCurrentMatch[k][i] != CANTREACH) break;


		bool freeConsumerAvailable = true;

		while (freeConsumerAvailable) {
			freeConsumerAvailable = false;
			int j = cList[k][i][consumerNextProposal[k][i]++];
			if (providerCurrentMatch[k][j] == PAIRED) {
				freeConsumerAvailable = true;
				continue;
			}
			if (providerCurrentMatch[k][j] == FREE) {
				//j is currently free, match (i and j)...
				providerCurrentMatch[k][j] = i;
				consumerCurrentMatch[k][i] = j;
			}
			else {
				//j is engaged...
				bool itsABetterProposal = false;     // check if it's a better proposal
				//check the provider's preference list
				for (int y = 0; y < countC; y++) {
					if (pList[k][j][y] == providerCurrentMatch[k][j]) {
						itsABetterProposal = false; break;
					}
					if (pList[k][j][y] == i) {
						itsABetterProposal = true; break;
					}
				}
				if (itsABetterProposal) {
					// if a better proposal, then engage (i and j), and set j's previous partner as free...
					consumerCurrentMatch[k][providerCurrentMatch[k][j]] = FREE;
					providerCurrentMatch[k][j] = i;
					consumerCurrentMatch[k][i] = j;
				}
			}

			//finding a new free consumer...
			for (int x = 0; x < countC; x++) {
				if (consumerCurrentMatch[k][x] == FREE) {
					if (consumerNextProposal[k][x] > PROVIDERS) continue;
					i = x;
					freeConsumerAvailable = true;
					break;
				}
			}
		}
	}
}

void satisfaction() {
	double sAvg[MPSIZE][CONSUMERS];
	for (int k = 0; k < MPSIZE; k++) {
		for (int i = 0; i < countC; i++) {
			double sC, sP; //consumer and provider satisfaction
			int n, rank; //n and rank, used to calculate satisfaction
			if (consumerCurrentMatch[k][i] < 0) continue;

			int j = consumerCurrentMatch[k][i];
			cout << "calculating satisfaction for k = " << k << ", i = " << i << endl;
			n = 0;
			//find consumer satisfaction sC
			for (int prov = 0; prov < countP; prov++) {
				if (providerCurrentMatch[k][cList[k][i][prov]] == PAIRED) continue;
				if (cList[k][i][prov] == j) rank = prov;
				n++;
			}
			sC = 100 * (1 - (double)rank / n);

			n = 0;
			//find provider satisfaction sP
			for (int cons = 0; cons < countC; cons++) {
				if (consumerCurrentMatch[k][pList[k][j][cons]] < 0) continue;
				if (pList[k][j][cons] == i) rank = cons;
				n++;
			}
			sP = 100 * (1 - (double)rank / n);

			sAvg[k][i] = (sC + sP) / 2;

			cout << "satisfaction: MP:" << k << ": i = " << i << ": " << sAvg[k][i] << endl;
		}
	}

	//Find the pair with the highest satisfaction
	int mp = 0;
	int cons = 0;
	double sMax = -201;
	cout << "sMax is " << sMax << endl;
	for (int k = 0; k < MPSIZE; k++) {
		for (int i = 0; i < countC; i++) {
			if (consumerCurrentMatch[k][i] < 0) continue;
			if (sAvg[k][i] > sMax) {
				mp = k;
				cons = i;
				sMax = sAvg[k][i];
				cout << "new sMax is " << sMax << endl;
			}
			else if (sAvg[k][i] == sMax) {
				if (pairSet[k][i][consumerCurrentMatch[k][i]].cost < pairSet[mp][cons][consumerCurrentMatch[mp][cons]].cost) {
					mp = k;
					cons = i;
					sMax = sAvg[k][i];
					cout << "new sMax is " << sMax << endl;
				}
			}
		}
	}

	//Add the pair with the highest satisfaction to M
	int prov = consumerCurrentMatch[mp][cons];
	M[cons].k = mp;
	M[cons].j = prov;
	M[cons].matched = true;

	Matching++;
	cout << "M = " << cons << ", " << prov << ", " << mp << endl;

	//Remove the pair with the highest satisfaction
	for (int k = 0; k < MPSIZE; k++) {
		consumerCurrentMatch[k][cons] = PAIRED;
		providerCurrentMatch[k][prov] = PAIRED;
	}
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
		int pid = args[2]->IntegerValue(Nan::GetCurrentContext()).FromJust();


		// Start measuring time
		clock_t start = clock();

		//read needed info from files
		readMPFromFile();
		readPFromFile(pid);
		readCFromFile(pid);

		//calculate cost and profit for each pair while also sorting each user's preference list
		calculate();

		for (int i = 0; i < countC; i++) M[i].matched = false;

		//display costs, profits, and pref. lists
		cout << "\n profit. for each provider:\n";
		for (int k = 0; k < MPSIZE; k++) {
			cout << "MP: " << k << endl;
			for (int j = 0; j < countP; j++) {
				cout << j << ": ";
				for (int i = 0; i < countC; i++) {
					cout << findProfit(i, j) << endl;
				}
				cout << endl;
			}
		}
		cout << "\n cost. for each consumer:\n";
		for (int k = 0; k < MPSIZE; k++) {
			cout << "MP: " << k << endl;
			for (int i = 0; i < countC; i++) {
				cout << i << ": ";
				for (int j = 0; j < countP; j++) {
					cout << findCost(i, j, k) << endl;
				}
				cout << endl;
			}
		}
		cout << "\n pref. list for each provider:\n";
		for (int k = 0; k < MPSIZE; k++) {
			cout << "MP: " << k << endl;
			for (int j = 0; j < countP; j++) {
				cout << j << ": ";
				for (int i = 0; i < countC; i++) {
					cout << pList[k][j][i] << ", ";
				}
				cout << endl;
			}
		}
		cout << "\n pref. list for each consumer:\n";
		for (int k = 0; k < MPSIZE; k++) {
			cout << "MP: " << k << endl;
			for (int i = 0; i < countC; i++) {
				cout << i << ": ";
				for (int j = 0; j < countP; j++) {
					cout << cList[k][i][j] << ", ";
				}
				cout << endl;
			}
		}
		cout << endl;



		//the matching algorithm
		int iteration = 1; //incremented after each iteration
		while (iteration < MaxNumOfIter && Matching < cReach && Matching < countP) {

			//run the Gale Shapely algorithm then display the results
			galeShapely();
			for (int k = 0; k < MPSIZE; k++) {
				cout << "\n\nfinal matchings (H): " << k << endl;
				for (int i = 0; i < countC; i++) {
					cout << i << ":" << consumerCurrentMatch[k][i];
					cout << endl;
				}
				cout << endl;
			}

			//run the satisfaction function to find and remove the pair with the highest satisfaction
			satisfaction();
			iteration++;
		}

		ofstream FinalMatching("./IOs/FinalFile" + to_string(pid) + ".txt");

		cout << "\n\nfinal final matchings (M): " << endl;
		for (int i = 0; i < countC; i++) {
			if (M[i].matched == true) {
				cout << i << ":" << M[i].j << " at MP: " << M[i].k << endl;
				FinalMatching << M[i].k << " " << consumerSet[i].uid << " " << providerSet[M[i].j].uid << " " << pairSet[M[i].k][i][M[i].j].cost << endl;
			}
		}
		FinalMatching.close();

		// Stop measuring time and calculate the elapsed time
		clock_t end = clock();
		double elapsed = double(end - start) / CLOCKS_PER_SEC;

		cout << "Time measured: " << elapsed << "seconds." << endl;










		int test = args[0]->IntegerValue(Nan::GetCurrentContext()).FromJust();
		long lat = args[1]->NumberValue(Nan::GetCurrentContext()).FromJust();

		MP a;
		a.latitude = test;
		a.longitude = lat;
		cout << "from c++ " << a.latitude << " then " << a.longitude << endl;
		cout << "num of p:" << countP << " num of c:" << countC << endl;

		//auto total = Number::New(isolate, test(n));
		auto total = 1111;
		args.GetReturnValue().Set(total);
	}

	void Initialize(Local<Object> exports) {
		NODE_SET_METHOD(exports, "calc", Method);
	}

	NODE_MODULE(indexc, Initialize);
}


