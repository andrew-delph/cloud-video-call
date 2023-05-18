import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/screens/login_screen.dart';
import 'package:flutter_app/screens/main_screen.dart';
import 'package:flutter_app/services/app_service.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';

import 'config/firebase_options.dart';
import 'controllers/auth_controller.dart';
import 'routes/app_pages.dart';
import 'services/auth_service.dart';

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
  // await GetStorage.init();
  // OAuthClientService _OAuthClientService = Get.put(OAuthClientService());
  // await _OAuthClientService.initCredentials();
  // Get.put(
  //     AuthController(Get.put(AuthApiService()), Get.put(OAuthClientService())),
  //     permanent: true);
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  Get.put(AuthController(Get.put(AuthService())), permanent: true);
  log('Initialize');
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    String title = 'Random video chat';

    return StreamBuilder<User?>(
        stream: FirebaseAuth.instance.idTokenChanges(),
        builder: (BuildContext streamContext, AsyncSnapshot<User?> snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            // Show a loading screen while waiting for the authentication state to change
            return const CircularProgressIndicator();
          }

          if (!snapshot.hasData) {
            print("loggin!!!!!");

            return GetMaterialApp(
                debugShowCheckedModeBanner: false,
                title: title,
                theme: ThemeData(primarySwatch: Colors.green),
                home: const LoginScreen());
          } else {
            print("loading app!!!!!");
            return ChangeNotifierProvider(
                create: (context) => AppProvider(),
                child: GetMaterialApp(
                    debugShowCheckedModeBanner: false,
                    title: title,
                    theme: ThemeData(primarySwatch: Colors.green),
                    home: const MainScreen()));
          }
        });
  }
}
