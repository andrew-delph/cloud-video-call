// Flutter imports:
import 'package:flutter/cupertino.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class AuthMiddleware extends GetMiddleware {
  final AuthService authService = Get.find();

  @override
  RouteSettings? redirect(String? route) {
    if (route != Routes.HOME && !authService.isAuthenticated()) {
      return RouteSettings(name: Routes.LOGIN);
    }
    return null;
  }
}
