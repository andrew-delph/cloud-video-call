import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/services/AppProvider.dart';
import 'package:flutter_app/screens/LoginScreen.dart';
import 'package:flutter_app/screens/MainScreen.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';

import 'utils/firebase_options.dart';

void main() async {
  print("Start main...");

  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  //
  // var db = FirebaseFirestore.instance;

  // await db.collection("users").doc("count").get().then((value) {
  //   print("count from firestore ${value.data()}");
  // });

  // db.collection("users").doc("count").snapshots().listen(
  //       (event) => print("live count from firestore: ${event.data()}"),
  //       onError: (error) => print("Listen failed: $error"),
  //     );

  runApp(const MyApp());
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

          Widget screen;
          if (!snapshot.hasData) {
            print("loggin!!!!!");

            return MaterialApp(
                debugShowCheckedModeBanner: false,
                title: title,
                theme: ThemeData(primarySwatch: Colors.green),
                home: const LoginScreen());
          } else {
            print("loading app!!!!!");
            return ChangeNotifierProvider(
                create: (context) => AppProvider(),
                child: MaterialApp(
                    debugShowCheckedModeBanner: false,
                    title: title,
                    theme: ThemeData(primarySwatch: Colors.green),
                    home: const MainScreen()));
          }
        });
  }
}
