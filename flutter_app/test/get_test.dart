import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_app/services/options_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late GetStorage g;

  const channel = MethodChannel('plugins.flutter.io/path_provider');
  void setUpMockChannels(MethodChannel channel) {
    TestDefaultBinaryMessengerBinding.instance?.defaultBinaryMessenger
        .setMockMethodCallHandler(
      channel,
      (MethodCall? methodCall) async {
        if (methodCall?.method == 'getApplicationDocumentsDirectory') {
          return '.';
        }
        return null;
      },
    );
  }

  setUpAll(() async {
    setUpMockChannels(channel);
  });

  setUp(() async {
    await GetStorage.init();
    g = GetStorage();
    await g.erase();
  });
  test('test observable', () {
    final RxInt value = 0.obs;

    value.value = 2;

    expect(value, equals(2.obs));
  });

  test('test get_storage', () async {
    // await GetStorage.init();
    // final storage = GetStorage('MyPref');

    final username1 = '1'.val('username');

    final username2 = '2'.val('username');

    print("username1: ${username1.val} username2:${username2.val}");

    username1.val = 'update';

    print("username1: ${username1.val} username2:${username2.val}");
  });
}
