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
import '../controllers/options_controller.dart';
import '../utils/utils.dart';
import '../widgets/app_menu_widget.dart';
import '../widgets/feedback_swipe_detector.dart';
import '../widgets/matchmaker_progress.dart';
import '../widgets/video_render_layout.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    PreferencesController preferencesController = Get.find();

    return AppMenu(
        title: 'Home',
        body: controller.obx(
          (state) {
            if (state != null) {
              return state;
            } else {
              return Column(
                children: [
                  const Preferences(),
                  ElevatedButton(
                      onPressed: () async {
                        if (preferencesController.status.isLoading) {
                          // This is not the best way to handle this case.
                          infoSnackbar('Preferences Updating',
                              'Wait for preferences to update.');
                        }

                        if (preferencesController.unsavedChanges()) {
                          await preferencesController.updateAttributes();
                        }
                        await controller.ready();
                      },
                      child: const Text("Start")),
                ],
              );
            }
          },
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

class LeftButtonsOverlay extends GetView<HomeController> {
  LeftButtonsOverlay({super.key});

  final LocalPreferences localPreferences = Get.find();

  final RxBool liked = false.obs;

  @override
  Widget build(BuildContext context) {
    return Obx(() => Positioned(
        top: 20,
        left: 20,
        child: Column(
          children: [
            IconButton(
              tooltip: "Like",
              color: liked() ? Colors.lightGreen : null,
              icon: const Icon(Icons.thumb_up),
              onPressed: () async {
                if (liked()) {
                  await controller.sendChatScore(0);
                } else {
                  await controller.sendChatScore(5);
                }
                liked.toggle();
              },
            ),
            IconButton(
              tooltip: "Block",
              color: Colors.red,
              icon: const Icon(Icons.block),
              onPressed: () async {
                await controller.endChat(true);
                await controller.sendChatScore(-5);
              },
            ),
          ],
        )));
  }
}

class BottomButtonsOverlay extends GetView<HomeController> {
  BottomButtonsOverlay({super.key});

  final LocalPreferences localPreferences = Get.find();

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
                  color: controller.isMicMute() ? Colors.red : null,
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
                  color: controller.isCamHide() ? Colors.red : null,
                  icon: controller.isCamHide()
                      ? const Icon(Icons.videocam_off)
                      : const Icon(Icons.videocam),
                  onPressed: () {
                    controller.isCamHide.toggle();
                  },
                ),
              if (controller.localMediaStream() != null) MediaDeviceButton(),
              if (!controller.isInChat() || localPreferences.autoQueue())
                IconButton(
                  icon: const Icon(Icons.cancel),
                  tooltip: 'Cancel Queue',
                  onPressed: () async {
                    if (controller.isInChat()) {
                      await controller.endChat(!controller.isInChat());
                    }
                    controller.unReady();
                  },
                )
            ],
          )
        ])));
  }
}

class MediaDeviceButton extends GetResponsiveView<HomeController> {
  // display all media devices
  MediaDeviceButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<MediaDeviceInfo>(
      icon: const Icon(Icons.settings),
      itemBuilder: (BuildContext context) {
        return controller.getDeviceEntries();
      },
    );
  }
}
