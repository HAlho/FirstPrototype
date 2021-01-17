#include <napi.h>
#include <string>
#include <iostream>

#include <node.h>
#include <assert.h>
#include <stdlib.h>

using namespace std;



Napi::String calc(const Napi::CallbackInfo& args) {
	Napi::Env env = args.Env();
	int u;
	napi_get_value_int32(env,args[0],&u);
	cout << "u is :" << u << endl;
	int n = u;
	int num=0;
	for (int a = 0; a < n;a++)
		/*for (int b = 0;b < n;b++)
			for (int c = 0;c < n;c++)
				for (int d = 0;d < n;d++)
					for (int e = 0;e < n;e++)
						for (int f = 0;f < n;f++)
							for (int g = 0;g < n;g++)
								for (int h = 0; h < n;h++)
									for (int i = 0;i < n;i++)
										for (int j = 0;j < n;j++)*/
											num++;

	cout << "the result is "<< num<<endl;
	std::string result = "Don "+num;
	//napi_value* r;
	//napi_create_string_utf16(env, result, result.length(), r);
	//return r;
	return Napi::String::New(env, result);

}

//Napi::String cleanup_cb1(void* arg) {
//	
//}



Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Set(
		Napi::String::New(env, "calc"),
		Napi::Function::New(env, calc)
	);
	//napi_add_env_cleanup_hook(env, cleanup_cb1, result)
	return exports;
}

NODE_API_MODULE(indexc, Init);//create indexc.node
