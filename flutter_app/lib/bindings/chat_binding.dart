// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';

class ChatBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
  }
}
