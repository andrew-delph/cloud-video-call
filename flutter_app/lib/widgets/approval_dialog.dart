// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';

class ApprovalDialog extends GetView<HomeController> {
  final String userId;

  const ApprovalDialog(
    this.userId, {
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Submit Feedback for your chat.'),
      content: Text('Do you approve $userId?'),
      actions: [
        TextButton(
          onPressed: () => Get.back(result: false),
          child: const Text('Reject'),
        ),
        TextButton(
          onPressed: () => Get.back(result: true),
          child: const Text('Approve'),
        ),
      ],
    );
  }
}
