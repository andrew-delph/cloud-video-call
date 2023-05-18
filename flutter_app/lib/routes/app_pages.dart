import 'package:flutter_app/screens/home_screen.dart';
import 'package:get/get.dart';

import '../middlewares/auth_middleware.dart';
import '../screens/login_screen.dart';
import '../screens/main_screen.dart';
part 'app_routes.dart';

class AppPages {
  static List<GetPage> pages = [
    GetPage(
        name: Routes.HOME,
        page: () => HomeScreen(),
        middlewares: [AuthMiddleware()],
        transition: Transition.fadeIn),
    GetPage(
        name: Routes.LOGIN,
        page: () => const LoginScreen(),
        transition: Transition.native),
  ];
}
