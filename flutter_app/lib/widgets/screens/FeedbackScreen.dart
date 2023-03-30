import 'package:flutter/material.dart';
import 'package:flutter_app/state_machines.dart';

import '../../AppProvider.dart';

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
  double _positionX = 0;

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
      Navigator.of(context).pop();
    }).whenComplete(() {
      widget.appProvider.chatMachine.current = ChatStates.waiting;
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

    page = GestureDetector(
      onHorizontalDragUpdate: (details) {
        setState(() {
          _positionX += details.delta.dx;
        });
      },
      onHorizontalDragEnd: (details) {
        print("onHorizontalDragEnd _positionX $_positionX");
        if (_positionX.abs() > 50) {
          double score = 0;
          if (_positionX > 0) {
            score = 5;
          }
          sendScore(score);
        }
        setState(() {
          _positionX = 0;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        transform: Matrix4.translationValues(_positionX, 0, 0),
        child: page,
      ),
    );

    return page;
  }
}
