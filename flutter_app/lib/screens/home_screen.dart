// Dart imports:

// Dart imports:
import 'dart:math';

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/services/local_preferences_service.dart';
import 'package:flutter_app/widgets/preferences_widget.dart';
import '../controllers/home_controller.dart';
import '../widgets/feedback_swipe_detector.dart';
import '../widgets/left_nav_widget.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Widget videoRenderLayout = VideoRenderLayout();

    videoRenderLayout = FeedbackSwipeDetector(
        isDragUpdate: () {
          return controller.isInChat();
        },
        onHorizontalDragEnd: (double score) async {
          await controller.endChat(true);
          await controller.sendChatScore(score);
        },
        child: videoRenderLayout);

    videoRenderLayout = Stack(
      children: [videoRenderLayout, const ButtonsOverlay()],
    );

    return LeftNav(
        title: 'Home',
        body: controller.obx(
          (state) => Obx(
            () => (controller.isInReadyQueue() || controller.isInChat())
                ? videoRenderLayout
                : SingleChildScrollView(
                    child: Column(
                    children: [
                      const Preferences(),
                      ElevatedButton(
                          onPressed: () {
                            controller.ready();
                          },
                          child: const Text("Start"))
                    ],
                  )),
          ),
          onLoading: const CircularProgressIndicator(),
          onError: (error) => Column(
            children: [
              const Text("Connection Error."),
              Text('$error'),
              ElevatedButton(
                  onPressed: () {
                    controller.initSocket();
                  },
                  child: const Text("Reconnect."))
            ],
          ),
        ));
  }
}

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
            color: Colors.white,
            onPressed: () {
              localPreferences.fullscreen.toggle();
            },
          ))
    ]);
  }

  Widget remoteCamera() {
    return Expanded(
      child: Container(
        color: Colors.black,
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

      return Stack(
        children: [
          if (isLandscape)
            Row(
              children: orientationList,
            )
          else
            Column(children: orientationList),
          if (localPreferences.fullscreen.isFalse)
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

class ButtonsOverlay extends GetView<HomeController> {
  const ButtonsOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() => Positioned(
        left: 0,
        right: 0,
        bottom: 20,
        child: Column(children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (controller.isInChat())
                IconButton(
                  tooltip: "End call",
                  icon: const Icon(Icons.call_end),
                  color: Colors.red,
                  onPressed: () async {
                    await controller.endChat(false);
                  },
                ),
              if (controller.localMediaStream() != null)
                IconButton(
                  tooltip: "Mute mic",
                  color: controller.isMicMute() ? Colors.red : Colors.white,
                  icon: controller.isMicMute()
                      ? const Icon(Icons.mic_off)
                      : const Icon(Icons.mic),
                  onPressed: () {
                    controller.isMicMute.toggle();
                  },
                ),
              if (controller.localMediaStream() != null)
                IconButton(
                  tooltip: "Camera off",
                  color: controller.isCamHide() ? Colors.red : Colors.white,
                  icon: controller.isCamHide()
                      ? const Icon(Icons.videocam_off)
                      : const Icon(Icons.videocam),
                  onPressed: () {
                    controller.isCamHide.toggle();
                  },
                ),
              if (controller.localMediaStream() != null) MediaDeviceButton(),
              if (!controller.isInChat())
                IconButton(
                  icon: const Icon(Icons.cancel),
                  color: Colors.white,
                  tooltip: 'Cancel',
                  onPressed: () async {
                    controller.unReady();
                  },
                )
            ],
          )
        ])));
  }
}

class MediaDeviceButton extends GetResponsiveView<HomeController> {
  MediaDeviceButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<MediaDeviceInfo>(
      color: Colors.white,
      icon: const Icon(Icons.settings, color: Colors.white),
      itemBuilder: (BuildContext context) {
        return controller.getDeviceEntries();
      },
    );
  }
}
