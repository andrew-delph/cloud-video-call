// Dart imports:
import 'dart:developer';

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/screens/login_screen.dart';
import 'config/firebase_options.dart';
import 'controllers/auth_controller.dart';
import 'routes/app_pages.dart';
import 'services/auth_service.dart';
import 'services/local_preferences_service.dart';

void main() async {
  await initializeApp();

  runApp(GetMaterialApp(
    debugShowCheckedModeBanner: false,
    title: "Random Video Chat with AI",
    theme: ThemeData(primarySwatch: Colors.green),
    initialRoute: Routes.HOME,
    getPages: AppPages.pages,
  ));
}

Future<void> initializeApp() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  Get.put(AuthController(Get.put(AuthService())), permanent: true);
  Get.put(LocalPreferences());
  log('Initialize');
}
