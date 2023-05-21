// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
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
    return AlertDialog(
      title: const Text('Submit Feedback for your chat.'),
      content: const Text('Do you want to meet similair chatters?'),
      actions: [
        TextButton(
          onPressed: () => Get.back(result: min),
          child: const Text('Dislike'),
        ),
        TextButton(
          onPressed: () => Get.back(result: max),
          child: const Text('Like'),
        ),
      ],
    );
  }
}
