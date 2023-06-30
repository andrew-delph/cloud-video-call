// Flutter imports:
import 'package:flutter/material.dart';
import 'package:flutter_app/widgets/profile_picture.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';

class ApprovalWidget extends GetView<HomeController> {
  final String userId;
  final Function callback;

  final RxBool sent = false.obs;

  ApprovalWidget(
    this.userId,
    this.callback, {
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Obx(() => AlertDialog(
          title: const Text('Submit Feedback for your chat.'),
          content: Column(children: [
            Text('Do you approve $userId?'),
            ProfilePicture(userId)
          ]),
          actions: [
            TextButton(
              onPressed: sent()
                  ? null
                  : () {
                      callback({"approve": false});
                      sent(true);
                    },
              child: const Text('Reject'),
            ),
            TextButton(
              onPressed: sent()
                  ? null
                  : () {
                      callback({"approve": true});
                      sent(true);
                    },
              child: const Text('Approve'),
            ),
          ],
        ));
  }
}
