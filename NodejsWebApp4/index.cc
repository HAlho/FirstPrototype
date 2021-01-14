#include <napi.h>
#include <string>
#include <iostream>

using namespace std;

Napi::String greetHello(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	int n = 1000;
	int num=0;
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

	cout << "the result is "<< num<<endl;
	std::string result = "Don "+num;
	return Napi::String::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Set(
		Napi::String::New(env, "greetHello"),
		Napi::Function::New(env, greetHello)
	);

	return exports;
}

NODE_API_MODULE(greet, Init);
