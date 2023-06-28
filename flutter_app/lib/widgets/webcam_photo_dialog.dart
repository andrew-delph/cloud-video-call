// Flutter imports:

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';

class WebcamPhotoDialog extends GetView<HomeController> {
  const WebcamPhotoDialog({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    controller.initLocalStream();
    return AlertDialog(
      title: const Text('Make a profile picture from your webcam.'),
      content: SizedBox(
        width: 100,
        height: 100,
        child: RTCVideoView(controller.localVideoRenderer()),
      ),
      actions: [
        TextButton(
          onPressed: () => Get.back(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () async {
            return Get.back(result: await controller.takePhoto());
          },
          child: const Text('Take photo'),
        ),
      ],
    );
  }
}
