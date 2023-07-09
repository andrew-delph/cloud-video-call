// Dart imports:
import 'dart:developer';

// Flutter imports:
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/services/cache_service.dart';
import 'package:flutter_app/services/options_service.dart';
import 'package:flutter_app/widgets/notifications.dart';
import 'config/firebase_options.dart';
import 'routes/app_pages.dart';
import 'services/analytics_service.dart';
import 'services/auth_service.dart';
import 'services/local_preferences_service.dart';

void main() async {
  await initializeApp();

  AnalyticsService analyticsService = Get.find<AnalyticsService>();

  runApp(GetMaterialApp(
    debugShowCheckedModeBanner: false,
    title: "Random Video Chat with AI",
    navigatorObservers: <NavigatorObserver>[analyticsService.observer],
    initialRoute: Routes.HOME,
    getPages: AppPages.pages,
  ));
}

Future<void> initializeApp() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  if (kIsWeb) {
    print('Running on the web platform');
  } else {
    print('Running on a different platform');
    FlutterError.onError = (errorDetails) {
      FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
    };
    // Pass all uncaught asynchronous errors that aren't handled by the Flutter framework to Crashlytics
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }
  Get.put(CacheService(), permanent: true);

  Get.put(AuthService(), permanent: true);
  Get.put(OptionsService(), permanent: true);

  Get.put(NotificationsController(), permanent: true);

  Get.put(LocalPreferences(), permanent: true);

  Get.put(AnalyticsService(), permanent: true);

  log('Initialize');
}
