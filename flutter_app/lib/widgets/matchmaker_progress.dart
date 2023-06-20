// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';

class MatchmakerProgress extends GetView<HomeController> {
  final min = -10.0;
  final max = 10.0;

  const MatchmakerProgress({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.topCenter,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  'Finding a match...',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Obx(() => Text(
                      "Progress: ${controller.matchmakerProgess().toString()}",
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
