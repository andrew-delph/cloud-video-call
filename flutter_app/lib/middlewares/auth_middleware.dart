import 'dart:developer';

import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../main.dart';
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class AuthMiddleware extends GetMiddleware {
  final AuthService _authService = Get.find();

  @override
  RouteSettings? redirect(String? route) {
    if (!_authService.isAuthenticated()) {
      return RouteSettings(name: Routes.LOGIN);
    }
  }
}
