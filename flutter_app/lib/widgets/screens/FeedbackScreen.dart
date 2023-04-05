import 'package:flutter/material.dart';
import 'package:flutter_app/state_machines.dart';

import '../../AppProvider.dart';
import '../SwipeDetector.dart';

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

  Future<void> sendScore(score) {
    return widget.appProvider
        .sendChatScore(score)
        .then((value) {})
        .catchError((error) {
      SnackBar snackBar = SnackBar(
        content: Text(error.toString()),
      );

      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    }).whenComplete(() {
      widget.appProvider.chatMachine.current = ChatStates.end;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget page = Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.blue,
        child: Column(
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
                sendScore(_value.toDouble());
              },
              child: const Text('Submit'),
            ),
          ],
        ));

    page = SwipeDetector(
        onHorizontalDragEnd: (double score) {
          sendScore(score);
        },
        child: page);

    return page;
  }
}
