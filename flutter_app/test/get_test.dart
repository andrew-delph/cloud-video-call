import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';

void main() {
  test('test observable', () {
    final RxInt value = 0.obs;

    value.value = 2;

    expect(value, equals(2.obs));
  });
}
