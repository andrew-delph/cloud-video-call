import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/OptionsScreen.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'AppWidget.dart';
import 'ChatScreen.dart';
import 'firebase_options.dart';

import 'package:firebase_auth/firebase_auth.dart';

import 'location.dart';

void main() async {
  print("Start main...");
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  try {
    final userCredential = await FirebaseAuth.instance.signInAnonymously();
    print("Signed in with temporary account. ${userCredential.user?.uid}");
  } on FirebaseAuthException catch (e) {
    switch (e.code) {
      case "operation-not-allowed":
        print("Anonymous auth hasn't been enabled for this project.");
        break;
      default:
        print("Authentication unknown error: $e");
    }
  }

  Position position = await getLocation();

  print("position: $position");

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
    var child =
        Consumer<AppProvider>(builder: (consumerContext, appProvider, child) {
      String title = 'Random video chat (${appProvider.activeCount})';
      return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: title,
          theme: ThemeData(primarySwatch: Colors.green),
          home: const ChatScreen());
    });

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}
