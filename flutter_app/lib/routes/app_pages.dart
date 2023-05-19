import 'package:flutter_app/screens/home_screen.dart';
import 'package:flutter_app/screens/options_screen.dart';
import 'package:get/get.dart';

import '../bindings/home_binding.dart';
import '../middlewares/auth_middleware.dart';
import '../screens/login_screen.dart';
import '../screens/main_screen.dart';
part 'app_routes.dart';

class AppPages {
  static List<GetPage> pages = [
    GetPage(
        name: Routes.LOGIN,
        page: () => const LoginScreen(),
        transition: Transition.noTransition),
    GetPage(
        name: Routes.HOME,
        page: () => HomeScreen(),
        binding: HomeBinding(),
        middlewares: [AuthMiddleware()],
        transition: Transition.fadeIn),
    GetPage(
        name: Routes.OPTIONS,
        page: () => OptionsScreen(),
        middlewares: [AuthMiddleware()],
        transition: Transition.leftToRight),
  ];
}
