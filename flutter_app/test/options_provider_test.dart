// Package imports:
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/services/options_service.dart';

void main() {
  // setUpAll(() async {
  //   await Firebase.initializeApp();
  // });

  test('test OptionsProvider health', () async {
    var provider = OptionsService();

    Response health = await provider.health();

    print("${health.bodyString}");
    print("${health.statusCode}");

    expect(health.statusCode, equals(200));
  });
}
