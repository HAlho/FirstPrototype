#include <iostream>
#include<cmath>
#include <cstdio>
#include <queue>
#include <string.h>

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

int consumerPref[MPSIZE][CONSUMERS][PROVIDERS];
int providerPref[MPSIZE][PROVIDERS][CONSUMERS];

double findCost() {
	double cost;
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


	double travelCT = dCToMP / vC;
	double travelPT = dPToMP / vP;
	double chargingT = neededEnergy / (powerTransEff * CR);
	double waitingT = abs(travelCT - travelPT) ;
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

double findProfit() {
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
	bool pairedConsumer[CONSUMERS];
	//for each meeting point, pair each consumer with their providers
	for (int k = 0; k < sizeof(MPSet); k++) {
		//clear pairedConsumers
		for (int i = 0; i < CONSUMERS; i++) {
			pairedConsumer[i] = false;
		}

		for (int i = 1; i <= CONSUMERS; i++) {
			if (pairedConsumer[i] == false) {

			}

		}
	}

}
//algorithm
void calculate(MP* MPSet, consumer* consumerSet, provider* providerSet, cars* carSet) {

	//for each meeting point MP
	for (int k = 1; k <= MPSIZE; k++) { //sizeof(MPSet) = MPSIZE

		//for each consumer
		for (int i = 1; i <= CONSUMERS; i++) { //sizeof(consumerSet) = CONSUMERS
			double distance;
			//get distance between consumer and MP given the latitudes/longitudes 

			if (distance < consumerSet[i].maxDistance) { //maxDistance is calculated in profile.js client side

				//for each provider
				for (int j = 1; j <= PROVIDERS; j++) { //sozeof(providerSet) = PROVIDERS
					//calculate cost and profit
					double cost = findCost();
					pairSet[k][i][j].cost = cost;

					double profit = findProfit();
					pairSet[k][i][j].profit = profit;
				}
			}

			//sort consumerpref


		}



		//sort providerpref
	}

	int iteration = 1;
	int M = 0;
	while (iteration < MaxNumOfIter && M < CONSUMERS) {
		
		for (int k = 0; k < sizeof(MPSet); k++) {
			galeShapely();
		}
	}
}









//gale shapely algorithm example online

int ranking[505][505]; // Ranking gives the ranking of each consumer in the preference list of each provider
int consumer_pref[CONSUMERS][PROVIDERS]; // consumer's preference list
int provider_pref[PROVIDERS][CONSUMERS]; // provider's preference list
int Next[505]; // which provider will be proposed for each consumer
int matches[505]; // the current engagement of each provider

int main() {
	queue<int> freeConsumers;
	int count, i, j, w, m, current_provider, current_consumer;
	scanf("%d", &count);
	for (i = 1; i <= count; i++) {
		scanf("%d", &w);
		for (j = 1; j <= count; j++) {
			scanf("%d", &provider_pref[w][j]);
		}
	} // initialize the preference list of provider

	for (i = 1; i <= count; i++) {
		scanf("%d", &m);
		for (j = 1; j <= count; j++) {
			scanf("%d", &consumer_pref[m][j]);
		}
	} // initialize the preference list of consumer

	for (i = 1; i <= count; i++)
		for (j = 1; j <= count; j++)
			ranking[i][provider_pref[i][j]] = j; // initialize ranking

	memset(matches, 0, (count + 1) * sizeof(int));

	for (i = 1; i <= count; i++) {
		freeConsumers.push(i);
		Next[i] = 1;
	}

	while (!freeConsumers.empty()) {
		current_consumer = freeConsumers.front();
		current_provider = consumer_pref[current_consumer][Next[current_consumer]];

		if (matches[current_provider] == 0) {
			matches[current_provider] = current_consumer;
			freeConsumers.pop();
		}
		else if (ranking[current_provider][current_consumer] < ranking[current_provider][matches[current_provider]]) {
			int ex_consumer = matches[current_provider];
			freeConsumers.pop();
			matches[current_provider] = current_consumer;
			freeConsumers.push(ex_consumer);
		}

		Next[current_consumer]++;
	}

	for (i = 1; i <= count; i++) {
		printf("consumer : %d , provider : %d get married!\n", matches[i], i);
	}

}
