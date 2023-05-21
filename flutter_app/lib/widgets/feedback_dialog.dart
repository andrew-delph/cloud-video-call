import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/home_controller.dart';

class FeedbackDialog extends GetView<HomeController> {
  final min = -10.0;
  final max = 10.0;

  final score = 0.0.obs;

  FeedbackDialog({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.blue,
        child: Column(
          children: [
            const Text("Send chat feedback."),
            Slider(
              value: score(),
              min: min,
              max: max,
              onChanged: (newValue) {
                score(newValue);
              },
            ),
            ElevatedButton(
              onPressed: () {
                Get.back(result: score());
              },
              child: const Text('Submit'),
            ),
          ],
        ));
  }
}
