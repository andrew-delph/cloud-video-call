// Flutter imports:
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

// Package imports:
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
      content: Container(
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
            ByteBuffer? bytes =
                await controller.localVideoTrack()?.captureFrame();

            return Get.back(result: bytes);
          },
          child: const Text('Take photo'),
        ),
      ],
    );
  }
}
