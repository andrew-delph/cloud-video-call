import 'dart:io';

import 'package:get/get.dart';

class HomeController extends GetxController with StateMixin {
  @override
  onInit() async {
    change(null, status: RxStatus.loading());

    await Future.delayed(Duration(seconds: 2));

    // if done, change status to success
    change(null, status: RxStatus.success());
    super.onInit();
  }
}
