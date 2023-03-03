import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'AppWidget.dart';
import 'firebase_options.dart';

void main() async {
  print("Start main...");
  WidgetsFlutterBinding.ensureInitialized();

  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );
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
          title: title,
          theme: ThemeData(primarySwatch: Colors.green),
          home: Scaffold(
            appBar: AppBar(
              title: Text(title),
            ),
            body: const Center(
              child: AppWidget(),
            ),
          ));
    });

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}
