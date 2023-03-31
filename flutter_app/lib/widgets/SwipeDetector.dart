import 'dart:math';

import 'package:flutter/cupertino.dart';

class SwipeDetector extends StatefulWidget {
  final Widget child;

  final bool Function()? isDragUpdate;
  final void Function(double score) onHorizontalDragEnd;

  const SwipeDetector(
      {super.key,
      required this.child,
      this.isDragUpdate,
      required this.onHorizontalDragEnd});

  @override
  State<StatefulWidget> createState() {
    return SwipeDetectorState();
  }
}

class SwipeDetectorState extends State<SwipeDetector> {
  double _positionX = 0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onHorizontalDragUpdate: (details) {
        if (widget.isDragUpdate == null || widget.isDragUpdate!()) {
          setState(() {
            _positionX += details.delta.dx;
          });
        }
      },
      onHorizontalDragEnd: (details) {
        if (widget.isDragUpdate == null || widget.isDragUpdate!()) {
          double screenWidth = MediaQuery.of(context).size.width;
          print("width $screenWidth _positionX $_positionX");

          double score = (_positionX / screenWidth) * 10;

          score = max(score, -10);
          score = min(score, 10);

          widget.onHorizontalDragEnd(score);
        }
        setState(() {
          _positionX = 0;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        transform: Matrix4.translationValues(_positionX, 0, 0),
        child: widget.child,
      ),
    );
  }
}
