import 'dart:math';

import 'package:flutter/material.dart';

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
    double screenWidth = MediaQuery.of(context).size.width;

    calcScore() {
      double score = (_positionX / screenWidth) * 10;

      score = max(score, -10);
      score = min(score, 10);
      return score;
    }

    isValidScore(double score) {
      return score < -1 || score > 1;
    }

    double score = calcScore();
    bool validScore = isValidScore(score);

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
            if (validScore) {
              widget.onHorizontalDragEnd(score);
            }
          }
          setState(() {
            _positionX = 0;
          });
        },
        child: Stack(
          children: [
            AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                transform: Matrix4.translationValues(_positionX, 0, 0),
                child: widget.child),
            Positioned.fill(
                child: Align(
              alignment: Alignment.center,
              child: validScore
                  ? Text(
                      "Feedback=${score.toInt()}",
                      style: TextStyle(
                        color: score > 0 ? Colors.green : Colors.red,
                        fontSize: 70,
                      ),
                    )
                  : Container(),
            ))
          ],
        ));
  }
}
