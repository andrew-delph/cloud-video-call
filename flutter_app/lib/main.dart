import 'package:flutter/material.dart';

import 'AppWidget.dart';

void main() {
  print("Start main..");

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'Random video chat',
        theme: ThemeData(
          primarySwatch: Colors.green,
        ),
        home: Scaffold(
          appBar: AppBar(
            title: const Text('Flutter layout demo'),
          ),
          body: const Center(
            child: AppWidget(),
          ),
        ));
  }
}
