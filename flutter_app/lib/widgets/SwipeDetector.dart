import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_app/utils/utils.dart';

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

    return FutureBuilder<Options>(
      future: Options.getOptions(),
      builder: (BuildContext context, AsyncSnapshot<Options> snapshot) {
        if (snapshot.hasData) {
          final bool confirmFeedback =
              snapshot.data?.getConfirmFeedbackPopup() ?? true;
          return GestureDetector(
              onHorizontalDragUpdate: (details) {
                if (widget.isDragUpdate == null || widget.isDragUpdate!()) {
                  setState(() {
                    _positionX += details.delta.dx;
                  });
                }
              },
              onHorizontalDragEnd: (details) async {
                if (widget.isDragUpdate == null || widget.isDragUpdate!()) {
                  if (validScore) {
                    bool? confirm = confirmFeedback
                        ? await showDialog<bool>(
                            context: context,
                            builder: (BuildContext context) {
                              return AlertDialog(
                                title: const Text('Send Feedback'),
                                content: Text(
                                    'Do you want to end the call with feedback ${score.toInt()}?'),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      snapshot.data
                                          ?.setConfirmFeedbackPopup(false)
                                          .then((value) {
                                        SnackBar snackBar = const SnackBar(
                                          content: Text(
                                              "Confirm feedback popup disabled."),
                                        );

                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(snackBar);
                                        Navigator.of(context).pop(true);
                                      });
                                    },
                                    child: const Text('Disable future popup'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.of(context).pop(false),
                                    child: const Text('Cancel'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.of(context).pop(true),
                                    child: const Text('Send'),
                                  ),
                                ],
                              );
                            },
                          )
                        : true;
                    if (confirm ?? false) {
                      widget.onHorizontalDragEnd(score);
                    }
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
        } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }
}
