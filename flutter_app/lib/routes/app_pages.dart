// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/screens/chat_screen.dart';
import 'package:flutter_app/screens/options_screen.dart';
import '../bindings/chat_binding.dart';
import '../bindings/options_binding.dart';
import '../middlewares/auth_middleware.dart';
import '../widgets/left_nav_widget.dart';
import '../screens/login_screen.dart';

part 'app_routes.dart';

class AppPages {
  static List<GetPage> pages = [
    GetPage(
        name: Routes.LOGIN,
        page: () => const LoginScreen(),
        transition: Transition.noTransition),
    GetPage(
        name: Routes.HOME,
        page: () => ChatScreen(),
        binding: ChatBinding(),
        middlewares: [AuthMiddleware()],
        transition: Transition.fadeIn),
    GetPage(
        name: Routes.OPTIONS,
        page: () => const OptionsScreen(),
        binding: OptionsBinding(),
        middlewares: [AuthMiddleware()],
        transition: Transition.fadeIn),
  ];
}
