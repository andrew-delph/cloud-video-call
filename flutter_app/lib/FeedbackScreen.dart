import 'package:flutter/material.dart';

class FeedbackScreen extends StatefulWidget {
  final String label;
  final int min;
  final int max;
  final int initialValue;
  final void Function(int) onSubmit;

  const FeedbackScreen({
    super.key,
    required this.label,
    required this.min,
    required this.max,
    required this.initialValue,
    required this.onSubmit,
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
            widget.onSubmit(_value);
          },
          child: Text('Submit'),
        ),
      ],
    );
  }
}
