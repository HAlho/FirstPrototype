#include <node.h>
#include <iostream>
#include <nan.h>

using namespace v8;
using namespace std;

namespace calculate {

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
		cout << "from c++: result: " << num << endl;
		return num;
	}

	void Method(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		int n = args[0]->IntegerValue(Nan::GetCurrentContext()).FromJust();//the function IntegerValue() is deprecated so this is a workaround to use it

		/*int i;
		double x = 100.468364, y = 200.4793749;
		for (i = 0; i < 100000000; i++) {
			x += y;
		}*/


		auto total = Number::New(isolate, test(n));
		args.GetReturnValue().Set(total);

	}



	void Initialize(Local<Object> exports) {
		NODE_SET_METHOD(exports, "calc", Method);
	}

	NODE_MODULE(indexc, Initialize);
}