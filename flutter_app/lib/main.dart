import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'AppWidget.dart';
import 'firebase_options.dart';

void main() async {
  print("Start main...");
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  var db = FirebaseFirestore.instance;

  // await db.collection("users").doc("count").get().then((value) {
  //   print("count from firestore ${value.data()}");
  // });

  db.collection("users").doc("count").snapshots().listen(
        (event) => print("live count from firestore: ${event.data()}"),
        onError: (error) => print("Listen failed: $error"),
      );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'Random video chat',
        theme: ThemeData(primarySwatch: Colors.green),
        home: Scaffold(
          appBar: AppBar(
            title: const Text('Random video chat'),
          ),
          body: const Center(
            child: AppWidget(),
          ),
        ));
  }
}
