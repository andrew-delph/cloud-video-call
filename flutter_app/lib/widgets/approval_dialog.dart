// Flutter imports:
import 'package:flutter/material.dart';
import 'package:flutter_app/widgets/profile_picture.dart';

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
      content: Column(
          children: [Text('Do you approve $userId?'), ProfilePicture(userId)]),
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
