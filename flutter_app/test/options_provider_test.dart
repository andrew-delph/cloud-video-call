import 'package:flutter_app/provider/options_provider.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';

void main() {
  // setUpAll(() async {
  //   await Firebase.initializeApp();
  // });

  test('test OptionsProvider health', () async {
    var provider = OptionsProvider();

    Response health = await provider.health();

    print("${health.bodyString}");
    print("${health.statusCode}");

    expect(health.statusCode, equals(200));
  });
}
