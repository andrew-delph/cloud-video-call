// Package imports:
import 'package:flutter_app/controllers/auth_controller.dart';
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';
import '../controllers/options_controller.dart';
import '../services/options_service.dart';

class AuthBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<AuthController>(() => AuthController());
  }
}
