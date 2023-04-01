import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/widgets/screens/MainScreen.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'firebase_options.dart';

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
    var child =
        Consumer<AppProvider>(builder: (consumerContext, appProvider, child) {
      String title = 'Random video chat';
      return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: title,
          theme: ThemeData(primarySwatch: Colors.green),
          home: const MainScreen());
    });

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}
