import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

import '../controllers/home_controller.dart';
import '../screens/home_screen.dart';
import '../services/local_preferences_service.dart';
import 'feedback_swipe_detector.dart';
import 'matchmaker_progress.dart';

class VideoRenderLayout extends GetResponsiveView<HomeController> {
  VideoRenderLayout({super.key});

  final LocalPreferences localPreferences = Get.find();

  Widget localCamera() {
    return Stack(children: [
      Container(
        color: Colors.black,
        child: RTCVideoView(controller.localVideoRenderer()),
      ),
      Positioned(
          top: 10, // get the size of the row buttons..?
          left: 10,
          child: IconButton(
            tooltip: "Fullscreen",
            icon: Icon(localPreferences.fullscreen()
                ? Icons.fullscreen_exit
                : Icons.fullscreen),
            onPressed: () {
              localPreferences.fullscreen.toggle();
            },
          ))
    ]);
  }

  Widget remoteCamera() {
    return Expanded(
      child: Container(
        child: RTCVideoView(controller.remoteVideoRenderer()),
      ),
    );
  }

  Widget render() {
    bool isLandscape = Get.context?.isLandscape ?? true;

    return Obx(() {
      double width = min(Get.width / 4, 300);

      // localPreferences.fullscreen(true);

      List<Widget> orientationList = [
        remoteCamera(),
        if (localPreferences.fullscreen.isTrue) Expanded(child: localCamera())
      ];

      if (!controller.isInChat()) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            const MatchmakerProgress(),
            Positioned(
              top: 20, // get the size of the row buttons..?
              right: 0,
              child: Container(
                alignment: Alignment.bottomRight,
                width: width,
                height: width * controller.localVideoRendererRatioHw(),
                child: localCamera(),
              ),
            )
          ],
        );
      }

      Widget videoRenderLayout = Stack(
        children: [
          if (isLandscape)
            Row(
              children: orientationList,
            )
          else
            Column(children: orientationList),
          if (localPreferences.fullscreen.isFalse)
            Positioned(
              top: 20,
              right: 20,
              child: Container(
                alignment: Alignment.bottomRight,
                width: width,
                height: width * controller.localVideoRendererRatioHw(),
                child: localCamera(),
              ),
            ),
          LeftButtonsOverlay()
        ],
      );
      videoRenderLayout = FeedbackSwipeDetector(
          isDragUpdate: () {
            return controller.isInChat();
          },
          onHorizontalDragEnd: (double score) async {
            await controller.endChat(true);
            // await controller.sendChatScore(score);
          },
          child: videoRenderLayout);

      videoRenderLayout = SizedBox(
          width: 100,
          height: 100,
          child: Stack(
            children: [videoRenderLayout, BottomButtonsOverlay()],
          ));

      return videoRenderLayout;
    });
  }

  // @override
  // Widget tablet() {
  //   return render();
  // }

  @override
  Widget desktop() {
    return render();
  }
}
