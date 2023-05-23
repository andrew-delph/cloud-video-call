// Dart imports:
import 'dart:developer';

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_core/firebase_core.dart';
import 'package:get/get.dart';

// Project imports:
import 'config/firebase_options.dart';
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

  Get.put(AuthService(), permanent: true);
  Get.put(LocalPreferences(), permanent: true);
  log('Initialize');
}
