// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';
import '../controllers/options_controller.dart';
import '../services/options_service.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
    Get.put<PreferencesController>(
        PreferencesController(Get.put<OptionsService>(OptionsService())));
  }
}
