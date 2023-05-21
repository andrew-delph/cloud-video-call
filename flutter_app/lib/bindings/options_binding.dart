// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/controllers/options_controller.dart';
import 'package:flutter_app/services/options_service.dart';

class OptionsBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<OptionsController>(
        OptionsController(Get.put<OptionsService>(OptionsService())));
  }
}
