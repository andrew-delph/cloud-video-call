// Dart imports:

// Flutter imports:
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_app/services/local_preferences_service.dart';

// Package imports:
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/services/auth_service.dart';
import '../controllers/home_controller.dart';
import '../routes/app_pages.dart';
import '../widgets/feedback_swipe_detector.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Widget videoRenderLayout = FeedbackSwipeDetector(
        isDragUpdate: () {
          return controller.isInChat();
        },
        onHorizontalDragEnd: (double score) async {
          await controller.endChat(true);
          await controller.sendChatScore(score);
        },
        child: VideoRenderLayout());

    return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: const Text("Home"),
          actions: <Widget>[
            IconButton(
              icon: const Icon(Icons.settings),
              tooltip: 'Options',
              onPressed: () {
                Get.toNamed(Routes.OPTIONS);
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
              onPressed: () async {
                Get.find<AuthService>().signOut();
              },
            ),
          ],
        ),
        body: controller.obx(
          (state) => Flex(
            direction: Axis.horizontal,
            children: [
              Expanded(
                child: Stack(
                  children: [videoRenderLayout, const ButtonsOverlay()],
                ),
              ),
            ],
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
                ? Icons.fullscreen
                : Icons.fullscreen_exit),
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
      double width = min(Get.width / 2, 300);

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
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    primary: Colors.blue, // Set the button color
                    onPrimary: Colors.white, // Set the text color
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(10), // Set the button's shape
                    ),
                    padding: EdgeInsets.all(20), // Make the button larger
                  ),
                  onPressed: () async {
                    if (controller.isInReadyQueue() == false) {
                      controller.queueReady();
                    } else {
                      controller.unReady();
                    }
                  },
                  child: Text((controller.isInReadyQueue() == false)
                      ? 'Ready'
                      : 'Cancel'))
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
      // initialValue: 'selectedMenu',
      // Callback that sets the selected popup menu item.
      itemBuilder: (BuildContext context) {
        return controller.getDeviceEntries();
      },
    );
  }
}
