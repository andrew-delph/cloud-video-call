// Package imports:
import 'package:get/get.dart';

import '../controllers/options_controller.dart';
import '../services/options_service.dart';

// Project imports:

class OptionsBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<PreferencesController>(
        PreferencesController(Get.put<OptionsService>(OptionsService())));
  }
}
