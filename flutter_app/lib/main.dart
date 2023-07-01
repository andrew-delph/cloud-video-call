// Dart imports:
import 'dart:developer';
import 'dart:ui';

// Flutter imports:
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
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
  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };
  // Pass all uncaught asynchronous errors that aren't handled by the Flutter framework to Crashlytics
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(GetMaterialApp(
    debugShowCheckedModeBanner: false,
    title: "Random Video Chat with AI",
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
