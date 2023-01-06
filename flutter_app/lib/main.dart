import 'package:flutter/material.dart';

import 'AppWidget.dart';

void main() {
  print("start main");

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo test',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: const AppWidget(),
    );
  }
}
