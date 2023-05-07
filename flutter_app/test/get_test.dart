import 'package:flutter_app/provider/options_provider.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';

void main() {
  test('test observable', () {
    final RxInt value = 0.obs;

    value.value = 2;

    expect(value, equals(2.obs));
  });

  test('test OptionsProvider', () async {
    var provider = OptionsProvider();

    Response health = await provider.health();

    print("${health.bodyString}");
    print("${health.statusCode}");

    expect(health.statusCode, equals(200));
  });
}
