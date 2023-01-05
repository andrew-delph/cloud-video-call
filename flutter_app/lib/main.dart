import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'AppController.dart';
import 'AppWidget.dart';

void main() {
  print("new5");

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

