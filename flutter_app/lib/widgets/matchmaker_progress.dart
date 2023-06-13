import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';

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
                const Text(
                  'Finding a match...',
                  style: TextStyle(
                    fontSize: 24.0,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
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