import 'package:flutter/material.dart';

class FeedbackPopup extends StatefulWidget {
  final int minValue;
  final int maxValue;
  final int initialValue;
  final ValueChanged<int> onChanged;

  const FeedbackPopup({
    Key? key,
    required this.minValue,
    required this.maxValue,
    required this.initialValue,
    required this.onChanged,
  }) : super(key: key);

  @override
  _FeedbackPopupState createState() => _FeedbackPopupState();
}

class _FeedbackPopupState extends State<FeedbackPopup> {
  late int _value;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  Widget build(BuildContext context) {
    return Slider(
      min: widget.minValue.toDouble(),
      max: widget.maxValue.toDouble(),
      value: _value.toDouble(),
      onChanged: (value) {
        setState(() {
          _value = value.round();
        });
        widget.onChanged(_value);
      },
    );
  }
}
