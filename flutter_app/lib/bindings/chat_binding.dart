// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/controllers/chat_controller.dart';
import '../controllers/home_controller.dart';
import '../services/options_service.dart';

class ChatBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<ChatController>(ChatController());
    Get.lazyPut<HomeController>(() => HomeController(Get.put<OptionsService>(
          OptionsService(),
        )));
  }
}
