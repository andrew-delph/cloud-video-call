import 'package:flutter_app/controllers/options_controller.dart';
import 'package:get/get.dart';

class OptionsBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<OptionsController>(OptionsController());
  }
}
