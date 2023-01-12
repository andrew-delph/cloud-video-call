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

  print(1);
  var db = FirebaseFirestore.instance;
  print(1);

  final user = <String, dynamic>{
    "first": "Ada",
    "last": "Lovelace",
    "born": 1815
  };

// Add a new document with a generated ID
  db.collection("users").add(user).then((DocumentReference doc) {
    print('DocumentSnapshot added with ID: ${doc.id}');
  }).catchError((onError) {
    print("error1.");
    print(onError);
  });
  print(1);

  // await db.collection("users").get().then((event) {
  //   for (var doc in event.docs) {
  //     print("${doc.id} => ${doc.data()}");
  //   }
  // }).catchError((onError) {
  //   print("error2.");
  // });
  print(1);

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
