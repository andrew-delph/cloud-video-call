// Package imports:
import 'package:flutter_app/controllers/auth_controller.dart';
import 'package:get/get.dart';

// Project imports:

class AuthBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<AuthController>(() => AuthController());
  }
}
