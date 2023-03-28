import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_app/utils.dart';

import '../../AppProvider.dart';
import '../../Factory.dart';

import 'package:http/http.dart' as http;

class FeedbackScreen extends StatefulWidget {
  final String label;
  final int min = 0;
  final int max = 10;
  final int initialValue = 5;
  final AppProvider appProvider;

  const FeedbackScreen({
    super.key,
    required this.label,
    required this.appProvider,
  });

  @override
  FeedbackScreenState createState() => FeedbackScreenState();
}

class FeedbackScreenState extends State<FeedbackScreen> {
  late int _value;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(widget.label),
        Slider(
          value: _value.toDouble(),
          min: widget.min.toDouble(),
          max: widget.max.toDouble(),
          onChanged: (newValue) {
            setState(() {
              _value = newValue.round();
            });
          },
        ),
        ElevatedButton(
          onPressed: () {
            widget.appProvider
                .sendChatScore(_value.toDouble())
                .then((value) {})
                .catchError((error) {
              SnackBar snackBar = SnackBar(
                content: Text(error.toString()),
              );

              ScaffoldMessenger.of(context).showSnackBar(snackBar);
              Navigator.of(context).pop();
            }).whenComplete(() {
              widget.appProvider.chatMachine.current = ChatStates.waiting;
            });
          },
          child: const Text('Submit'),
        ),
      ],
    );
  }
}
