// Flutter imports:
import 'package:flutter/cupertino.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class AuthMiddleware extends GetMiddleware {
  final AuthService _authService = Get.find();

  @override
  RouteSettings? redirect(String? route) {
    if (!_authService.isAuthenticated()) {
      return RouteSettings(name: Routes.LOGIN);
    }
    return null;
  }
}
